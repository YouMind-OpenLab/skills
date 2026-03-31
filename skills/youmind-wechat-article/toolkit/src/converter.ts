/**
 * Markdown to WeChat-compatible HTML converter.
 *
 * Uses YouMind's dynamic theme engine + cheerio for robust HTML manipulation.
 * Much better HTML processing than Python's BeautifulSoup.
 */

import * as cheerio from 'cheerio';
import hljs from 'highlight.js';
import MarkdownIt from 'markdown-it';
import taskLists from 'markdown-it-task-lists';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { enhanceCodeBlocks } from './code-block-processor.js';
import { processMathInHtml } from './math-processor.js';
import { processMermaidBlocks } from './mermaid-processor.js';
import {
  type FontFamily,
  type HeadingSize,
  type ParagraphSpacing,
  type Theme,
  type ThemeKey,
  type ThemeOptions,
  generateTheme,
} from './theme-engine.js';

export interface ConvertResult {
  html: string;
  title: string;
  digest: string;
  images: string[];
}

export interface ConverterOptions extends ThemeOptions {
  /** 是否显示 YouMind logo 水印 */
  showLogo?: boolean;
  /** 直接传入自定义主题对象，跳过 generateTheme */
  customTheme?: Theme;
}

export class WeChatConverter {
  private theme: Theme;
  private md: MarkdownIt;
  private showLogo: boolean;

  constructor(options: ConverterOptions = {}) {
    this.theme = options.customTheme ?? generateTheme(options);
    this.showLogo = options.showLogo ?? false;
    this.md = new MarkdownIt({
      html: true,
      breaks: true,
      linkify: true,
      typographer: true,
      highlight: (str: string, lang: string): string => {
        // Mermaid 代码块保留原样，后续由 mermaid-processor 处理
        if (lang === 'mermaid') {
          return `<pre><code class="language-mermaid">${MarkdownIt().utils.escapeHtml(str)}</code></pre>`;
        }
        if (lang && hljs.getLanguage(lang)) {
          try {
            return `<pre><code class="hljs language-${lang}">${hljs.highlight(str, { language: lang }).value}</code></pre>`;
          } catch { /* fallthrough */ }
        }
        return `<pre><code class="hljs">${MarkdownIt().utils.escapeHtml(str)}</code></pre>`;
      },
    });
    this.md.use(taskLists, { enabled: true, label: true, labelAfter: false });
  }

  getTheme(): Theme {
    return this.theme;
  }

  convert(markdownText: string): ConvertResult {
    const title = this.extractTitle(markdownText);
    markdownText = this.stripH1(markdownText);
    markdownText = this.fixCjkEmphasis(markdownText);

    let html = this.md.render(markdownText);
    html = html.replace(/\u200A/g, '');

    // 数学公式: 将 $...$ 和 $$...$$ 转换为 SVG（在 cheerio 之前处理纯文本更可靠）
    html = processMathInHtml(html);

    const $ = cheerio.load(html);

    // Mermaid 图表: 将 ```mermaid 代码块渲染为 PNG 图片
    processMermaidBlocks($);

    // 代码块: macOS 风格 + hljs 语法高亮内联样式
    enhanceCodeBlocks($);

    const images = this.processImages($);

    // 任务列表: 将 <input> checkbox 转换为微信兼容的样式化 span
    this.convertTaskListCheckboxes($);

    this.applyInlineStyles($);
    this.applyWeChatFixes($);

    if (this.showLogo) {
      this.addLogo($);
    }

    html = $('body').html() || '';
    const digest = this.generateDigest(html);

    return { html, title, digest, images };
  }

  convertFile(inputPath: string): ConvertResult {
    const absPath = resolve(inputPath);
    const text = readFileSync(absPath, 'utf-8');
    return this.convert(text);
  }

  // --- Internal Methods ---

  private extractTitle(text: string): string {
    for (const line of text.split('\n')) {
      const stripped = line.trim();
      if (stripped.startsWith('# ') && !stripped.startsWith('## ')) {
        return stripped.slice(2).trim();
      }
    }
    return '';
  }

  /**
   * Fix CJK emphasis: markdown-it's flanking delimiter algorithm fails when
   * closing emphasis (e.g. **) is preceded by CJK punctuation and followed
   * by a CJK character — e.g. **第一，去体检。**不是 won't bold.
   *
   * Inserts a hair space (U+200A, recognized as whitespace by markdown-it)
   * after the closing marker so it passes the right-flanking test.
   * The hair space is stripped from rendered HTML after markdown-it runs.
   */
  private fixCjkEmphasis(text: string): string {
    return text.replace(
      /([\u3000-\u303F\uFF01-\uFF60\u2018-\u201F\u2026\u2014\u2013\u00B7])(\*{1,2}|_{1,2})([\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF])/g,
      '$1$2\u200A$3',
    );
  }

  private stripH1(text: string): string {
    return text
      .split('\n')
      .filter((line) => {
        const stripped = line.trim();
        return !(stripped.startsWith('# ') && !stripped.startsWith('## '));
      })
      .join('\n');
  }

  private processImages($: cheerio.CheerioAPI): string[] {
    const images: string[] = [];
    $('img').each((_, img) => {
      const src = $(img).attr('src') || '';
      if (src) images.push(src);

      const existing = $(img).attr('style') || '';
      if (!existing.includes('max-width')) {
        const additions = 'max-width: 100%; height: auto; display: block; margin: 24px auto';
        $(img).attr('style', existing ? `${existing}; ${additions}` : additions);
      }
    });
    return images;
  }

  /**
   * 将任务列表的 <input> checkbox 转换为样式化的 <span>
   * 微信公众号不支持 <input> 元素
   */
  private convertTaskListCheckboxes($: cheerio.CheerioAPI): void {
    const s = this.theme.styles;
    const accentColor = s.taskListItemCheckbox?.match(/accent-color:\s*([^;]+)/)?.[1]?.trim() || this.theme.color;

    $('.task-list-item-checkbox').each((_, elem) => {
      const isChecked = $(elem).is('[checked]');

      if (isChecked) {
        $(elem).replaceWith(
          `<span style="display: inline-block; width: 16px; height: 16px; margin-right: 8px; background-color: ${accentColor}; color: #ffffff; border-radius: 3px; text-align: center; line-height: 16px; font-size: 13px; font-weight: bold; vertical-align: middle;">&#10003;</span>`
        );
      } else {
        $(elem).replaceWith(
          `<span style="display: inline-block; width: 16px; height: 16px; margin-right: 8px; background-color: #ffffff; border: 1.5px solid #d1d5db; border-radius: 3px; text-align: center; line-height: 16px; font-size: 13px; vertical-align: middle;">&nbsp;</span>`
        );
      }
    });
  }

  private applyInlineStyles($: cheerio.CheerioAPI): void {
    const s = this.theme.styles;

    // 标签 -> 样式映射
    const tagMap: Record<string, string> = {
      h1: s.h1,
      h2: s.h2,
      h3: s.h3,
      h4: s.h4,
      h5: s.h5,
      h6: s.h6,
      p: s.p,
      strong: s.strong,
      em: s.em,
      s: s.strike,
      del: s.strike,
      u: s.u,
      a: s.a,
      blockquote: s.blockquote,
      code: s.code,
      hr: s.hr,
      img: s.img,
      table: s.table,
      th: s.th,
      td: s.td,
    };

    for (const [tag, style] of Object.entries(tagMap)) {
      if (!style) continue;
      $(tag).each((_, elem) => {
        // 代码块内的 code 单独处理
        if (tag === 'code' && $(elem).parent('pre').length) return;

        // 代码块内的 p/span 等不应用全局样式，避免覆盖代码高亮
        if ($(elem).closest('pre[data-codeblock]').length) return;

        const existing = $(elem).attr('style') || '';
        $(elem).attr('style', existing ? `${existing}; ${style}` : style);
      });
    }

    // 列表: 区分普通列表和任务列表
    $('ul').each((_, elem) => {
      if ($(elem).hasClass('contains-task-list')) {
        $(elem).attr('style', s.taskList);
      } else {
        const existing = $(elem).attr('style') || '';
        $(elem).attr('style', existing ? `${existing}; ${s.ul}` : s.ul);
      }
    });

    $('ol').each((_, elem) => {
      const existing = $(elem).attr('style') || '';
      $(elem).attr('style', existing ? `${existing}; ${s.ol}` : s.ol);
    });

    $('li').each((_, elem) => {
      if ($(elem).hasClass('task-list-item')) {
        $(elem).attr('style', s.taskListItem);
      } else {
        const existing = $(elem).attr('style') || '';
        $(elem).attr('style', existing ? `${existing}; ${s.li}` : s.li);
      }

      // markdown-it wraps li content in <p> tags, whose paragraph margin causes
      // excessive spacing between list items. Strip existing margin then set to 0.
      $(elem).children('p').each((_, p) => {
        const pStyle = ($(p).attr('style') || '')
          .replace(/margin[^;]*(!important)?;?/g, '')
          .replace(/;;\s*/g, '; ')
          .replace(/(^;\s*|;\s*$)/g, '')
          .trim();
        const compact = 'margin: 0 !important';
        $(p).attr('style', pStyle ? `${compact}; ${pStyle}` : compact);
      });
    });

    // 代码块样式已由 code-block-processor 处理（macOS 风格 + hljs 高亮）
    // 仅处理没有被增强的 pre 标签（纯 HTML pre）
    $('pre').each((_, pre) => {
      const existing = $(pre).attr('style') || '';
      if (!existing) {
        $(pre).attr('style', s.pre);
      }
    });

    // 表格包裹
    if (s.tableWrapper) {
      $('table').each((_, table) => {
        $(table).wrap(`<div style="${s.tableWrapper}"></div>`);
      });
    }
  }

  private applyWeChatFixes($: cheerio.CheerioAPI): void {
    const textColor = '#333333';

    // 确保所有 p 标签有显式颜色（跳过代码块内的）
    $('p').each((_, p) => {
      if ($(p).closest('pre[data-codeblock]').length) return;
      const style = $(p).attr('style') || '';
      if (!style.includes('color')) {
        $(p).attr('style', style ? `${style}; color: ${textColor}` : `color: ${textColor}`);
      }
    });

    // 确保 pre 保留空白
    $('pre').each((_, pre) => {
      const style = $(pre).attr('style') || '';
      if (!style.includes('white-space')) {
        const ws = 'white-space: pre-wrap; word-wrap: break-word';
        $(pre).attr('style', style ? `${style}; ${ws}` : ws);
      }
    });

    // 移除微信不支持的属性
    $('[class]').each((_, elem) => {
      // 保留 class 以防有用，但微信会忽略它们
    });
  }

  private addLogo($: cheerio.CheerioAPI): void {
    const logoHtml = `
      <div style="text-align: center; padding: 24px 0 8px; opacity: 0.4; font-size: 12px; color: #999;">
        Powered by YouMind
      </div>`;
    $('body').append(logoHtml);
  }

  private generateDigest(html: string, maxBytes = 120): string {
    const $ = cheerio.load(html);
    let text = $.text().replace(/\s+/g, ' ').trim();

    const ellipsis = '...';
    const encoded = Buffer.from(text, 'utf-8');
    if (encoded.length <= maxBytes) return text;

    const targetBytes = maxBytes - Buffer.byteLength(ellipsis, 'utf-8');
    // 按字符逐个裁剪，确保不截断 UTF-8 字符
    let result = '';
    let bytes = 0;
    for (const char of text) {
      const charBytes = Buffer.byteLength(char, 'utf-8');
      if (bytes + charBytes > targetBytes) break;
      result += char;
      bytes += charBytes;
    }

    return result.trimEnd() + ellipsis;
  }
}

/**
 * 生成完整 HTML 用于浏览器预览（仅本地预览，非微信发布用）
 */
export function previewHtml(bodyHtml: string, theme: Theme): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preview - ${theme.name}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            ${theme.styles.container}
            background: #f5f5f5;
        }
        .preview-container {
            background: #ffffff;
            max-width: 720px;
            margin: 20px auto;
            padding: 32px;
            box-shadow: 0 2px 12px rgba(0,0,0,0.08);
            border-radius: 8px;
        }
        .preview-header {
            text-align: center;
            padding: 16px 0 24px;
            border-bottom: 1px solid #eee;
            margin-bottom: 24px;
        }
        .preview-header h3 {
            margin: 0; color: #666; font-size: 14px; font-weight: 400;
        }
        .preview-header .theme-badge {
            display: inline-block;
            background: ${theme.color};
            color: #fff;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            margin-top: 8px;
        }
    </style>
</head>
<body>
    <div class="preview-container">
        <div class="preview-header">
            <h3>${theme.name} | ${theme.color}</h3>
            <span class="theme-badge">${theme.key}</span>
        </div>
        ${bodyHtml}
    </div>
</body>
</html>`;
}
