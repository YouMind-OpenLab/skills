/**
 * Content adapter: Markdown -> Beehiiv-ready HTML.
 */

import MarkdownIt from 'markdown-it';

export interface AdaptOptions {
  markdown: string;
  title?: string;
  subtitle?: string;
  contentTags?: string[];
  thumbnailImageUrl?: string;
}

export interface AdaptResult {
  html: string;
  title: string;
  subtitle?: string;
  previewText: string;
  contentTags: string[];
  thumbnailImageUrl?: string;
}

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: false,
});

function extractTitle(markdown: string, fallbackTitle?: string): string {
  if (fallbackTitle) return fallbackTitle;
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

function extractSubtitle(markdown: string, fallbackSubtitle?: string): string | undefined {
  if (fallbackSubtitle?.trim()) {
    return fallbackSubtitle.trim();
  }
  const lines = markdown
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.startsWith('# '));
  return lines[0]?.slice(0, 140);
}

function generatePreviewText(markdown: string, maxLen = 160): string {
  const plain = toPlainText(markdown);
  if (plain.length <= maxLen) return plain;
  const slice = plain.slice(0, maxLen);
  const cutoff = slice.lastIndexOf(' ');
  return `${slice.slice(0, cutoff > 80 ? cutoff : maxLen).trim()}...`;
}

function buildTags(contentTags: string[]): string[] {
  return contentTags
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 10);
}

export async function adaptForBeehiiv(options: AdaptOptions): Promise<AdaptResult> {
  const { markdown } = options;
  const title = extractTitle(markdown, options.title);
  const bodyMarkdown = markdown.replace(/^#\s+.+\n?/, '');
  const html = md.render(bodyMarkdown);

  return {
    html,
    title,
    subtitle: extractSubtitle(markdown, options.subtitle),
    previewText: generatePreviewText(markdown),
    contentTags: buildTags(options.contentTags || []),
    thumbnailImageUrl: options.thumbnailImageUrl,
  };
}

export function convertToHtml(markdown: string): {
  html: string;
  title: string;
  previewText: string;
} {
  const title = extractTitle(markdown);
  const bodyMarkdown = markdown.replace(/^#\s+.+\n?/, '');
  const html = md.render(bodyMarkdown);
  return {
    html,
    title,
    previewText: generatePreviewText(markdown),
  };
}
