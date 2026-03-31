/**
 * Markdown to Reddit-compatible Markdown converter.
 *
 * Reddit natively supports Markdown, so this converter focuses on:
 * - Extracting title from H1
 * - Generating a digest/summary
 * - Cleaning up formatting for Reddit's Markdown flavor
 * - Converting task lists to emoji format
 * - Stripping unsupported HTML
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export interface ConvertResult {
  title: string;
  body: string;
  digest: string;
  images: string[];
}

export class RedditConverter {
  convert(markdownText: string): ConvertResult {
    const title = this.extractTitle(markdownText);
    let body = this.stripH1(markdownText);

    body = this.convertTaskLists(body);
    body = this.stripUnsupportedHtml(body);
    body = this.ensureDoubleNewlines(body);
    body = body.trim();

    const images = this.extractImages(body);
    const digest = this.generateDigest(body);

    return { title, body, digest, images };
  }

  convertFile(inputPath: string): ConvertResult {
    const absPath = resolve(inputPath);
    const text = readFileSync(absPath, 'utf-8');
    return this.convert(text);
  }

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
   * Reddit doesn't support HTML task list checkboxes.
   */
  private convertTaskLists(text: string): string {
    return text
      .replace(/^(\s*)- \[x\]/gm, '$1- ✅')
      .replace(/^(\s*)- \[ \]/gm, '$1- ⬜');
  }

  /**
   * Strip HTML tags that Reddit doesn't render (keeps basic ones).
   */
  private stripUnsupportedHtml(text: string): string {
    return text
      .replace(/<\/?(?:div|span|style|script|section|article|header|footer|nav|aside)[^>]*>/gi, '')
      .replace(/<br\s*\/?>/gi, '\n');
  }

  /**
   * Reddit requires double newlines for paragraph breaks.
   */
  private ensureDoubleNewlines(text: string): string {
    const lines = text.split('\n');
    const result: string[] = [];
    let prevWasText = false;

    for (const line of lines) {
      const trimmed = line.trim();
      const isBlank = trimmed === '';
      const isList = /^[-*+\d]/.test(trimmed);
      const isHeading = trimmed.startsWith('#');
      const isBlockquote = trimmed.startsWith('>');
      const isCodeFence = trimmed.startsWith('```');
      const isSpecial = isList || isHeading || isBlockquote || isCodeFence;

      if (prevWasText && !isBlank && !isSpecial && trimmed.length > 0) {
        const prevTrimmed = result.length > 0 ? result[result.length - 1].trim() : '';
        if (prevTrimmed !== '' && !prevTrimmed.startsWith('#') && !prevTrimmed.startsWith('>')) {
          result.push('');
        }
      }

      result.push(line);
      prevWasText = !isBlank && !isSpecial && trimmed.length > 0;
    }

    return result.join('\n');
  }

  private extractImages(text: string): string[] {
    const images: string[] = [];
    const imgRegex = /!\[[^\]]*\]\(([^)]+)\)/g;
    let match;
    while ((match = imgRegex.exec(text)) !== null) {
      images.push(match[1]);
    }
    return images;
  }

  private generateDigest(text: string, maxLength = 300): string {
    const lines = text.split('\n').filter(l => {
      const t = l.trim();
      return t && !t.startsWith('#') && !t.startsWith('>') && !t.startsWith('```')
        && !t.startsWith('|') && !t.startsWith('- ') && !t.startsWith('* ');
    });

    const firstParagraph = lines[0] ?? '';
    if (firstParagraph.length <= maxLength) return firstParagraph;
    return firstParagraph.slice(0, maxLength - 3).trimEnd() + '...';
  }
}

/**
 * Generate local HTML preview.
 */
export function previewHtml(body: string, title: string): string {
  const escapedBody = body
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reddit Preview - ${title}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #1a1a1b; color: #d7dadc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        .container { max-width: 740px; margin: 20px auto; background: #1a1a1b; border: 1px solid #343536; border-radius: 4px; padding: 16px; }
        .title { font-size: 20px; font-weight: 500; color: #d7dadc; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #343536; }
        .meta { font-size: 12px; color: #818384; margin-bottom: 16px; }
        .body { white-space: pre-wrap; font-size: 14px; line-height: 1.6; color: #d7dadc; }
        .body code { background: #272729; padding: 2px 4px; border-radius: 2px; font-size: 13px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="title">${title}</div>
        <div class="meta">Posted by u/you · Preview</div>
        <div class="body">${escapedBody}</div>
    </div>
</body>
</html>`;
}
