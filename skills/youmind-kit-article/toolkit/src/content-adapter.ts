/**
 * Content adapter: Markdown -> Kit-ready HTML + broadcast metadata.
 */

import MarkdownIt from 'markdown-it';
import { parse as parseYaml } from 'yaml';

export interface AdaptOptions {
  markdown: string;
  subject?: string;
  description?: string;
  previewText?: string;
  thumbnailUrl?: string;
  thumbnailAlt?: string;
  isPublic?: boolean;
  publishedAt?: string;
  sendAt?: string | null;
  emailTemplateId?: number;
  emailAddress?: string;
  subscriberFilter?: Record<string, unknown>[];
}

export interface AdaptResult {
  html: string;
  subject: string;
  description?: string;
  previewText: string;
  thumbnailUrl?: string;
  thumbnailAlt?: string;
  isPublic?: boolean;
  publishedAt?: string;
  sendAt?: string | null;
  emailTemplateId?: number;
  emailAddress?: string;
  subscriberFilter?: Record<string, unknown>[];
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

function asNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
    return Number(value.trim());
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

function pickNumber(...values: unknown[]): number | undefined {
  for (const value of values) {
    const result = asNumber(value);
    if (result !== undefined) return result;
  }
  return undefined;
}

function pickObject<T extends Record<string, unknown>>(...values: unknown[]): T | undefined {
  for (const value of values) {
    if (isRecord(value)) return value as T;
  }
  return undefined;
}

function pickSubscriberFilter(...values: unknown[]): Record<string, unknown>[] | undefined {
  for (const value of values) {
    if (Array.isArray(value)) {
      const filters = value.filter(isRecord) as Record<string, unknown>[];
      if (filters.length) return filters;
    }
    if (isRecord(value)) {
      return [value];
    }
  }
  return undefined;
}

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
  const { frontmatter, bodyMarkdown } = parseFrontmatter(options.markdown);
  const kit = pickObject<Record<string, unknown>>(frontmatter.kit) ?? {};

  const subject = extractSubject(
    bodyMarkdown,
    pickString(options.subject, kit.subject, frontmatter.subject, frontmatter.title),
  );
  const description = extractDescription(
    bodyMarkdown,
    pickString(options.description, kit.description, frontmatter.description, frontmatter.summary),
  );
  const previewText = generatePreviewText(
    bodyMarkdown,
    pickString(
      options.previewText,
      kit.previewText,
      kit.preview,
      frontmatter.previewText,
      frontmatter.preview,
    ),
  );
  const html = md.render(bodyMarkdown.replace(/^#\s+.+\n?/, ''));

  const visibility = pickString(kit.visibility, frontmatter.visibility);
  const derivedIsPublic =
    pickBoolean(
      options.isPublic,
      kit.public,
      frontmatter.public,
      visibility === 'public' ? true : visibility === 'private' ? false : undefined,
    ) ??
    (pickBoolean(kit.private, frontmatter.private) === true ? false : undefined);

  return {
    html,
    subject,
    description,
    previewText,
    thumbnailUrl: pickString(
      options.thumbnailUrl,
      kit.thumbnailUrl,
      frontmatter.thumbnailUrl,
      frontmatter.image,
    ),
    thumbnailAlt: pickString(
      options.thumbnailAlt,
      kit.thumbnailAlt,
      frontmatter.thumbnailAlt,
      frontmatter.imageAlt,
    ),
    isPublic: derivedIsPublic,
    publishedAt: pickString(options.publishedAt, kit.publishedAt, frontmatter.publishedAt),
    sendAt:
      options.sendAt !== undefined
        ? options.sendAt
        : pickString(kit.sendAt, frontmatter.sendAt) ?? undefined,
    emailTemplateId: pickNumber(
      options.emailTemplateId,
      kit.emailTemplateId,
      frontmatter.emailTemplateId,
    ),
    emailAddress: pickString(
      options.emailAddress,
      kit.emailAddress,
      frontmatter.emailAddress,
      frontmatter.senderEmail,
    ),
    subscriberFilter:
      options.subscriberFilter ??
      pickSubscriberFilter(kit.subscriberFilter, frontmatter.subscriberFilter),
  };
}

export function convertToHtml(markdown: string): {
  html: string;
  subject: string;
  previewText: string;
} {
  const { frontmatter, bodyMarkdown } = parseFrontmatter(markdown);
  const kit = pickObject<Record<string, unknown>>(frontmatter.kit) ?? {};
  const subject = extractSubject(
    bodyMarkdown,
    pickString(kit.subject, frontmatter.subject, frontmatter.title),
  );
  const html = md.render(bodyMarkdown.replace(/^#\s+.+\n?/, ''));
  return {
    html,
    subject,
    previewText: generatePreviewText(
      bodyMarkdown,
      pickString(
        kit.previewText,
        kit.preview,
        frontmatter.previewText,
        frontmatter.preview,
      ),
    ),
  };
}
