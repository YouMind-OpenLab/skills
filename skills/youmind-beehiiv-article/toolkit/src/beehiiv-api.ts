/**
 * Beehiiv API client via YouMind OpenAPI.
 */

import { loadYouMindConfig, YOUMIND_CONFIG_ERROR_HINT } from './config.js';

export interface BeehiivConfig {
  apiKey: string;
  baseUrl: string;
}

export interface BeehiivPostRecipientsChannel {
  tierIds?: string[];
  includeSegmentIds?: string[];
  excludeSegmentIds?: string[];
}

export interface BeehiivPostRecipients {
  web?: BeehiivPostRecipientsChannel;
  email?: BeehiivPostRecipientsChannel;
}

export interface BeehiivPostEmailSettings {
  fromAddress?: string;
  customLiveUrl?: string;
  displayTitleInEmail?: boolean;
  displayBylineInEmail?: boolean;
  displaySubtitleInEmail?: boolean;
  emailHeaderEngagementButtons?: string;
  emailHeaderSocialShare?: string;
  emailPreviewText?: string;
  emailSubjectLine?: string;
}

export interface BeehiivPostWebSettings {
  displayThumbnailOnWeb?: boolean;
  hideFromFeed?: boolean;
  paywallBreakPriceId?: string;
  paywallId?: string;
  slug?: string;
}

export interface BeehiivPostSeoSettings {
  defaultDescription?: string;
  defaultTitle?: string;
  ogDescription?: string;
  ogTitle?: string;
  twitterDescription?: string;
  twitterTitle?: string;
}

export interface BeehiivPost {
  id: string;
  title: string;
  subtitle?: string;
  status: string;
  subjectLine?: string;
  previewText?: string;
  slug?: string;
  thumbnailUrl?: string;
  webUrl?: string;
  audience?: string;
  platform?: string;
  contentTags?: string[];
  hiddenFromFeed?: boolean;
  enforceGatedContent?: boolean;
  emailCapturePopup?: boolean;
  authors?: string[];
  created?: number;
  publishDate?: number;
  displayedDate?: number;
  metaDefaultDescription?: string;
  metaDefaultTitle?: string;
  newsletterListId?: string;
  content?: Record<string, unknown>;
  stats?: Record<string, unknown>;
}

export interface BeehiivPostTemplate {
  id: string;
  name: string;
}

export interface BeehiivPostListResponse {
  posts: BeehiivPost[];
  limit: number;
  page: number;
  totalResults: number;
  totalPages: number;
}

export interface BeehiivPostTemplateListResponse {
  templates: BeehiivPostTemplate[];
  limit: number;
  page: number;
  totalResults: number;
  totalPages: number;
}

export interface BeehiivConnectionResult {
  ok: boolean;
  message: string;
  workspaceId?: string;
  workspaceName?: string;
  publicationId?: string;
  publicationName?: string;
}

export interface CreateBeehiivPostOptions {
  title: string;
  bodyContent?: string;
  blocks?: Record<string, unknown>[];
  subtitle?: string;
  postTemplateId?: string;
  status?: 'draft' | 'confirmed';
  scheduledAt?: string;
  customLinkTrackingEnabled?: boolean;
  emailCaptureTypeOverride?: 'none' | 'gated' | 'popup';
  overrideScheduledAt?: string;
  socialShare?: 'comments_and_likes_only' | 'with_comments_and_likes' | 'top' | 'none';
  contentTags?: string[];
  thumbnailImageUrl?: string;
  recipients?: BeehiivPostRecipients;
  emailSettings?: BeehiivPostEmailSettings;
  webSettings?: BeehiivPostWebSettings;
  seoSettings?: BeehiivPostSeoSettings;
  headers?: Record<string, string>;
  customFields?: Record<string, string>;
  newsletterListId?: string;
}

export interface UpdateBeehiivPostOptions {
  bodyContent?: string;
  blocks?: Record<string, unknown>[];
  title?: string;
  subtitle?: string;
  scheduledAt?: string;
  customLinkTrackingEnabled?: boolean;
  emailCaptureTypeOverride?: 'none' | 'gated' | 'popup';
  overrideScheduledAt?: string;
  socialShare?: 'comments_and_likes_only' | 'with_comments_and_likes' | 'top' | 'none';
  contentTags?: string[];
  thumbnailImageUrl?: string;
  emailSettings?: BeehiivPostEmailSettings;
  webSettings?: BeehiivPostWebSettings;
  seoSettings?: BeehiivPostSeoSettings;
}

export interface ListBeehiivPostsOptions {
  page?: number;
  limit?: number;
  status?: 'draft' | 'confirmed' | 'archived' | 'all';
  audience?: 'free' | 'premium' | 'all';
  platform?: 'web' | 'email' | 'both' | 'all';
  contentTags?: string[];
  slugs?: string[];
  authors?: string[];
  premiumTiers?: string[];
  expand?: string[];
  orderBy?: 'created' | 'publish_date' | 'displayed_date' | 'publishDate' | 'displayedDate';
  direction?: 'asc' | 'desc';
  hiddenFromFeed?: 'all' | 'true' | 'false';
}

export interface ListBeehiivPostTemplatesOptions {
  page?: number;
  limit?: number;
  order?: 'asc' | 'desc';
  orderBy?: string;
}

interface OpenApiErrorDetail {
  connectUrl?: string;
  upgradeUrl?: string;
  hint?: string;
  upstreamMessage?: string;
  retryAfter?: string | null;
}

interface OpenApiErrorResponse {
  message?: string;
  code?: string;
  detail?: OpenApiErrorDetail;
}

export function loadBeehiivConfig(): BeehiivConfig {
  const { apiKey, baseUrl } = loadYouMindConfig();
  return { apiKey, baseUrl };
}

async function postJson<T = unknown>(
  endpoint: string,
  body: Record<string, unknown> = {},
  config?: BeehiivConfig,
): Promise<T> {
  const cfg = config ?? loadBeehiivConfig();
  if (!cfg.apiKey) {
    throw new Error(`YouMind API key not configured. ${YOUMIND_CONFIG_ERROR_HINT}`);
  }

  const response = await fetch(`${cfg.baseUrl}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': cfg.apiKey,
      'x-use-camel-case': 'true',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    const parsed = parseOpenApiError(text);
    throw new Error(
      `YouMind Beehiiv API ${endpoint} failed (${response.status}): ${formatOpenApiError(parsed, text)}`,
    );
  }

  return response.json() as Promise<T>;
}

function parseOpenApiError(text: string): OpenApiErrorResponse | null {
  try {
    return JSON.parse(text) as OpenApiErrorResponse;
  } catch {
    return null;
  }
}

function formatOpenApiError(parsed: OpenApiErrorResponse | null, rawText: string): string {
  if (!parsed) {
    return rawText.slice(0, 300);
  }

  const parts = [parsed.message, parsed.code, parsed.detail?.hint].filter(
    (value): value is string => typeof value === 'string' && value.length > 0,
  );

  if (parsed.detail?.connectUrl) {
    parts.push(`Connect beehiiv: ${parsed.detail.connectUrl}`);
  }
  if (parsed.detail?.upgradeUrl) {
    parts.push(`Upgrade plan: ${parsed.detail.upgradeUrl}`);
  }
  if (parsed.detail?.upstreamMessage) {
    parts.push(`beehiiv said: ${parsed.detail.upstreamMessage}`);
  }
  if (parsed.detail?.retryAfter) {
    parts.push(`Retry-After: ${parsed.detail.retryAfter}`);
  }

  return parts.join(' | ') || rawText.slice(0, 300);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }
  const items = value.filter((item): item is string => typeof item === 'string');
  return items.length ? items : undefined;
}

function normalizePost(post: Record<string, unknown>): BeehiivPost {
  return {
    id: String(post.id ?? ''),
    title: String(post.title ?? ''),
    subtitle: (post.subtitle as string | undefined) ?? undefined,
    status: String(post.status ?? ''),
    subjectLine:
      (post.subjectLine as string | undefined) ??
      (post.subject_line as string | undefined),
    previewText:
      (post.previewText as string | undefined) ??
      (post.preview_text as string | undefined),
    slug: (post.slug as string | undefined) ?? undefined,
    thumbnailUrl:
      (post.thumbnailUrl as string | undefined) ??
      (post.thumbnail_image_url as string | undefined) ??
      (post.thumbnail_url as string | undefined),
    webUrl: (post.webUrl as string | undefined) ?? (post.web_url as string | undefined),
    audience: (post.audience as string | undefined) ?? undefined,
    platform: (post.platform as string | undefined) ?? undefined,
    contentTags: normalizeStringArray(post.contentTags) ?? normalizeStringArray(post.content_tags),
    hiddenFromFeed:
      typeof post.hiddenFromFeed === 'boolean'
        ? post.hiddenFromFeed
        : typeof post.hidden_from_feed === 'boolean'
          ? post.hidden_from_feed
          : undefined,
    enforceGatedContent:
      typeof post.enforceGatedContent === 'boolean'
        ? post.enforceGatedContent
        : typeof post.enforce_gated_content === 'boolean'
          ? post.enforce_gated_content
          : undefined,
    emailCapturePopup:
      typeof post.emailCapturePopup === 'boolean'
        ? post.emailCapturePopup
        : typeof post.email_capture_popup === 'boolean'
          ? post.email_capture_popup
          : undefined,
    authors: normalizeStringArray(post.authors),
    created: typeof post.created === 'number' ? post.created : undefined,
    publishDate:
      typeof post.publishDate === 'number'
        ? post.publishDate
        : typeof post.publish_date === 'number'
          ? post.publish_date
          : undefined,
    displayedDate:
      typeof post.displayedDate === 'number'
        ? post.displayedDate
        : typeof post.displayed_date === 'number'
          ? post.displayed_date
          : undefined,
    metaDefaultDescription:
      (post.metaDefaultDescription as string | undefined) ??
      (post.meta_default_description as string | undefined),
    metaDefaultTitle:
      (post.metaDefaultTitle as string | undefined) ??
      (post.meta_default_title as string | undefined),
    newsletterListId:
      (post.newsletterListId as string | undefined) ??
      (post.newsletter_list_id as string | undefined),
    content: isPlainObject(post.content) ? post.content : undefined,
    stats: isPlainObject(post.stats) ? post.stats : undefined,
  };
}

function normalizePostTemplate(template: Record<string, unknown>): BeehiivPostTemplate {
  return {
    id: String(template.id ?? ''),
    name: String(template.name ?? ''),
  };
}

export async function validateConnection(
  config?: BeehiivConfig,
): Promise<BeehiivConnectionResult> {
  return postJson<BeehiivConnectionResult>('/beehiiv/validateConnection', {}, config);
}

export async function createPost(
  config: BeehiivConfig,
  options: CreateBeehiivPostOptions,
): Promise<BeehiivPost> {
  const post = await postJson<Record<string, unknown>>(
    '/beehiiv/createPost',
    { ...options },
    config,
  );
  return normalizePost(post);
}

export async function updatePost(
  config: BeehiivConfig,
  id: string,
  options: UpdateBeehiivPostOptions,
): Promise<BeehiivPost> {
  const post = await postJson<Record<string, unknown>>(
    '/beehiiv/updatePost',
    { id, ...options },
    config,
  );
  return normalizePost(post);
}

export async function getPost(config: BeehiivConfig, id: string): Promise<BeehiivPost> {
  const post = await postJson<Record<string, unknown>>('/beehiiv/getPost', { id }, config);
  return normalizePost(post);
}

export async function deletePost(
  config: BeehiivConfig,
  id: string,
): Promise<{ ok: boolean; id: string }> {
  return postJson<{ ok: boolean; id: string }>('/beehiiv/deletePost', { id }, config);
}

export async function listPosts(
  config: BeehiivConfig,
  options: ListBeehiivPostsOptions = {},
): Promise<BeehiivPostListResponse> {
  const normalizedOrderBy =
    options.orderBy === 'publishDate'
      ? 'publish_date'
      : options.orderBy === 'displayedDate'
        ? 'displayed_date'
        : options.orderBy;

  const response = await postJson<BeehiivPostListResponse>(
    '/beehiiv/listPosts',
    {
      ...(options.page !== undefined ? { page: options.page } : {}),
      ...(options.limit !== undefined ? { limit: options.limit } : {}),
      ...(options.status ? { status: options.status } : {}),
      ...(options.audience ? { audience: options.audience } : {}),
      ...(options.platform ? { platform: options.platform } : {}),
      ...(options.contentTags?.length ? { contentTags: options.contentTags } : {}),
      ...(options.slugs?.length ? { slugs: options.slugs } : {}),
      ...(options.authors?.length ? { authors: options.authors } : {}),
      ...(options.premiumTiers?.length ? { premiumTiers: options.premiumTiers } : {}),
      ...(options.expand?.length ? { expand: options.expand } : {}),
      ...(normalizedOrderBy ? { orderBy: normalizedOrderBy } : {}),
      ...(options.direction ? { direction: options.direction } : {}),
      ...(options.hiddenFromFeed ? { hiddenFromFeed: options.hiddenFromFeed } : {}),
    },
    config,
  );

  return {
    ...response,
    posts: response.posts.map((post) =>
      normalizePost(post as unknown as Record<string, unknown>),
    ),
  };
}

export async function listPostTemplates(
  config: BeehiivConfig,
  options: ListBeehiivPostTemplatesOptions = {},
): Promise<BeehiivPostTemplateListResponse> {
  const response = await postJson<BeehiivPostTemplateListResponse>(
    '/beehiiv/listPostTemplates',
    {
      ...(options.page !== undefined ? { page: options.page } : {}),
      ...(options.limit !== undefined ? { limit: options.limit } : {}),
      ...(options.order ? { order: options.order } : {}),
      ...(options.orderBy ? { orderBy: options.orderBy } : {}),
    },
    config,
  );

  return {
    ...response,
    templates: response.templates.map((template) =>
      normalizePostTemplate(template as unknown as Record<string, unknown>),
    ),
  };
}
