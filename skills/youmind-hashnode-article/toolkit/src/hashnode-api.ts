/**
 * Hashnode API client via YouMind OpenAPI.
 *
 * The skill only requires a YouMind API key locally. The user's Hashnode
 * token and publication binding are managed inside YouMind, and the backend
 * attaches them when proxying Hashnode GraphQL requests.
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

export interface HashnodeConfig {
  apiKey: string;
  baseUrl: string;
}

export interface HashnodeTag {
  id: string;
  name: string;
  slug: string;
  postsCount?: number;
  followersCount?: number;
  [key: string]: unknown;
}

export interface HashnodePublication {
  id: string;
  title: string;
  displayTitle: string | null;
  url: string;
  dashboardUrl: string | null;
}

export interface HashnodeSeries {
  id: string;
  name: string;
}

export interface HashnodePost {
  id: string;
  status: 'draft' | 'published';
  title: string | null;
  subtitle: string | null;
  slug: string;
  url: string | null;
  dashboardUrl: string | null;
  canonicalUrl: string | null;
  brief: string | null;
  coverImageUrl: string | null;
  readTimeInMinutes: number;
  reactionCount: number;
  views: number;
  publishedAt: string | null;
  updatedAt: string | null;
  content: {
    markdown: string | null;
    html: string | null;
    text: string | null;
  } | null;
  seo: {
    title: string | null;
    description: string | null;
  } | null;
  tags: HashnodeTag[];
  series: HashnodeSeries | null;
  publication: HashnodePublication | null;
  [key: string]: unknown;
}

export interface HashnodePostListResponse {
  posts: HashnodePost[];
  total: number;
  hasNextPage: boolean;
  endCursor: string | null;
}

export interface HashnodeConnectionResult {
  ok: boolean;
  message: string;
  username?: string | null;
  name?: string | null;
  publicationTitle?: string | null;
  publicationUrl?: string | null;
  dashboardUrl?: string | null;
  totalPublished?: number;
  totalDrafts?: number;
}

export interface CreateHashnodePostOptions {
  title: string;
  contentMarkdown: string;
  subtitle?: string;
  tags?: string[];
  coverImageUrl?: string;
  canonicalUrl?: string;
  seriesId?: string;
  slug?: string;
  publishedAt?: string;
  disableComments?: boolean;
  metaTitle?: string;
  metaDescription?: string;
  metaImage?: string;
}

export interface UpdateHashnodePostOptions extends Partial<CreateHashnodePostOptions> {}

interface OpenApiErrorDetail {
  connectUrl?: string;
  upgradeUrl?: string;
  hint?: string;
}

interface OpenApiErrorResponse {
  message?: string;
  code?: string;
  detail?: OpenApiErrorDetail;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_DIR = resolve(__dirname, '../..');
const DEFAULT_YOUMIND_OPENAPI_BASE_URL = 'https://youmind.com/openapi/v1';

function normalizeBaseUrl(value: string | undefined): string {
  if (!value) return '';
  const trimmed = value.replace(/\/+$/, '');
  if (trimmed.endsWith('/openapi/v1')) return trimmed;
  if (trimmed.endsWith('/openapi')) return `${trimmed}/v1`;
  return `${trimmed}/openapi/v1`;
}

function loadLocalConfig(): Record<string, unknown> {
  const path = resolve(PROJECT_DIR, 'config.yaml');
  if (existsSync(path)) {
    return parseYaml(readFileSync(path, 'utf-8')) ?? {};
  }
  return {};
}

export function loadHashnodeConfig(): HashnodeConfig {
  const local = loadLocalConfig();
  const ym = local.youmind as Record<string, unknown> ?? {};
  const configuredBaseUrl = normalizeBaseUrl(ym.base_url as string | undefined);

  return {
    apiKey: (ym.api_key as string) || '',
    baseUrl: configuredBaseUrl || DEFAULT_YOUMIND_OPENAPI_BASE_URL,
  };
}

async function postJson<T = unknown>(
  endpoint: string,
  body: Record<string, unknown> = {},
  config?: HashnodeConfig,
): Promise<T> {
  const cfg = config ?? loadHashnodeConfig();
  if (!cfg.apiKey) {
    throw new Error('YouMind API key not configured. Set youmind.api_key in config.yaml.');
  }

  const response = await fetch(`${cfg.baseUrl}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': cfg.apiKey,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    const parsed = parseOpenApiError(text);
    throw new Error(
      `YouMind Hashnode API ${endpoint} failed (${response.status})` +
        `: ${formatOpenApiError(parsed, text)}`,
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
    parts.push(`Connect Hashnode: ${parsed.detail.connectUrl}`);
  }

  if (parsed.detail?.upgradeUrl) {
    parts.push(`Upgrade plan: ${parsed.detail.upgradeUrl}`);
  }

  return parts.join(' | ') || rawText.slice(0, 300);
}

function normalizeTag(tag: Record<string, unknown>): HashnodeTag {
  return {
    ...tag,
    id: String(tag.id ?? ''),
    name: String(tag.name ?? ''),
    slug: String(tag.slug ?? ''),
    postsCount: Number(tag.postsCount ?? 0),
    followersCount: Number(tag.followersCount ?? 0),
  };
}

function normalizePublication(publication: Record<string, unknown> | null | undefined): HashnodePublication | null {
  if (!publication) return null;

  return {
    id: String(publication.id ?? ''),
    title: String(publication.title ?? ''),
    displayTitle: (publication.displayTitle as string | null | undefined) ?? null,
    url: String(publication.url ?? ''),
    dashboardUrl:
      (publication.dashboardUrl as string | null | undefined) ??
      (publication.dashboard_url as string | null | undefined) ??
      null,
  };
}

function normalizePost(post: Record<string, unknown>): HashnodePost {
  return {
    ...post,
    id: String(post.id ?? ''),
    status: (post.status as HashnodePost['status']) ?? 'draft',
    title: (post.title as string | null | undefined) ?? null,
    subtitle: (post.subtitle as string | null | undefined) ?? null,
    slug: String(post.slug ?? ''),
    url: (post.url as string | null | undefined) ?? null,
    dashboardUrl:
      (post.dashboardUrl as string | null | undefined) ??
      (post.dashboard_url as string | null | undefined) ??
      null,
    canonicalUrl: (post.canonicalUrl as string | null | undefined) ?? null,
    brief: (post.brief as string | null | undefined) ?? null,
    coverImageUrl:
      (post.coverImageUrl as string | null | undefined) ??
      (post.cover_image_url as string | null | undefined) ??
      null,
    readTimeInMinutes: Number(post.readTimeInMinutes ?? 0),
    reactionCount: Number(post.reactionCount ?? 0),
    views: Number(post.views ?? 0),
    publishedAt: (post.publishedAt as string | null | undefined) ?? null,
    updatedAt: (post.updatedAt as string | null | undefined) ?? null,
    content:
      post.content && typeof post.content === 'object'
        ? {
            markdown: ((post.content as Record<string, unknown>).markdown as string | null | undefined) ?? null,
            html: ((post.content as Record<string, unknown>).html as string | null | undefined) ?? null,
            text: ((post.content as Record<string, unknown>).text as string | null | undefined) ?? null,
          }
        : null,
    seo:
      post.seo && typeof post.seo === 'object'
        ? {
            title: ((post.seo as Record<string, unknown>).title as string | null | undefined) ?? null,
            description:
              ((post.seo as Record<string, unknown>).description as string | null | undefined) ?? null,
          }
        : null,
    tags: Array.isArray(post.tags)
      ? post.tags.map((tag) => normalizeTag(tag as Record<string, unknown>))
      : [],
    series:
      post.series && typeof post.series === 'object'
        ? {
            id: String((post.series as Record<string, unknown>).id ?? ''),
            name: String((post.series as Record<string, unknown>).name ?? ''),
          }
        : null,
    publication:
      post.publication && typeof post.publication === 'object'
        ? normalizePublication(post.publication as Record<string, unknown>)
        : null,
  };
}

function normalizeListResponse(payload: Record<string, unknown>): HashnodePostListResponse {
  return {
    posts: Array.isArray(payload.posts)
      ? payload.posts.map((post) => normalizePost(post as Record<string, unknown>))
      : [],
    total: Number(payload.total ?? 0),
    hasNextPage: Boolean(payload.hasNextPage ?? false),
    endCursor: (payload.endCursor as string | null | undefined) ?? null,
  };
}

export async function createDraft(
  config: HashnodeConfig,
  options: CreateHashnodePostOptions,
): Promise<HashnodePost> {
  const post = await postJson<Record<string, unknown>>(
    '/hashnode/createDraft',
    { ...options },
    config,
  );
  return normalizePost(post);
}

export async function publishDraft(config: HashnodeConfig, id: string): Promise<HashnodePost> {
  const post = await postJson<Record<string, unknown>>('/hashnode/publishDraft', { id }, config);
  return normalizePost(post);
}

export async function getDraft(config: HashnodeConfig, id: string): Promise<HashnodePost> {
  const post = await postJson<Record<string, unknown>>('/hashnode/getDraft', { id }, config);
  return normalizePost(post);
}

export async function listDrafts(
  config: HashnodeConfig,
  page = 1,
  limit = 15,
): Promise<HashnodePostListResponse> {
  const payload = await postJson<Record<string, unknown>>(
    '/hashnode/listDrafts',
    { page, limit },
    config,
  );
  return normalizeListResponse(payload);
}

export async function createPost(
  config: HashnodeConfig,
  options: CreateHashnodePostOptions,
): Promise<HashnodePost> {
  const post = await postJson<Record<string, unknown>>(
    '/hashnode/createPost',
    { ...options },
    config,
  );
  return normalizePost(post);
}

export async function publishPost(
  config: HashnodeConfig,
  options: CreateHashnodePostOptions,
): Promise<HashnodePost> {
  return createPost(config, options);
}

export async function updatePost(
  config: HashnodeConfig,
  id: string,
  options: UpdateHashnodePostOptions,
): Promise<HashnodePost> {
  const post = await postJson<Record<string, unknown>>(
    '/hashnode/updatePost',
    { id, ...options },
    config,
  );
  return normalizePost(post);
}

export async function getPost(config: HashnodeConfig, id: string): Promise<HashnodePost> {
  const post = await postJson<Record<string, unknown>>('/hashnode/getPost', { id }, config);
  return normalizePost(post);
}

export async function listPosts(
  config: HashnodeConfig,
  page = 1,
  limit = 15,
): Promise<HashnodePostListResponse> {
  const payload = await postJson<Record<string, unknown>>(
    '/hashnode/listPosts',
    { page, limit },
    config,
  );
  return normalizeListResponse(payload);
}

export async function listPublishedPosts(
  config: HashnodeConfig,
  page = 1,
  limit = 15,
): Promise<HashnodePostListResponse> {
  const payload = await postJson<Record<string, unknown>>(
    '/hashnode/listPublished',
    { page, limit },
    config,
  );
  return normalizeListResponse(payload);
}

export async function searchTags(
  config: HashnodeConfig,
  query: string,
  limit = 5,
): Promise<HashnodeTag[]> {
  const payload = await postJson<unknown[]>('/hashnode/searchTags', { query, limit }, config);
  return Array.isArray(payload)
    ? payload.map((tag) => normalizeTag(tag as Record<string, unknown>))
    : [];
}

export async function validateConnection(
  config: HashnodeConfig,
): Promise<HashnodeConnectionResult> {
  return postJson<HashnodeConnectionResult>('/hashnode/validateConnection', {}, config);
}
