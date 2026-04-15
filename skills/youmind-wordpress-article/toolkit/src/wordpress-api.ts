/**
 * WordPress API client via YouMind OpenAPI.
 *
 * The skill only requires a YouMind API key locally. The user's WordPress
 * site URL, username, and Application Password are configured once inside
 * YouMind, and the YouMind backend attaches them when proxying WP requests.
 */

import { dirname, resolve } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

// ---------------------------------------------------------------------------
// Public types — stable contract. Fields use camelCase (server normalizes
// raw WP shape `title.rendered` etc into flat strings).
// ---------------------------------------------------------------------------

export type WPPostStatus = 'publish' | 'draft' | 'pending' | 'private' | 'future';
export type WPListStatus = WPPostStatus | 'any';
export type WPViewContext = 'view' | 'edit' | 'embed';

export interface WordPressConfig {
  apiKey: string;
  baseUrl: string;
}

export interface WPPost {
  id: number;
  title: string;
  content: string;
  excerpt?: string;
  status: WPPostStatus;
  slug: string;
  link: string;
  author: number;
  featuredMedia: number;
  categories: number[];
  tags: number[];
  date: string;
  modified: string;
  format?: string;
  adminUrl?: string | null;
}

export interface WPPostListResponse {
  posts: WPPost[];
  total: number;
  totalPages: number;
  page: number;
  perPage: number;
}

export interface WPMedia {
  id: number;
  sourceUrl: string;
  title: string;
  mimeType: string;
  mediaType: string;
  slug: string;
  altText?: string;
  caption?: string;
  /** Markdown image snippet ready to paste into a post body */
  markdown: string;
}

export interface WPCategory {
  id: number;
  name: string;
  slug: string;
  parent: number;
  count: number;
  description: string;
}

export interface WPCategoryListResponse {
  categories: WPCategory[];
  total: number;
  totalPages: number;
}

export interface WPTag {
  id: number;
  name: string;
  slug: string;
  count: number;
  description: string;
}

export interface WPTagListResponse {
  tags: WPTag[];
  total: number;
  totalPages: number;
}

export interface WPConnectionResult {
  ok: boolean;
  message: string;
  accountId?: number;
  accountName?: string;
  accountUsername?: string;
  siteUrl?: string;
}

export interface WPDeleteResult {
  ok: boolean;
  id: number;
  deletedPermanently: boolean;
}

export interface CreatePostOptions {
  title: string;
  content: string;
  excerpt?: string;
  status?: WPPostStatus;
  /** Tag names (server resolves to IDs and auto-creates missing ones) */
  tags?: string[];
  /** Category names (server resolves to IDs; errors if missing) */
  categories?: string[];
  featuredMedia?: number;
  slug?: string;
  date?: string;
  format?: string;
}

export type UpdatePostOptions = Partial<CreatePostOptions>;

export interface UploadMediaInput {
  /** Local file path to upload */
  filePath: string;
  filename?: string;
  contentType?: string;
  altText?: string;
  caption?: string;
}

// ---------------------------------------------------------------------------
// Config loading — YouMind apikey only; WP creds live in YouMind backend.
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_DIR = resolve(__dirname, '../..');

const DEFAULT_YOUMIND_OPENAPI_BASE_URL = 'https://youmind.com/openapi/v1';

interface OpenApiErrorDetail {
  connectUrl?: string;
  upgradeUrl?: string;
  hint?: string;
  upstreamMessage?: string;
  retryAfter?: string | null;
  status?: number | null;
  categoryName?: string;
}

interface OpenApiErrorResponse {
  message?: string;
  code?: string;
  detail?: OpenApiErrorDetail;
}

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

export function loadWordPressConfig(): WordPressConfig {
  const local = loadLocalConfig();
  const ym = (local.youmind as Record<string, unknown>) ?? {};
  const configuredBaseUrl = normalizeBaseUrl(ym.base_url as string | undefined);

  return {
    apiKey: (ym.api_key as string) || '',
    baseUrl: configuredBaseUrl || DEFAULT_YOUMIND_OPENAPI_BASE_URL,
  };
}

// ---------------------------------------------------------------------------
// HTTP transport
// ---------------------------------------------------------------------------

async function postJson<T = unknown>(
  endpoint: string,
  body: Record<string, unknown> = {},
  config?: WordPressConfig,
): Promise<T> {
  const cfg = config ?? loadWordPressConfig();
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
    signal: AbortSignal.timeout(120_000),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    const parsed = parseOpenApiError(text);
    throw new Error(
      `YouMind WordPress API ${endpoint} failed (${response.status})` +
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
  if (!parsed) return rawText.slice(0, 300);
  const parts = [parsed.message, parsed.code, parsed.detail?.hint].filter(
    (v): v is string => typeof v === 'string' && v.length > 0,
  );
  if (parsed.detail?.connectUrl) parts.push(`Connect WordPress: ${parsed.detail.connectUrl}`);
  if (parsed.detail?.upgradeUrl) parts.push(`Upgrade plan: ${parsed.detail.upgradeUrl}`);
  if (parsed.detail?.upstreamMessage) parts.push(`WP said: ${parsed.detail.upstreamMessage}`);
  if (parsed.detail?.categoryName) parts.push(`Missing category: ${parsed.detail.categoryName}`);
  if (parsed.detail?.retryAfter) parts.push(`Retry-After: ${parsed.detail.retryAfter}`);
  return parts.join(' | ') || rawText.slice(0, 300);
}

// ---------------------------------------------------------------------------
// Normalization
// ---------------------------------------------------------------------------

function normalizePost(post: Record<string, unknown>): WPPost {
  return {
    id: Number(post.id ?? 0),
    title: String(post.title ?? ''),
    content: String(post.content ?? ''),
    excerpt: (post.excerpt as string | undefined) ?? undefined,
    status: (post.status as WPPostStatus) ?? 'draft',
    slug: String(post.slug ?? ''),
    link: String(post.link ?? ''),
    author: Number(post.author ?? 0),
    featuredMedia: Number(post.featuredMedia ?? 0),
    categories: Array.isArray(post.categories)
      ? post.categories.filter((n): n is number => typeof n === 'number')
      : [],
    tags: Array.isArray(post.tags) ? post.tags.filter((n): n is number => typeof n === 'number') : [],
    date: String(post.date ?? ''),
    modified: String(post.modified ?? ''),
    format: typeof post.format === 'string' ? post.format : undefined,
    adminUrl: (post.adminUrl as string | null | undefined) ?? null,
  };
}

function normalizeMedia(media: Record<string, unknown>): WPMedia {
  return {
    id: Number(media.id ?? 0),
    sourceUrl: String(media.sourceUrl ?? ''),
    title: String(media.title ?? ''),
    mimeType: String(media.mimeType ?? ''),
    mediaType: String(media.mediaType ?? ''),
    slug: String(media.slug ?? ''),
    altText: (media.altText as string | undefined) ?? undefined,
    caption: (media.caption as string | undefined) ?? undefined,
    markdown: String(media.markdown ?? ''),
  };
}

function normalizeCategory(c: Record<string, unknown>): WPCategory {
  return {
    id: Number(c.id ?? 0),
    name: String(c.name ?? ''),
    slug: String(c.slug ?? ''),
    parent: Number(c.parent ?? 0),
    count: Number(c.count ?? 0),
    description: String(c.description ?? ''),
  };
}

function normalizeTag(t: Record<string, unknown>): WPTag {
  return {
    id: Number(t.id ?? 0),
    name: String(t.name ?? ''),
    slug: String(t.slug ?? ''),
    count: Number(t.count ?? 0),
    description: String(t.description ?? ''),
  };
}

function buildPostPayload(options: UpdatePostOptions): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  if (options.title !== undefined) payload.title = options.title;
  if (options.content !== undefined) payload.content = options.content;
  if (options.excerpt !== undefined) payload.excerpt = options.excerpt;
  if (options.status !== undefined) payload.status = options.status;
  if (options.tags !== undefined) payload.tags = options.tags;
  if (options.categories !== undefined) payload.categories = options.categories;
  if (options.featuredMedia !== undefined) payload.featuredMedia = options.featuredMedia;
  if (options.slug !== undefined) payload.slug = options.slug;
  if (options.date !== undefined) payload.date = options.date;
  if (options.format !== undefined) payload.format = options.format;
  return payload;
}

// ---------------------------------------------------------------------------
// Public API — Posts
// ---------------------------------------------------------------------------

export async function validateConnection(config?: WordPressConfig): Promise<WPConnectionResult> {
  const r = await postJson<Record<string, unknown>>('/wordpress/validateConnection', {}, config);
  return {
    ok: Boolean(r.ok),
    message: String(r.message ?? ''),
    accountId: typeof r.accountId === 'number' ? r.accountId : undefined,
    accountName: (r.accountName as string | undefined) ?? undefined,
    accountUsername: (r.accountUsername as string | undefined) ?? undefined,
    siteUrl: (r.siteUrl as string | undefined) ?? undefined,
  };
}

export async function createPost(
  config: WordPressConfig | undefined,
  options: CreatePostOptions,
): Promise<WPPost> {
  const post = await postJson<Record<string, unknown>>(
    '/wordpress/createPost',
    buildPostPayload(options),
    config,
  );
  return normalizePost(post);
}

export async function updatePost(
  config: WordPressConfig | undefined,
  postId: number,
  options: UpdatePostOptions,
): Promise<WPPost> {
  const post = await postJson<Record<string, unknown>>(
    '/wordpress/updatePost',
    { id: postId, ...buildPostPayload(options) },
    config,
  );
  return normalizePost(post);
}

export async function getPost(
  config: WordPressConfig | undefined,
  postId: number,
  context: WPViewContext = 'view',
): Promise<WPPost> {
  const post = await postJson<Record<string, unknown>>(
    '/wordpress/getPost',
    { id: postId, context },
    config,
  );
  return normalizePost(post);
}

export async function deletePost(
  config: WordPressConfig | undefined,
  postId: number,
  force = false,
): Promise<WPDeleteResult> {
  const r = await postJson<Record<string, unknown>>(
    '/wordpress/deletePost',
    { id: postId, force },
    config,
  );
  return {
    ok: Boolean(r.ok),
    id: Number(r.id ?? postId),
    deletedPermanently: Boolean(r.deletedPermanently),
  };
}

export async function publishPost(
  config: WordPressConfig | undefined,
  postId: number,
): Promise<WPPost> {
  const post = await postJson<Record<string, unknown>>(
    '/wordpress/publishPost',
    { id: postId },
    config,
  );
  return normalizePost(post);
}

export async function unpublishPost(
  config: WordPressConfig | undefined,
  postId: number,
): Promise<WPPost> {
  const post = await postJson<Record<string, unknown>>(
    '/wordpress/unpublishPost',
    { id: postId },
    config,
  );
  return normalizePost(post);
}

export async function listPosts(
  config: WordPressConfig | undefined,
  page = 1,
  perPage = 15,
  status?: WPListStatus,
): Promise<WPPostListResponse> {
  const r = await postJson<Record<string, unknown>>(
    '/wordpress/listPosts',
    { page, perPage, ...(status ? { status } : {}) },
    config,
  );
  return {
    posts: Array.isArray(r.posts) ? r.posts.map((p) => normalizePost(p as Record<string, unknown>)) : [],
    total: Number(r.total ?? 0),
    totalPages: Number(r.totalPages ?? 0),
    page: Number(r.page ?? page),
    perPage: Number(r.perPage ?? perPage),
  };
}

export async function listDraftPosts(
  config: WordPressConfig | undefined,
  page = 1,
  perPage = 15,
): Promise<WPPostListResponse> {
  const r = await postJson<Record<string, unknown>>(
    '/wordpress/listDrafts',
    { page, perPage },
    config,
  );
  return {
    posts: Array.isArray(r.posts) ? r.posts.map((p) => normalizePost(p as Record<string, unknown>)) : [],
    total: Number(r.total ?? 0),
    totalPages: Number(r.totalPages ?? 0),
    page: Number(r.page ?? page),
    perPage: Number(r.perPage ?? perPage),
  };
}

export async function listPublishedPosts(
  config: WordPressConfig | undefined,
  page = 1,
  perPage = 15,
): Promise<WPPostListResponse> {
  const r = await postJson<Record<string, unknown>>(
    '/wordpress/listPublished',
    { page, perPage },
    config,
  );
  return {
    posts: Array.isArray(r.posts) ? r.posts.map((p) => normalizePost(p as Record<string, unknown>)) : [],
    total: Number(r.total ?? 0),
    totalPages: Number(r.totalPages ?? 0),
    page: Number(r.page ?? page),
    perPage: Number(r.perPage ?? perPage),
  };
}

// ---------------------------------------------------------------------------
// Public API — Media
// ---------------------------------------------------------------------------

export async function uploadMedia(
  config: WordPressConfig | undefined,
  input: UploadMediaInput,
): Promise<WPMedia> {
  const filePath = resolve(input.filePath);
  if (!existsSync(filePath)) {
    throw new Error(`Media file not found: ${filePath}`);
  }
  const filename = input.filename || filePath.split('/').pop() || 'upload.bin';
  const contentBase64 = readFileSync(filePath).toString('base64');

  const media = await postJson<Record<string, unknown>>(
    '/wordpress/uploadMedia',
    {
      filename,
      contentBase64,
      ...(input.contentType ? { contentType: input.contentType } : {}),
      ...(input.altText !== undefined ? { altText: input.altText } : {}),
      ...(input.caption !== undefined ? { caption: input.caption } : {}),
    },
    config,
  );
  return normalizeMedia(media);
}

// ---------------------------------------------------------------------------
// Public API — Taxonomy
// ---------------------------------------------------------------------------

export async function listCategories(
  config: WordPressConfig | undefined,
  page = 1,
  perPage = 50,
  search?: string,
): Promise<WPCategoryListResponse> {
  const r = await postJson<Record<string, unknown>>(
    '/wordpress/listCategories',
    { page, perPage, ...(search ? { search } : {}) },
    config,
  );
  return {
    categories: Array.isArray(r.categories)
      ? r.categories.map((c) => normalizeCategory(c as Record<string, unknown>))
      : [],
    total: Number(r.total ?? 0),
    totalPages: Number(r.totalPages ?? 0),
  };
}

export async function listTags(
  config: WordPressConfig | undefined,
  page = 1,
  perPage = 50,
  search?: string,
): Promise<WPTagListResponse> {
  const r = await postJson<Record<string, unknown>>(
    '/wordpress/listTags',
    { page, perPage, ...(search ? { search } : {}) },
    config,
  );
  return {
    tags: Array.isArray(r.tags) ? r.tags.map((t) => normalizeTag(t as Record<string, unknown>)) : [],
    total: Number(r.total ?? 0),
    totalPages: Number(r.totalPages ?? 0),
  };
}
