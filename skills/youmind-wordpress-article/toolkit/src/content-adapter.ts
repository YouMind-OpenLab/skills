/**
 * Content adapter: Markdown → WordPress-ready HTML.
 *
 * - Converts Markdown to clean HTML via markdown-it
 * - Generates excerpt (150-300 chars)
 * - Maps tags to WordPress tag IDs (creates new tags if needed)
 * - Maps categories if specified
 */

import MarkdownIt from 'markdown-it';
import {
  type WordPressConfig,
  type WPTag,
  type WPCategory,
  listTags,
  createTag,
  listCategories,
} from './wordpress-api.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AdaptOptions {
  markdown: string;
  title?: string;
  tagNames?: string[];
  categoryNames?: string[];
  config: WordPressConfig;
}

export interface AdaptResult {
  html: string;
  title: string;
  excerpt: string;
  tags: number[];
  categories: number[];
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
  const h1Match = markdown.match(/^#\s+(.+)$/m);
  if (h1Match) return h1Match[1].trim();
  if (fallbackTitle) return fallbackTitle;
  // Fallback: first non-empty line
  const firstLine = markdown.split('\n').find(l => l.trim().length > 0);
  return firstLine?.replace(/^#+\s*/, '').trim() || 'Untitled';
}

/**
 * Generate an excerpt from Markdown content.
 * Strips Markdown syntax and returns 150-300 characters.
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

  // Take first 300 chars, try to break at sentence boundary
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
 * Resolve tag names to WordPress tag IDs, creating tags that don't exist.
 */
async function resolveTagIds(
  config: WordPressConfig,
  tagNames: string[],
): Promise<number[]> {
  if (!tagNames.length) return [];

  const existing = await listTags(config);
  const tagMap = new Map<string, number>();
  for (const tag of existing) {
    tagMap.set(tag.name.toLowerCase(), tag.id);
  }

  const ids: number[] = [];
  for (const name of tagNames) {
    const normalized = name.trim();
    if (!normalized) continue;

    const existingId = tagMap.get(normalized.toLowerCase());
    if (existingId) {
      ids.push(existingId);
    } else {
      // Create the tag
      try {
        const newTag = await createTag(config, normalized);
        ids.push(newTag.id);
        tagMap.set(normalized.toLowerCase(), newTag.id);
      } catch (e) {
        console.error(`Failed to create tag "${normalized}": ${(e as Error).message}`);
      }
    }
  }

  return ids;
}

/**
 * Resolve category names to WordPress category IDs.
 * Only matches existing categories (does not create new ones).
 */
async function resolveCategoryIds(
  config: WordPressConfig,
  categoryNames: string[],
): Promise<number[]> {
  if (!categoryNames.length) return [];

  const existing = await listCategories(config);
  const catMap = new Map<string, number>();
  for (const cat of existing) {
    catMap.set(cat.name.toLowerCase(), cat.id);
  }

  const ids: number[] = [];
  for (const name of categoryNames) {
    const normalized = name.trim().toLowerCase();
    const id = catMap.get(normalized);
    if (id) {
      ids.push(id);
    } else {
      console.warn(`Category "${name}" not found in WordPress. Skipping.`);
    }
  }

  return ids;
}

// ---------------------------------------------------------------------------
// Main adapter
// ---------------------------------------------------------------------------

export async function adaptForWordPress(options: AdaptOptions): Promise<AdaptResult> {
  const { markdown, config } = options;

  // Extract title from H1
  const title = extractTitle(markdown, options.title);

  // Remove H1 from the body before converting (WP uses title field separately)
  const bodyMarkdown = markdown.replace(/^#\s+.+\n?/, '');

  // Convert Markdown to HTML
  const html = md.render(bodyMarkdown);

  // Generate excerpt
  const excerpt = generateExcerpt(markdown);

  // Resolve tags
  const tags = await resolveTagIds(config, options.tagNames || []);

  // Resolve categories
  const categories = await resolveCategoryIds(config, options.categoryNames || []);

  return { html, title, excerpt, tags, categories };
}

/**
 * Simple Markdown-to-HTML conversion without WordPress API calls.
 * Used for local preview.
 */
export function convertToHtml(markdown: string): { html: string; title: string; excerpt: string } {
  const title = extractTitle(markdown);
  const bodyMarkdown = markdown.replace(/^#\s+.+\n?/, '');
  const html = md.render(bodyMarkdown);
  const excerpt = generateExcerpt(markdown);
  return { html, title, excerpt };
}
