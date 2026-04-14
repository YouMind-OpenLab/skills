/**
 * Ghost API client via YouMind OpenAPI.
 *
 * The skill only requires a YouMind API key locally. The user's Ghost
 * site URL and Ghost Admin API key are configured once inside YouMind, and
 * the YouMind backend attaches them when proxying Ghost requests.
 */

import { basename, dirname, extname, resolve } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

export interface GhostConfig {
  apiKey: string;
  baseUrl: string;
}

export interface GhostTag {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  feature_image: string | null;
  visibility: string;
  [key: string]: unknown;
}

export interface GhostPost {
  id: string;
  uuid: string;
  title: string;
  slug: string;
  html: string | null;
  excerpt: string | null;
  custom_excerpt: string | null;
  feature_image: string | null;
  featured: boolean;
  status: 'published' | 'draft' | 'scheduled' | 'sent';
  visibility: 'public' | 'members' | 'paid' | 'tiers';
  created_at: string;
  updated_at: string;
  published_at: string | null;
  url: string;
  adminUrl?: string | null;
  tags: GhostTag[];
  primary_tag: GhostTag | null;
  [key: string]: unknown;
}

export interface CreatePostOptions {
  title: string;
  html: string;
  custom_excerpt?: string;
  status?: 'published' | 'draft' | 'scheduled';
  tags?: Array<{ name: string } | { id: string }>;
  feature_image?: string;
  featured?: boolean;
  visibility?: 'public' | 'members' | 'paid' | 'tiers';
  slug?: string;
  published_at?: string;
}

export interface GhostImage {
  url: string;
  ref: string | null;
}

export interface GhostConnectionResult {
  ok: boolean;
  message: string;
  siteTitle?: string | null;
  siteUrl?: string | null;
  total?: number;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_DIR = resolve(__dirname, '../..');

const DEFAULT_YOUMIND_OPENAPI_BASE_URL = 'https://youmind.com/openapi/v1';

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

export function loadGhostConfig(): GhostConfig {
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
  config?: GhostConfig,
): Promise<T> {
  const cfg = config ?? loadGhostConfig();
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
      `YouMind Ghost API ${endpoint} failed (${response.status})` +
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
    parts.push(`Connect Ghost: ${parsed.detail.connectUrl}`);
  }

  if (parsed.detail?.upgradeUrl) {
    parts.push(`Upgrade plan: ${parsed.detail.upgradeUrl}`);
  }

  return parts.join(' | ') || rawText.slice(0, 300);
}

function normalizeTag(tag: Record<string, unknown>): GhostTag {
  return {
    ...tag,
    id: String(tag.id ?? ''),
    name: String(tag.name ?? ''),
    slug: String(tag.slug ?? ''),
    description: (tag.description as string | null | undefined) ?? null,
    feature_image: (tag.feature_image as string | null | undefined) ?? null,
    visibility: String(tag.visibility ?? 'public'),
  };
}

function normalizePost(post: Record<string, unknown>): GhostPost {
  return {
    ...post,
    id: String(post.id ?? ''),
    uuid: String(post.uuid ?? ''),
    title: String(post.title ?? ''),
    slug: String(post.slug ?? ''),
    html: (post.html as string | null | undefined) ?? null,
    excerpt: (post.excerpt as string | null | undefined) ?? null,
    custom_excerpt: (post.custom_excerpt as string | null | undefined) ?? null,
    feature_image: (post.feature_image as string | null | undefined) ?? null,
    featured: Boolean(post.featured),
    status: (post.status as GhostPost['status']) ?? 'draft',
    visibility: (post.visibility as GhostPost['visibility']) ?? 'public',
    created_at: String(post.created_at ?? ''),
    updated_at: String(post.updated_at ?? ''),
    published_at: (post.published_at as string | null | undefined) ?? null,
    url: String(post.url ?? ''),
    adminUrl:
      (post.adminUrl as string | null | undefined) ??
      (post.admin_url as string | null | undefined) ??
      null,
    tags: Array.isArray(post.tags) ? post.tags.map((tag) => normalizeTag(tag as Record<string, unknown>)) : [],
    primary_tag:
      post.primary_tag && typeof post.primary_tag === 'object'
        ? normalizeTag(post.primary_tag as Record<string, unknown>)
        : null,
  };
}

function normalizeTagNames(tags?: Array<{ name: string } | { id: string }>): string[] | undefined {
  if (!tags?.length) return undefined;
  return tags
    .map((tag) => ('name' in tag ? tag.name : tag.id))
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function detectMimeType(filename: string): string | undefined {
  switch (extname(filename).toLowerCase()) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.gif':
      return 'image/gif';
    case '.webp':
      return 'image/webp';
    case '.svg':
      return 'image/svg+xml';
    default:
      return undefined;
  }
}

export async function createPost(
  config: GhostConfig,
  options: CreatePostOptions,
): Promise<GhostPost> {
  const post = await postJson<Record<string, unknown>>(
    '/ghost/createPost',
    {
      title: options.title,
      html: options.html,
      customExcerpt: options.custom_excerpt,
      status: options.status ?? 'draft',
      tags: normalizeTagNames(options.tags),
      featureImage: options.feature_image,
      featured: options.featured,
      visibility: options.visibility,
      slug: options.slug,
      publishedAt: options.published_at,
    },
    config,
  );

  return normalizePost(post);
}

export async function updatePost(
  config: GhostConfig,
  postId: string,
  options: Partial<CreatePostOptions> & { updated_at?: string },
): Promise<GhostPost> {
  const post = await postJson<Record<string, unknown>>(
    '/ghost/updatePost',
    {
      id: postId,
      title: options.title,
      html: options.html,
      customExcerpt: options.custom_excerpt,
      status: options.status,
      tags: normalizeTagNames(options.tags),
      featureImage: options.feature_image,
      featured: options.featured,
      visibility: options.visibility,
      slug: options.slug,
      publishedAt: options.published_at,
    },
    config,
  );

  return normalizePost(post);
}

export async function getPost(config: GhostConfig, postId: string): Promise<GhostPost> {
  const post = await postJson<Record<string, unknown>>('/ghost/getPost', { id: postId }, config);
  return normalizePost(post);
}

export async function publishPost(config: GhostConfig, postId: string): Promise<GhostPost> {
  const post = await postJson<Record<string, unknown>>('/ghost/publishPost', { id: postId }, config);
  return normalizePost(post);
}

export async function unpublishPost(config: GhostConfig, postId: string): Promise<GhostPost> {
  const post = await postJson<Record<string, unknown>>('/ghost/unpublishPost', { id: postId }, config);
  return normalizePost(post);
}

export async function listPosts(
  config: GhostConfig,
  page = 1,
  limit = 15,
  status?: GhostPost['status'],
): Promise<{ posts: GhostPost[]; total: number }> {
  const response = await postJson<{ posts?: Record<string, unknown>[]; total?: number }>(
    '/ghost/listPosts',
    { page, limit, status },
    config,
  );

  return {
    posts: (response.posts ?? []).map((entry) => normalizePost(entry)),
    total: Number(response.total ?? 0),
  };
}

export async function listDraftPosts(
  config: GhostConfig,
  page = 1,
  limit = 15,
): Promise<{ posts: GhostPost[]; total: number }> {
  return listPosts(config, page, limit, 'draft');
}

export async function listPublishedPosts(
  config: GhostConfig,
  page = 1,
  limit = 15,
): Promise<{ posts: GhostPost[]; total: number }> {
  return listPosts(config, page, limit, 'published');
}

export async function uploadImage(config: GhostConfig, filePath: string): Promise<GhostImage> {
  const resolvedPath = resolve(filePath);
  if (!existsSync(resolvedPath)) {
    throw new Error(`Feature image file not found: ${resolvedPath}`);
  }

  const filename = basename(resolvedPath);
  const content = readFileSync(resolvedPath);
  const response = await postJson<Record<string, unknown>>(
    '/ghost/uploadImage',
    {
      filename,
      contentBase64: content.toString('base64'),
      contentType: detectMimeType(filename),
    },
    config,
  );

  return {
    url: String(response.url ?? ''),
    ref: (response.ref as string | null | undefined) ?? null,
  };
}

export async function validateConnection(config: GhostConfig): Promise<GhostConnectionResult> {
  const response = await postJson<Record<string, unknown>>('/ghost/validateConnection', {}, config);
  return {
    ok: Boolean(response.ok),
    message: String(response.message ?? ''),
    siteTitle: (response.siteTitle as string | null | undefined) ?? null,
    siteUrl: (response.siteUrl as string | null | undefined) ?? null,
    total: typeof response.total === 'number' ? response.total : undefined,
  };
}
