/**
 * Content adapter: Markdown -> WordPress-ready HTML + post metadata.
 */

import MarkdownIt from 'markdown-it';
import { parse as parseYaml } from 'yaml';
import type { CreatePostOptions, WPPostStatus } from './wordpress-api.js';

type WPFormat = NonNullable<CreatePostOptions['format']>;

export interface AdaptOptions {
  markdown: string;
  title?: string;
  excerpt?: string;
  tags?: string[];
  categories?: string[];
  featuredImage?: string;
  featuredImageAlt?: string;
  featuredImageCaption?: string;
  status?: WPPostStatus;
  slug?: string;
  date?: string;
  format?: WPFormat;
}

export interface AdaptResult {
  html: string;
  title: string;
  excerpt: string;
  tags?: string[];
  categories?: string[];
  featuredImage?: string;
  featuredImageAlt?: string;
  featuredImageCaption?: string;
  status?: WPPostStatus;
  slug?: string;
  date?: string;
  format?: WPFormat;
}

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: false,
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseFrontmatter(markdown: string): {
  frontmatter: Record<string, unknown>;
  bodyMarkdown: string;
} {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) {
    return { frontmatter: {}, bodyMarkdown: markdown };
  }

  try {
    const parsed = parseYaml(match[1]);
    return {
      frontmatter: isRecord(parsed) ? parsed : {},
      bodyMarkdown: markdown.slice(match[0].length),
    };
  } catch {
    return { frontmatter: {}, bodyMarkdown: markdown };
  }
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function asStringArray(value: unknown): string[] | undefined {
  if (Array.isArray(value)) {
    const items = value
      .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
      .filter(Boolean);
    return items.length ? items : undefined;
  }

  if (typeof value === 'string') {
    const items = value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
    return items.length ? items : undefined;
  }

  return undefined;
}

function pickString(...values: unknown[]): string | undefined {
  for (const value of values) {
    const result = asString(value);
    if (result) return result;
  }
  return undefined;
}

function pickStringArray(...values: unknown[]): string[] | undefined {
  for (const value of values) {
    const result = asStringArray(value);
    if (result?.length) return result;
  }
  return undefined;
}

function pickObject<T extends Record<string, unknown>>(...values: unknown[]): T | undefined {
  for (const value of values) {
    if (isRecord(value)) return value as T;
  }
  return undefined;
}

function normalizeList(items?: string[]): string[] | undefined {
  if (!items?.length) {
    return undefined;
  }

  const seen = new Set<string>();
  const normalized: string[] = [];
  for (const item of items) {
    const trimmed = item.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    normalized.push(trimmed);
  }
  return normalized.length ? normalized : undefined;
}

function extractTitle(markdown: string, fallbackTitle?: string): string {
  if (fallbackTitle) return fallbackTitle;
  const h1Match = markdown.match(/^#\s+(.+)$/m);
  if (h1Match) return h1Match[1].trim();
  const firstLine = markdown.split('\n').find((line) => line.trim().length > 0);
  return firstLine?.replace(/^#+\s*/, '').trim() || 'Untitled';
}

function generateExcerpt(markdown: string, fallbackExcerpt?: string, maxLen = 300): string {
  if (fallbackExcerpt?.trim()) {
    return fallbackExcerpt.trim();
  }

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
  const { frontmatter, bodyMarkdown } = parseFrontmatter(options.markdown);
  const wordpress = pickObject<Record<string, unknown>>(frontmatter.wordpress) ?? {};

  const title = extractTitle(
    bodyMarkdown,
    pickString(options.title, wordpress.title, frontmatter.title),
  );
  const excerpt = generateExcerpt(
    bodyMarkdown,
    pickString(
      options.excerpt,
      wordpress.excerpt,
      frontmatter.excerpt,
      frontmatter.description,
      frontmatter.summary,
    ),
  );

  return {
    html: md.render(bodyMarkdown.replace(/^#\s+.+\n?/, '')),
    title,
    excerpt,
    tags: normalizeList(pickStringArray(options.tags, wordpress.tags, frontmatter.tags)),
    categories: normalizeList(
      pickStringArray(options.categories, wordpress.categories, frontmatter.categories),
    ),
    featuredImage: pickString(
      options.featuredImage,
      wordpress.featuredImage,
      frontmatter.featuredImage,
      frontmatter.image,
    ),
    featuredImageAlt: pickString(
      options.featuredImageAlt,
      wordpress.featuredImageAlt,
      frontmatter.featuredImageAlt,
      frontmatter.imageAlt,
    ),
    featuredImageCaption: pickString(
      options.featuredImageCaption,
      wordpress.featuredImageCaption,
      frontmatter.featuredImageCaption,
      frontmatter.imageCaption,
    ),
    status: pickString(
      options.status,
      wordpress.status,
      frontmatter.status,
    ) as WPPostStatus | undefined,
    slug: pickString(options.slug, wordpress.slug, frontmatter.slug),
    date: pickString(options.date, wordpress.date, frontmatter.date, frontmatter.publishDate),
    format: pickString(
      options.format,
      wordpress.format,
      frontmatter.format,
    ) as WPFormat | undefined,
  };
}

export function convertToHtml(markdown: string): { html: string; title: string; excerpt: string } {
  return adaptForWordPress({ markdown });
}
