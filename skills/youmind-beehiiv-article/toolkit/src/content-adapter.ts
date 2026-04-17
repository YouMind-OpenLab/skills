/**
 * Content adapter: Markdown -> Beehiiv-ready HTML + publication metadata.
 */

import MarkdownIt from 'markdown-it';
import { parse as parseYaml } from 'yaml';
import type {
  BeehiivPostEmailSettings,
  BeehiivPostRecipients,
  BeehiivPostSeoSettings,
  BeehiivPostWebSettings,
} from './beehiiv-api.js';

type BeehiivPostStatus = 'draft' | 'confirmed';
type BeehiivEmailCaptureType = 'none' | 'gated' | 'popup';
type BeehiivSocialShare =
  | 'comments_and_likes_only'
  | 'with_comments_and_likes'
  | 'top'
  | 'none';

export interface AdaptOptions {
  markdown: string;
  title?: string;
  subtitle?: string;
  contentTags?: string[];
  thumbnailImageUrl?: string;
  status?: BeehiivPostStatus;
  scheduledAt?: string;
  postTemplateId?: string;
  customLinkTrackingEnabled?: boolean;
  emailCaptureTypeOverride?: BeehiivEmailCaptureType;
  overrideScheduledAt?: string;
  socialShare?: BeehiivSocialShare;
  recipients?: BeehiivPostRecipients;
  emailSettings?: BeehiivPostEmailSettings;
  webSettings?: BeehiivPostWebSettings;
  seoSettings?: BeehiivPostSeoSettings;
  headers?: Record<string, string>;
  customFields?: Record<string, string>;
  newsletterListId?: string;
}

export interface AdaptResult {
  html: string;
  title: string;
  subtitle?: string;
  previewText: string;
  contentTags: string[];
  thumbnailImageUrl?: string;
  status?: BeehiivPostStatus;
  scheduledAt?: string;
  postTemplateId?: string;
  customLinkTrackingEnabled?: boolean;
  emailCaptureTypeOverride?: BeehiivEmailCaptureType;
  overrideScheduledAt?: string;
  socialShare?: BeehiivSocialShare;
  recipients?: BeehiivPostRecipients;
  emailSettings?: BeehiivPostEmailSettings;
  webSettings?: BeehiivPostWebSettings;
  seoSettings?: BeehiivPostSeoSettings;
  headers?: Record<string, string>;
  customFields?: Record<string, string>;
  newsletterListId?: string;
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

function asStringRecord(value: unknown): Record<string, string> | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const entries = Object.entries(value).filter(
    (entry): entry is [string, string] => typeof entry[1] === 'string' && entry[1].trim().length > 0,
  );

  return entries.length ? Object.fromEntries(entries) : undefined;
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

function pickObject<T extends object>(...values: unknown[]): T | undefined {
  for (const value of values) {
    if (isRecord(value)) {
      return value as T;
    }
  }
  return undefined;
}

function buildTags(contentTags: string[]): string[] {
  return contentTags
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 10);
}

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

function mergeRecord<T extends object>(
  base?: T,
  derived?: Partial<T>,
  override?: T,
): T | undefined {
  const result: Record<string, unknown> = { ...((base ?? {}) as Record<string, unknown>) };

  if (derived) {
    for (const [key, value] of Object.entries(derived)) {
      if (value !== undefined && result[key] === undefined) {
        result[key] = value;
      }
    }
  }

  if (override) {
    for (const [key, value] of Object.entries(override)) {
      if (value !== undefined) {
        result[key] = value;
      }
    }
  }

  return Object.keys(result).length ? (result as T) : undefined;
}

export async function adaptForBeehiiv(options: AdaptOptions): Promise<AdaptResult> {
  const { frontmatter, bodyMarkdown } = parseFrontmatter(options.markdown);
  const beehiiv = pickObject<Record<string, unknown>>(frontmatter.beehiiv) ?? {};

  const title = extractTitle(
    bodyMarkdown,
    pickString(options.title, beehiiv.title, frontmatter.title),
  );
  const subtitle = extractSubtitle(
    bodyMarkdown,
    pickString(options.subtitle, beehiiv.subtitle, frontmatter.subtitle),
  );
  const previewText = generatePreviewText(
    bodyMarkdown,
    pickString(
      beehiiv.previewText,
      beehiiv.preview,
      frontmatter.previewText,
      frontmatter.preview,
      frontmatter.description,
    ),
  );
  const html = md.render(bodyMarkdown.replace(/^#\s+.+\n?/, ''));

  const contentTags = buildTags(
    pickStringArray(
      options.contentTags,
      beehiiv.contentTags,
      beehiiv.tags,
      frontmatter.contentTags,
      frontmatter.tags,
    ) ?? [],
  );

  const emailSettings = mergeRecord<BeehiivPostEmailSettings>(
    pickObject<BeehiivPostEmailSettings>(beehiiv.emailSettings, frontmatter.emailSettings),
    {
      emailSubjectLine: pickString(beehiiv.subjectLine, frontmatter.subjectLine, title),
      emailPreviewText: previewText,
    },
    options.emailSettings,
  );

  const webSettings = mergeRecord<BeehiivPostWebSettings>(
    pickObject<BeehiivPostWebSettings>(beehiiv.webSettings, frontmatter.webSettings),
    {
      slug: pickString(beehiiv.slug, frontmatter.slug),
      hideFromFeed: pickBoolean(beehiiv.hideFromFeed, frontmatter.hideFromFeed),
      displayThumbnailOnWeb: pickBoolean(
        beehiiv.displayThumbnailOnWeb,
        frontmatter.displayThumbnailOnWeb,
      ),
      paywallBreakPriceId: pickString(
        beehiiv.paywallBreakPriceId,
        frontmatter.paywallBreakPriceId,
      ),
      paywallId: pickString(beehiiv.paywallId, frontmatter.paywallId),
    },
    options.webSettings,
  );

  const seoSettings = mergeRecord<BeehiivPostSeoSettings>(
    pickObject<BeehiivPostSeoSettings>(beehiiv.seoSettings, frontmatter.seoSettings),
    {
      defaultTitle: pickString(beehiiv.seoTitle, frontmatter.seoTitle),
      defaultDescription: pickString(
        beehiiv.seoDescription,
        frontmatter.seoDescription,
        frontmatter.description,
      ),
      ogTitle: pickString(beehiiv.ogTitle, frontmatter.ogTitle),
      ogDescription: pickString(beehiiv.ogDescription, frontmatter.ogDescription),
      twitterTitle: pickString(beehiiv.twitterTitle, frontmatter.twitterTitle),
      twitterDescription: pickString(
        beehiiv.twitterDescription,
        frontmatter.twitterDescription,
      ),
    },
    options.seoSettings,
  );

  const headers = mergeRecord<Record<string, string>>(
    mergeRecord<Record<string, string>>(
      asStringRecord(frontmatter.headers),
      undefined,
      asStringRecord(beehiiv.headers),
    ),
    undefined,
    options.headers,
  );
  const customFields = mergeRecord<Record<string, string>>(
    mergeRecord<Record<string, string>>(
      asStringRecord(frontmatter.customFields),
      undefined,
      asStringRecord(beehiiv.customFields),
    ),
    undefined,
    options.customFields,
  );

  return {
    html,
    title,
    subtitle,
    previewText,
    contentTags,
    thumbnailImageUrl: pickString(
      options.thumbnailImageUrl,
      beehiiv.thumbnailImageUrl,
      beehiiv.thumbnailUrl,
      frontmatter.thumbnailImageUrl,
      frontmatter.thumbnailUrl,
      frontmatter.image,
    ),
    status:
      (pickString(options.status, beehiiv.status, frontmatter.status) as BeehiivPostStatus | undefined),
    scheduledAt: pickString(options.scheduledAt, beehiiv.scheduledAt, frontmatter.scheduledAt),
    postTemplateId: pickString(
      options.postTemplateId,
      beehiiv.postTemplateId,
      frontmatter.postTemplateId,
    ),
    customLinkTrackingEnabled: pickBoolean(
      options.customLinkTrackingEnabled,
      beehiiv.customLinkTrackingEnabled,
      frontmatter.customLinkTrackingEnabled,
    ),
    emailCaptureTypeOverride: pickString(
      options.emailCaptureTypeOverride,
      beehiiv.emailCaptureTypeOverride,
      frontmatter.emailCaptureTypeOverride,
    ) as BeehiivEmailCaptureType | undefined,
    overrideScheduledAt: pickString(
      options.overrideScheduledAt,
      beehiiv.overrideScheduledAt,
      frontmatter.overrideScheduledAt,
    ),
    socialShare: pickString(
      options.socialShare,
      beehiiv.socialShare,
      frontmatter.socialShare,
    ) as BeehiivSocialShare | undefined,
    recipients:
      options.recipients ??
      pickObject<BeehiivPostRecipients>(beehiiv.recipients, frontmatter.recipients),
    emailSettings,
    webSettings,
    seoSettings,
    headers,
    customFields,
    newsletterListId: pickString(
      options.newsletterListId,
      beehiiv.newsletterListId,
      frontmatter.newsletterListId,
    ),
  };
}

export function convertToHtml(markdown: string): {
  html: string;
  title: string;
  previewText: string;
} {
  const { frontmatter, bodyMarkdown } = parseFrontmatter(markdown);
  const beehiiv = pickObject<Record<string, unknown>>(frontmatter.beehiiv) ?? {};
  const title = extractTitle(bodyMarkdown, pickString(beehiiv.title, frontmatter.title));
  const html = md.render(bodyMarkdown.replace(/^#\s+.+\n?/, ''));
  return {
    html,
    title,
    previewText: generatePreviewText(
      bodyMarkdown,
      pickString(
        beehiiv.previewText,
        beehiiv.preview,
        frontmatter.previewText,
        frontmatter.preview,
        frontmatter.description,
      ),
    ),
  };
}
