/**
 * Content adapter: Markdown → Ghost-ready HTML.
 *
 * - Converts Markdown to clean HTML via markdown-it
 * - Generates custom excerpt (150-300 chars)
 * - Tag management: primary + secondary tags
 * - Feature image URL
 * - Optimized for Ghost's editor and newsletter rendering
 */

import MarkdownIt from 'markdown-it';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AdaptOptions {
  markdown: string;
  title?: string;
  tagNames?: string[];
  featureImage?: string;
}

export interface AdaptResult {
  html: string;
  title: string;
  excerpt: string;
  tags: Array<{ name: string }>;
  featureImage: string | undefined;
}

// ---------------------------------------------------------------------------
// Markdown-it instance
// ---------------------------------------------------------------------------

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: false,
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Extract the first H1 heading as the article title.
 * Falls back to the provided title or first line.
 */
function extractTitle(markdown: string, fallbackTitle?: string): string {
  if (fallbackTitle) return fallbackTitle;
  const h1Match = markdown.match(/^#\s+(.+)$/m);
  if (h1Match) return h1Match[1].trim();
  const firstLine = markdown.split('\n').find(l => l.trim().length > 0);
  return firstLine?.replace(/^#+\s*/, '').trim() || 'Untitled';
}

/**
 * Generate an excerpt from Markdown content.
 * Strips Markdown syntax and returns 150-300 characters.
 * Ghost uses custom_excerpt for email previews and post cards.
 */
function generateExcerpt(markdown: string, maxLen = 300): string {
  // Remove H1 title line
  const body = markdown.replace(/^#\s+.+$/m, '');
  // Strip common Markdown syntax
  const plain = body
    .replace(/!\[.*?\]\(.*?\)/g, '')        // images
    .replace(/\[([^\]]*)\]\(.*?\)/g, '$1')  // links → text only
    .replace(/#{1,6}\s+/g, '')              // headings
    .replace(/[*_~`>]/g, '')                // emphasis, blockquote, code
    .replace(/\|.*\|/g, '')                 // table rows
    .replace(/-{3,}/g, '')                  // horizontal rules
    .replace(/\n{2,}/g, '\n')              // collapse blank lines
    .trim();

  if (plain.length <= maxLen) return plain;

  let excerpt = plain.slice(0, maxLen);
  const lastSentence = excerpt.lastIndexOf('.');
  if (lastSentence > 150) {
    excerpt = excerpt.slice(0, lastSentence + 1);
  } else {
    excerpt = excerpt.slice(0, excerpt.lastIndexOf(' ')) + '...';
  }
  return excerpt;
}

/**
 * Convert tag name strings to Ghost tag objects.
 * Ghost accepts tags by name and creates them if they don't exist.
 * The first tag in the array becomes the primary tag.
 */
function buildTags(tagNames: string[]): Array<{ name: string }> {
  return tagNames
    .map(name => name.trim())
    .filter(Boolean)
    .map(name => ({ name }));
}

// ---------------------------------------------------------------------------
// Main adapter
// ---------------------------------------------------------------------------

export async function adaptForGhost(options: AdaptOptions): Promise<AdaptResult> {
  const { markdown } = options;

  // Extract title from H1
  const title = extractTitle(markdown, options.title);

  // Remove H1 from the body before converting (Ghost uses the title field separately)
  const bodyMarkdown = markdown.replace(/^#\s+.+\n?/, '');

  // Convert Markdown to HTML
  const html = md.render(bodyMarkdown);

  // Generate excerpt
  const excerpt = generateExcerpt(markdown);

  // Build tag objects
  const tags = buildTags(options.tagNames || []);

  return {
    html,
    title,
    excerpt,
    tags,
    featureImage: options.featureImage,
  };
}

/**
 * Simple Markdown-to-HTML conversion without Ghost API calls.
 * Used for local preview.
 */
export function convertToHtml(markdown: string): { html: string; title: string; excerpt: string } {
  const title = extractTitle(markdown);
  const bodyMarkdown = markdown.replace(/^#\s+.+\n?/, '');
  const html = md.render(bodyMarkdown);
  const excerpt = generateExcerpt(markdown);
  return { html, title, excerpt };
}
