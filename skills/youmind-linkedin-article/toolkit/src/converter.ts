/**
 * Markdown to LinkedIn content converter — dual mode (Post / Article).
 *
 * Post mode: Markdown → plain text with minimal formatting (≤3000 chars)
 * Article mode: Markdown → clean HTML for LinkedIn articles
 */

import * as cheerio from 'cheerio';
import hljs from 'highlight.js';
import MarkdownIt from 'markdown-it';
import taskLists from 'markdown-it-task-lists';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { processMathInHtml, enhanceCodeBlocks, processMermaidBlocks } from 'youmind-content-core';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PostConvertResult {
  text: string;
  hashtags: string[];
  images: string[];
}

export interface ArticleConvertResult {
  title: string;
  html: string;
  description: string;
  images: string[];
}

// ---------------------------------------------------------------------------
// Converter
// ---------------------------------------------------------------------------

export class LinkedInConverter {
  private md: MarkdownIt;

  constructor() {
    this.md = new MarkdownIt({
      html: true,
      breaks: true,
      linkify: true,
      typographer: true,
      highlight: (str: string, lang: string): string => {
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

  // -------------------------------------------------------------------------
  // Post mode — plain text output
  // -------------------------------------------------------------------------

  convertToPost(markdownText: string, maxChars = 3000): PostConvertResult {
    const title = this.extractTitle(markdownText);
    let text = this.stripH1(markdownText);

    text = this.markdownToPlainText(text);
    if (title) {
      text = `${title}\n\n${text}`;
    }

    const images = this.extractMarkdownImages(markdownText);
    const hashtags = this.extractHashtags(markdownText);

    if (text.length > maxChars) {
      text = text.slice(0, maxChars - 3).trimEnd() + '...';
    }

    return { text, hashtags, images };
  }

  // -------------------------------------------------------------------------
  // Article mode — HTML output
  // -------------------------------------------------------------------------

  convertToArticle(markdownText: string): ArticleConvertResult {
    const title = this.extractTitle(markdownText);
    let body = this.stripH1(markdownText);

    let html = this.md.render(body);

    html = processMathInHtml(html);

    const $ = cheerio.load(html);
    processMermaidBlocks($);
    enhanceCodeBlocks($);

    const images = this.processImages($);

    html = $('body').html() || '';
    const description = this.generateDescription(html);

    return { title, html, description, images };
  }

  // -------------------------------------------------------------------------
  // File-based convenience methods
  // -------------------------------------------------------------------------

  convertFileToPost(inputPath: string, maxChars?: number): PostConvertResult {
    const text = readFileSync(resolve(inputPath), 'utf-8');
    return this.convertToPost(text, maxChars);
  }

  convertFileToArticle(inputPath: string): ArticleConvertResult {
    const text = readFileSync(resolve(inputPath), 'utf-8');
    return this.convertToArticle(text);
  }

  // -------------------------------------------------------------------------
  // Internal methods
  // -------------------------------------------------------------------------

  private extractTitle(text: string): string {
    for (const line of text.split('\n')) {
      const stripped = line.trim();
      if (stripped.startsWith('# ') && !stripped.startsWith('## ')) {
        return stripped.slice(2).trim();
      }
    }
    return '';
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

  /**
   * Convert Markdown to LinkedIn-friendly plain text.
   */
  private markdownToPlainText(text: string): string {
    let result = text;

    // Headers → bold-style text (LinkedIn doesn't render # as headers in posts)
    result = result.replace(/^#{2,6}\s+(.+)$/gm, '\n$1\n');

    // Bold/italic — LinkedIn posts support **bold** natively now
    // Keep as-is

    // Unordered lists → bullet style
    result = result.replace(/^[-*+]\s+/gm, '• ');

    // Task lists
    result = result.replace(/^(\s*)- \[x\]/gm, '$1✅');
    result = result.replace(/^(\s*)- \[ \]/gm, '$1⬜');

    // Links → "text (url)" for readability
    result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)');

    // Images → strip (handled separately)
    result = result.replace(/!\[[^\]]*\]\([^)]+\)/g, '');

    // Code blocks → keep content, strip fences
    result = result.replace(/```[\w]*\n([\s\S]*?)```/g, '\n$1\n');

    // Inline code → keep backticks (LinkedIn renders them)
    // Horizontal rules
    result = result.replace(/^---+$/gm, '—————');

    // Clean up excessive blank lines
    result = result.replace(/\n{3,}/g, '\n\n');

    return result.trim();
  }

  private extractMarkdownImages(text: string): string[] {
    const images: string[] = [];
    const imgRegex = /!\[[^\]]*\]\(([^)]+)\)/g;
    let match;
    while ((match = imgRegex.exec(text)) !== null) {
      images.push(match[1]);
    }
    return images;
  }

  private extractHashtags(text: string): string[] {
    const tags: string[] = [];
    const tagRegex = /#(\w{2,})/g;
    let match;
    while ((match = tagRegex.exec(text)) !== null) {
      if (!tags.includes(match[1])) tags.push(match[1]);
    }
    return tags;
  }

  private processImages($: cheerio.CheerioAPI): string[] {
    const images: string[] = [];
    $('img').each((_, img) => {
      const src = $(img).attr('src') || '';
      if (src) images.push(src);
      $(img).attr('style', 'max-width: 100%; height: auto; display: block; margin: 24px auto');
    });
    return images;
  }

  private generateDescription(html: string, maxLength = 200): string {
    const $ = cheerio.load(html);
    let text = $.text().replace(/\s+/g, ' ').trim();
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - 3).trimEnd() + '...';
  }
}

// ---------------------------------------------------------------------------
// HTML Preview
// ---------------------------------------------------------------------------

export function previewHtml(
  content: string, title: string, mode: 'post' | 'article',
): string {
  const bodyContent = mode === 'post'
    ? `<pre style="white-space: pre-wrap; font-family: inherit; margin: 0;">${content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`
    : content;

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LinkedIn Preview - ${title}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #f3f2ef; font-family: -apple-system, system-ui, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        .container { max-width: 560px; margin: 20px auto; background: #fff; border-radius: 8px; box-shadow: 0 0 0 1px rgba(0,0,0,0.08); }
        .header { padding: 16px 16px 0; display: flex; align-items: center; gap: 8px; }
        .avatar { width: 48px; height: 48px; border-radius: 50%; background: #0a66c2; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 600; font-size: 18px; }
        .meta { font-size: 14px; }
        .meta .name { font-weight: 600; color: rgba(0,0,0,0.9); }
        .meta .time { color: rgba(0,0,0,0.6); font-size: 12px; }
        .badge { background: #0a66c2; color: #fff; font-size: 10px; padding: 2px 6px; border-radius: 3px; margin-left: 4px; }
        .body { padding: 16px; font-size: 14px; line-height: 1.5; color: rgba(0,0,0,0.9); }
        .body h2 { font-size: 18px; margin: 16px 0 8px; }
        .body h3 { font-size: 16px; margin: 12px 0 6px; }
        .body p { margin: 8px 0; }
        .body pre { background: #f3f2ef; padding: 12px; border-radius: 4px; overflow-x: auto; font-size: 13px; margin: 12px 0; }
        .body code { background: #f3f2ef; padding: 1px 4px; border-radius: 2px; font-size: 13px; }
        .body blockquote { border-left: 3px solid #0a66c2; padding-left: 12px; margin: 12px 0; color: rgba(0,0,0,0.6); }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="avatar">Y</div>
            <div class="meta">
                <div class="name">You <span class="badge">${mode}</span></div>
                <div class="time">Preview · Just now</div>
            </div>
        </div>
        <div class="body">${bodyContent}</div>
    </div>
</body>
</html>`;
}
