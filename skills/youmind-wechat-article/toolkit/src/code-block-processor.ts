/**
 * 代码块增强处理器
 * 将 pre>code 代码块转换为 macOS 窗口风格，带语法高亮内联样式
 *
 * 功能:
 * - macOS 风格顶部栏（红黄绿三个圆点）
 * - highlight.js class 转换为内联 style（微信不支持 CSS class）
 * - 空格/Tab 保留（微信会压缩空白字符）
 * - 每行独立包裹，支持横向滚动
 *
 * 移植自 YouMind 编辑器的 renderer.ts
 */

import type * as cheerio from 'cheerio';

// --- hljs class -> 内联样式映射 (Atom One Dark 配色，适配 #282c34 深色背景) ---

const HLJS_COLOR_MAP: Record<string, string> = {
  // 注释
  'hljs-comment': 'color: #5c6370;',
  'hljs-quote': 'color: #5c6370;',

  // 变量、标签
  'hljs-variable': 'color: #e06c75;',
  'hljs-template-variable': 'color: #e06c75;',
  'hljs-attribute': 'color: #e06c75;',
  'hljs-tag': 'color: #e06c75;',
  'hljs-name': 'color: #e06c75;',
  'hljs-regexp': 'color: #e06c75;',
  'hljs-link': 'color: #56b6c2;',
  'hljs-selector-id': 'color: #e06c75;',
  'hljs-selector-class': 'color: #e5c07b;',

  // 数字、字面量
  'hljs-number': 'color: #d19a66;',
  'hljs-meta': 'color: #e5c07b;',
  'hljs-built_in': 'color: #e5c07b;',
  'hljs-builtin-name': 'color: #e5c07b;',
  'hljs-literal': 'color: #d19a66;',
  'hljs-type': 'color: #e5c07b;',
  'hljs-params': 'color: #abb2bf;',

  // 字符串
  'hljs-string': 'color: #98c379;',
  'hljs-symbol': 'color: #98c379;',
  'hljs-bullet': 'color: #98c379;',

  // 函数名、标题
  'hljs-title': 'color: #61afef;',
  'hljs-section': 'color: #61afef;',

  // 关键字
  'hljs-keyword': 'color: #c678dd;',
  'hljs-selector-tag': 'color: #e06c75;',

  // 样式修饰
  'hljs-emphasis': 'font-style: italic;',
  'hljs-strong': 'font-weight: bold;',
};

/**
 * 将 hljs class 转换为内联 style
 * 微信公众号不支持 CSS class，必须使用内联样式
 */
function convertHljsToInlineStyles($: cheerio.CheerioAPI, container: ReturnType<cheerio.CheerioAPI>): void {
  container.find('span[class]').each((_, span) => {
    const classes = ($(span).attr('class') || '').split(/\s+/);
    const styles: string[] = [];

    for (const cls of classes) {
      if (cls.startsWith('hljs-')) {
        const style = HLJS_COLOR_MAP[cls];
        if (style) styles.push(style);
      }
    }

    if (styles.length > 0) {
      $(span).attr('style', styles.join(' '));
      $(span).removeAttr('class');
    }
  });
}

/**
 * 保留代码中的空格和制表符
 * 微信公众号可能不完全支持 white-space: pre，需要将空格转为 &nbsp;
 */
function preserveSpaces(html: string): string {
  // 先处理 HTML 标签外的文本中的空格
  // 分割 HTML 标签和文本
  const parts = html.split(/(<[^>]+>)/);

  return parts
    .map((part) => {
      // HTML 标签不处理
      if (part.startsWith('<')) return part;
      // 文本部分: 空格 -> &nbsp;, Tab -> 4×&nbsp;
      return part
        .replace(/ /g, '&nbsp;')
        .replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;');
    })
    .join('');
}

/**
 * 将代码按行包裹，每行一个 <p>，支持横向滚动
 */
function wrapLines(html: string): string {
  // 按 \n 和 <br> 分割为行
  const normalized = html.replace(/<br\s*\/?>/gi, '\n');
  const lines = normalized.split('\n');

  const lineStyle =
    'margin: 0; padding: 0; white-space: nowrap; overflow: visible; width: max-content; min-width: 100%; line-height: 1.6;';
  const emptyLineStyle =
    'margin: 0; padding: 0; white-space: nowrap; line-height: 1.6; height: 1.6em;';
  const spacerHtml = '<span style="display: inline-block; width: 20px;">&nbsp;</span>';

  return lines
    .map((line) => {
      if (!line.trim() && !line.includes('&nbsp;')) {
        return `<p style="${emptyLineStyle}">&nbsp;</p>`;
      }
      return `<p style="${lineStyle}">${line}${spacerHtml}</p>`;
    })
    .join('');
}

/**
 * 生成 macOS 风格代码块头部 HTML
 */
function macosHeader(): string {
  const headerStyle =
    'display: flex; align-items: center; padding: 10px 12px; background: #21252b; border-bottom: 1px solid #181a1f;';
  const dots = [
    { color: '#fc625d', label: 'close' },
    { color: '#fdbc40', label: 'minimize' },
    { color: '#35cd4b', label: 'maximize' },
  ];
  const dotsHtml = dots
    .map(
      (d) =>
        `<span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background: ${d.color}; margin-right: 8px; font-size: 0; line-height: 0; overflow: hidden;">&nbsp;</span>`
    )
    .join('');

  return `<section style="${headerStyle}">${dotsHtml}</section>`;
}

/**
 * 增强代码块：macOS 风格 + 语法高亮内联样式
 * 替换 converter.ts 中原有的 enhanceCodeBlocks + 代码块样式
 */
export function enhanceCodeBlocks($: cheerio.CheerioAPI): void {
  $('pre').each((_, pre) => {
    const code = $(pre).find('code');
    if (!code.length) return;

    // 提取原始高亮后的 HTML
    let codeHtml = code.html() || '';

    // 1. 转换 hljs class 为内联 style
    convertHljsToInlineStyles($, code);
    codeHtml = code.html() || '';

    // 2. 保留空格
    codeHtml = preserveSpaces(codeHtml);

    // 3. 按行包裹
    const wrappedHtml = wrapLines(codeHtml);

    // 4. 组装 macOS 风格代码块
    const containerStyle =
      'border-radius: 8px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15); text-align: left; margin: 20px 0; padding: 0; background: #282c34; overflow: hidden;';
    const codeAreaStyle =
      "padding: 16px 0 0 20px; color: #abb2bf; background: #282c34; font-family: 'SF Mono', Consolas, Monaco, 'Courier New', monospace; font-size: 14px; line-height: 1.6; margin: 0; -webkit-font-smoothing: antialiased; overflow-x: auto; overflow-y: hidden;";

    const newHtml =
      `<pre style="${containerStyle}" data-codeblock="true">` +
      macosHeader() +
      `<section style="${codeAreaStyle}">${wrappedHtml}</section>` +
      `</pre>`;

    $(pre).replaceWith(newHtml);
  });
}
