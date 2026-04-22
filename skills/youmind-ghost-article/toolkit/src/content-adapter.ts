/**
 * Content adapter: Markdown -> Ghost-ready HTML + editorial metadata.
 */

import MarkdownIt from 'markdown-it';
import { parse as parseYaml } from 'yaml';
import type { CreatePostOptions } from './ghost-api.js';

type GhostStatus = NonNullable<CreatePostOptions['status']>;
type GhostVisibility = NonNullable<CreatePostOptions['visibility']>;

export interface AdaptOptions {
  markdown: string;
  title?: string;
  tagNames?: string[];
  internalTagNames?: string[];
  featureImage?: string;
  featureImageUrl?: string;
  customExcerpt?: string;
  status?: GhostStatus;
  visibility?: GhostVisibility;
  slug?: string;
  featured?: boolean;
  publishedAt?: string;
}

export interface AdaptResult {
  html: string;
  title: string;
  excerpt: string;
  tags: Array<{ name: string }>;
  featureImagePath?: string;
  featureImageUrl?: string;
  status?: GhostStatus;
  visibility?: GhostVisibility;
  slug?: string;
  featured?: boolean;
  publishedAt?: string;
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

function asBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
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

function pickBoolean(...values: unknown[]): boolean | undefined {
  for (const value of values) {
    const result = asBoolean(value);
    if (result !== undefined) return result;
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

function normalizeInternalTags(tagNames: string[]): string[] {
  return tagNames.map((tag) => (tag.startsWith('#') ? tag : `#${tag}`));
}

function buildTags(tagNames: string[]): Array<{ name: string }> {
  const seen = new Set<string>();
  const tags: Array<{ name: string }> = [];

  for (const rawTag of tagNames) {
    const tag = rawTag.trim();
    if (!tag) continue;

    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    tags.push({ name: tag });
  }

  return tags;
}

function splitFeatureImage(value?: string): {
  featureImagePath?: string;
  featureImageUrl?: string;
} {
  if (!value) {
    return {};
  }

  if (/^https?:\/\//i.test(value)) {
    return { featureImageUrl: value };
  }

  return { featureImagePath: value };
}

export async function adaptForGhost(options: AdaptOptions): Promise<AdaptResult> {
  const { frontmatter, bodyMarkdown } = parseFrontmatter(options.markdown);
  const ghost = pickObject<Record<string, unknown>>(frontmatter.ghost) ?? {};

  const title = extractTitle(
    bodyMarkdown,
    pickString(options.title, ghost.title, frontmatter.title),
  );
  const excerpt = generateExcerpt(
    bodyMarkdown,
    pickString(
      options.customExcerpt,
      ghost.customExcerpt,
      ghost.excerpt,
      frontmatter.customExcerpt,
      frontmatter.excerpt,
      frontmatter.description,
    ),
  );

  const rootTags = pickStringArray(frontmatter.tags) ?? [];
  const ghostTags = pickStringArray(ghost.tags) ?? [];
  const optionTags = options.tagNames ?? [];
  const internalTags = normalizeInternalTags(
    pickStringArray(options.internalTagNames, ghost.internalTags, frontmatter.internalTags) ?? [],
  );
  const tags = buildTags([...rootTags, ...ghostTags, ...optionTags, ...internalTags]);

  const featureImage =
    options.featureImageUrl ??
    options.featureImage ??
    pickString(ghost.featureImage, frontmatter.featureImage, frontmatter.image);
  const { featureImagePath, featureImageUrl } = splitFeatureImage(featureImage);

  return {
    html: md.render(bodyMarkdown.replace(/^#\s+.+\n?/, '')),
    title,
    excerpt,
    tags,
    featureImagePath,
    featureImageUrl,
    status: pickString(options.status, ghost.status, frontmatter.status) as GhostStatus | undefined,
    visibility: pickString(
      options.visibility,
      ghost.visibility,
      frontmatter.visibility,
    ) as GhostVisibility | undefined,
    slug: pickString(options.slug, ghost.slug, frontmatter.slug),
    featured: pickBoolean(options.featured, ghost.featured, frontmatter.featured),
    publishedAt: pickString(options.publishedAt, ghost.publishedAt, frontmatter.publishedAt),
  };
}

export function convertToHtml(markdown: string): { html: string; title: string; excerpt: string } {
  const { bodyMarkdown } = parseFrontmatter(markdown);
  const title = extractTitle(bodyMarkdown);
  const html = md.render(bodyMarkdown.replace(/^#\s+.+\n?/, ''));
  const excerpt = generateExcerpt(bodyMarkdown);
  return { html, title, excerpt };
}
