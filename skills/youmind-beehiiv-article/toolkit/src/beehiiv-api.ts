/**
 * Beehiiv API client via YouMind OpenAPI.
 */

import { loadYouMindConfig, YOUMIND_CONFIG_ERROR_HINT } from './config.js';

export interface BeehiivConfig {
  apiKey: string;
  baseUrl: string;
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
  created?: number;
  publishDate?: number;
}

export interface BeehiivPostListResponse {
  posts: BeehiivPost[];
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
  bodyContent: string;
  subtitle?: string;
  status?: 'draft' | 'confirmed';
  scheduledAt?: string;
  contentTags?: string[];
  thumbnailImageUrl?: string;
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
    contentTags: Array.isArray(post.contentTags)
      ? post.contentTags.filter((tag): tag is string => typeof tag === 'string')
      : Array.isArray(post.content_tags)
        ? post.content_tags.filter((tag): tag is string => typeof tag === 'string')
        : undefined,
    hiddenFromFeed:
      typeof post.hiddenFromFeed === 'boolean'
        ? post.hiddenFromFeed
        : typeof post.hidden_from_feed === 'boolean'
          ? post.hidden_from_feed
          : undefined,
    created: typeof post.created === 'number' ? post.created : undefined,
    publishDate:
      typeof post.publishDate === 'number'
        ? post.publishDate
        : typeof post.publish_date === 'number'
          ? post.publish_date
          : undefined,
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
  options: Partial<CreateBeehiivPostOptions>,
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
  page = 1,
  limit = 10,
  status?: string,
): Promise<BeehiivPostListResponse> {
  const response = await postJson<BeehiivPostListResponse>(
    '/beehiiv/listPosts',
    {
      page,
      limit,
      ...(status ? { status } : {}),
    },
    config,
  );

  return {
    posts: response.posts.map((post) => normalizePost(post as unknown as Record<string, unknown>)),
    limit: response.limit,
    page: response.page,
    totalResults: response.totalResults,
    totalPages: response.totalPages,
  };
}
