/**
 * Content adapter: Markdown → WordPress-ready HTML.
 *
 * Pure / synchronous — no API calls. Tag and category name resolution is
 * handled server-side by YouMind's WordPress proxy (single source of truth
 * for the WP site's taxonomy IDs).
 */

import MarkdownIt from 'markdown-it';

export interface AdaptOptions {
  markdown: string;
  /** Override title (otherwise extracted from the first H1). */
  title?: string;
}

export interface AdaptResult {
  html: string;
  title: string;
  excerpt: string;
}

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: false,
});

function extractTitle(markdown: string, fallbackTitle?: string): string {
  const h1Match = markdown.match(/^#\s+(.+)$/m);
  if (h1Match) return h1Match[1].trim();
  if (fallbackTitle) return fallbackTitle;
  const firstLine = markdown.split('\n').find((l) => l.trim().length > 0);
  return firstLine?.replace(/^#+\s*/, '').trim() || 'Untitled';
}

function generateExcerpt(markdown: string, maxLen = 300): string {
  const body = markdown.replace(/^#\s+.+$/m, '');
  const plain = body
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[([^\]]*)\]\(.*?\)/g, '$1')
    .replace(/#{1,6}\s+/g, '')
    .replace(/[*_~`>]/g, '')
    .replace(/\|.*\|/g, '')
    .replace(/-{3,}/g, '')
    .replace(/\n{2,}/g, '\n')
    .trim();
  if (plain.length <= maxLen) return plain;
  let excerpt = plain.slice(0, maxLen);
  const lastSentence = excerpt.lastIndexOf('.');
  if (lastSentence > 150) {
    excerpt = excerpt.slice(0, lastSentence + 1);
  } else {
    excerpt = `${excerpt.slice(0, excerpt.lastIndexOf(' '))}...`;
  }
  return excerpt;
}

export function adaptForWordPress(options: AdaptOptions): AdaptResult {
  const title = extractTitle(options.markdown, options.title);
  const bodyMarkdown = options.markdown.replace(/^#\s+.+\n?/, '');
  const html = md.render(bodyMarkdown);
  const excerpt = generateExcerpt(options.markdown);
  return { html, title, excerpt };
}

/** Convenience for the local-only `preview` CLI command. */
export function convertToHtml(markdown: string): { html: string; title: string; excerpt: string } {
  return adaptForWordPress({ markdown });
}
