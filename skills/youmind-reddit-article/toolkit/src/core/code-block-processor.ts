/**
 * Code block enhancer — macOS-style window chrome + hljs inline styles.
 * Converts highlight.js CSS classes to inline styles for platforms
 * that don't support <style> tags (WeChat, LinkedIn articles, etc.).
 */

import type * as cheerio from 'cheerio';

const HLJS_COLOR_MAP: Record<string, string> = {
  'hljs-comment': 'color: #5c6370;',
  'hljs-quote': 'color: #5c6370;',
  'hljs-variable': 'color: #e06c75;',
  'hljs-template-variable': 'color: #e06c75;',
  'hljs-attribute': 'color: #e06c75;',
  'hljs-tag': 'color: #e06c75;',
  'hljs-name': 'color: #e06c75;',
  'hljs-regexp': 'color: #e06c75;',
  'hljs-link': 'color: #56b6c2;',
  'hljs-selector-id': 'color: #e06c75;',
  'hljs-selector-class': 'color: #e5c07b;',
  'hljs-number': 'color: #d19a66;',
  'hljs-meta': 'color: #e5c07b;',
  'hljs-built_in': 'color: #e5c07b;',
  'hljs-builtin-name': 'color: #e5c07b;',
  'hljs-literal': 'color: #d19a66;',
  'hljs-type': 'color: #e5c07b;',
  'hljs-params': 'color: #abb2bf;',
  'hljs-string': 'color: #98c379;',
  'hljs-symbol': 'color: #98c379;',
  'hljs-bullet': 'color: #98c379;',
  'hljs-title': 'color: #61afef;',
  'hljs-section': 'color: #61afef;',
  'hljs-keyword': 'color: #c678dd;',
  'hljs-selector-tag': 'color: #e06c75;',
  'hljs-emphasis': 'font-style: italic;',
  'hljs-strong': 'font-weight: bold;',
};

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

function preserveSpaces(html: string): string {
  const parts = html.split(/(<[^>]+>)/);

  return parts
    .map((part) => {
      if (part.startsWith('<')) return part;
      return part
        .replace(/ /g, '&nbsp;')
        .replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;');
    })
    .join('');
}

function wrapLines(html: string): string {
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

function macosHeader(): string {
  const headerStyle =
    'display: flex; align-items: center; padding: 10px 12px; background: #21252b; border-bottom: 1px solid #181a1f;';
  const dots = [
    { color: '#fc625d' },
    { color: '#fdbc40' },
    { color: '#35cd4b' },
  ];
  const dotsHtml = dots
    .map(
      (d) =>
        `<span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background: ${d.color}; margin-right: 8px; font-size: 0; line-height: 0; overflow: hidden;">&nbsp;</span>`
    )
    .join('');

  return `<section style="${headerStyle}">${dotsHtml}</section>`;
}

export function enhanceCodeBlocks($: cheerio.CheerioAPI): void {
  $('pre').each((_, pre) => {
    const code = $(pre).find('code');
    if (!code.length) return;

    convertHljsToInlineStyles($, code);
    let codeHtml = code.html() || '';

    codeHtml = preserveSpaces(codeHtml);

    const wrappedHtml = wrapLines(codeHtml);

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
