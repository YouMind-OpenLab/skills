/**
 * Content adapter: Markdown -> Kit-ready HTML.
 */

import MarkdownIt from 'markdown-it';

export interface AdaptOptions {
  markdown: string;
  subject?: string;
  description?: string;
  previewText?: string;
  thumbnailUrl?: string;
  thumbnailAlt?: string;
}

export interface AdaptResult {
  html: string;
  subject: string;
  description?: string;
  previewText: string;
  thumbnailUrl?: string;
  thumbnailAlt?: string;
}

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: false,
});

function extractSubject(markdown: string, fallbackSubject?: string): string {
  if (fallbackSubject) return fallbackSubject;
  const h1Match = markdown.match(/^#\s+(.+)$/m);
  if (h1Match) return h1Match[1].trim();
  const firstLine = markdown.split('\n').find((line) => line.trim().length > 0);
  return firstLine?.replace(/^#+\s*/, '').trim() || 'Untitled';
}

function toPlainText(markdown: string): string {
  return markdown
    .replace(/^#\s+.+$/m, '')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[([^\]]*)\]\(.*?\)/g, '$1')
    .replace(/#{1,6}\s+/g, '')
    .replace(/[*_~`>]/g, '')
    .replace(/\|.*\|/g, '')
    .replace(/-{3,}/g, '')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

function extractDescription(markdown: string, fallbackDescription?: string): string | undefined {
  if (fallbackDescription?.trim()) {
    return fallbackDescription.trim();
  }
  const lines = markdown
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.startsWith('# '));
  return lines[0]?.slice(0, 180);
}

function generatePreviewText(markdown: string, fallbackPreviewText?: string, maxLen = 160): string {
  if (fallbackPreviewText?.trim()) {
    return fallbackPreviewText.trim();
  }
  const plain = toPlainText(markdown);
  if (plain.length <= maxLen) return plain;
  const slice = plain.slice(0, maxLen);
  const cutoff = slice.lastIndexOf(' ');
  return `${slice.slice(0, cutoff > 80 ? cutoff : maxLen).trim()}...`;
}

export async function adaptForKit(options: AdaptOptions): Promise<AdaptResult> {
  const { markdown } = options;
  const subject = extractSubject(markdown, options.subject);
  const bodyMarkdown = markdown.replace(/^#\s+.+\n?/, '');
  const html = md.render(bodyMarkdown);

  return {
    html,
    subject,
    description: extractDescription(markdown, options.description),
    previewText: generatePreviewText(markdown, options.previewText),
    thumbnailUrl: options.thumbnailUrl,
    thumbnailAlt: options.thumbnailAlt,
  };
}

export function convertToHtml(markdown: string): {
  html: string;
  subject: string;
  previewText: string;
} {
  const subject = extractSubject(markdown);
  const bodyMarkdown = markdown.replace(/^#\s+.+\n?/, '');
  const html = md.render(bodyMarkdown);
  return {
    html,
    subject,
    previewText: generatePreviewText(markdown),
  };
}
