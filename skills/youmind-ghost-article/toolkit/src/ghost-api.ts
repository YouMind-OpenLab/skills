/**
 * Ghost client via YouMind OpenAPI (aggregated publishing endpoints).
 *
 * 后端统一在 /openapi/v1/publishing/<op>，platform=ghost 通过 discriminated union 区分。
 * 所有响应统一为 { platform, data }，本层自动解嵌套返回 data，并把 UnifiedPost / UnifiedMedia
 * 映射回 toolkit 原本的 Ghost 类型形状（保持 cli/publisher 调用稳定）。
 *
 * 端点契约（apps/youapi spec 016 v2）：
 *   POST /openapi/v1/publishing/{op}    body: { platform: 'ghost', ...payload }
 */

import { basename, extname, resolve } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
import { loadYouMindConfig, YOUMIND_CONFIG_ERROR_HINT } from './config.js';

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

const PLATFORM = 'ghost' as const;

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

export function loadGhostConfig(): GhostConfig {
  const { apiKey, baseUrl } = loadYouMindConfig();
  return {
    apiKey,
    baseUrl,
  };
}

async function postJson<T = unknown>(
  endpoint: string,
  body: Record<string, unknown> = {},
  config?: GhostConfig,
): Promise<T> {
  const cfg = config ?? loadGhostConfig();
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
      `YouMind Ghost API ${endpoint} failed (${response.status})` +
        `: ${formatOpenApiError(parsed, text)}`,
    );
  }

  return response.json() as Promise<T>;
}

// 聚合层调用：包一层自动从 { platform, data } 解出 data，对外保持旧接口形状
async function callPublishing<T = unknown>(
  op: string,
  payload: Record<string, unknown>,
  config?: GhostConfig,
): Promise<T> {
  const wrapped = await postJson<{ platform: string; data: T }>(
    `/publishing/${op}`,
    { platform: PLATFORM, ...payload },
    config,
  );
  return wrapped.data;
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
    feature_image: ((tag.featureImage ?? tag.feature_image) as string | null | undefined) ?? null,
    visibility: String(tag.visibility ?? 'public'),
  };
}

function normalizePost(post: Record<string, unknown>): GhostPost {
  const primaryTagRaw = post.primaryTag ?? post.primary_tag;
  return {
    ...post,
    id: String(post.id ?? ''),
    uuid: String(post.uuid ?? ''),
    title: String(post.title ?? ''),
    slug: String(post.slug ?? ''),
    html: (post.html as string | null | undefined) ?? null,
    excerpt: (post.excerpt as string | null | undefined) ?? null,
    custom_excerpt: ((post.customExcerpt ?? post.custom_excerpt) as string | null | undefined) ?? null,
    feature_image: ((post.featureImage ?? post.feature_image) as string | null | undefined) ?? null,
    featured: Boolean(post.featured),
    status: (post.status as GhostPost['status']) ?? 'draft',
    visibility: (post.visibility as GhostPost['visibility']) ?? 'public',
    created_at: String(post.createdAt ?? post.created_at ?? ''),
    updated_at: String(post.updatedAt ?? post.updated_at ?? ''),
    published_at: ((post.publishedAt ?? post.published_at) as string | null | undefined) ?? null,
    url: String(post.url ?? ''),
    adminUrl:
      (post.adminUrl as string | null | undefined) ??
      (post.admin_url as string | null | undefined) ??
      null,
    tags: Array.isArray(post.tags) ? post.tags.map((tag) => normalizeTag(tag as Record<string, unknown>)) : [],
    primary_tag:
      primaryTagRaw && typeof primaryTagRaw === 'object'
        ? normalizeTag(primaryTagRaw as Record<string, unknown>)
        : null,
  };
}

// Ghost adapter 只接受 string 列表的 tag 名（toNative 内 post.tags 直传），所以这里把
// {name}|{id} 全部展平成字符串名。
function normalizeTagNames(tags?: Array<{ name: string } | { id: string }>): string[] | undefined {
  if (!tags?.length) return undefined;
  return tags
    .map((tag) => ('name' in tag ? tag.name : tag.id))
    .map((tag) => tag.trim())
    .filter(Boolean);
}

// CreatePostOptions → UnifiedPost-shaped payload（Ghost adapter 内 toNative
// 会从 unified.state ∈ {draft, published} 映射到 native status）。
function buildUnifiedPost(
  options: Partial<CreatePostOptions> & { updated_at?: string },
): Record<string, unknown> {
  const post: Record<string, unknown> = {};
  if (options.title !== undefined) post.title = options.title;
  if (options.html !== undefined) {
    post.content = { format: 'html', body: options.html };
  }
  if (options.custom_excerpt !== undefined) post.excerpt = options.custom_excerpt;
  if (options.status !== undefined) {
    // Ghost adapter 只看 'draft' 与其他（非 draft 视为 published）；scheduled 也走 published 路径，
    // 由 publishedAt 字段决定排程。
    post.state = options.status === 'draft' ? 'draft' : 'published';
  }
  if (options.tags !== undefined) {
    const names = normalizeTagNames(options.tags);
    if (names) post.tags = names;
  }
  if (options.feature_image !== undefined) post.coverImageUrl = options.feature_image;
  if (options.slug !== undefined) post.slug = options.slug;
  if (options.published_at !== undefined) post.scheduledAt = options.published_at;
  // Ghost-only 字段（featured / visibility / canonicalUrl / updated_at）下放到 extras 透传。
  const extras: Record<string, unknown> = {};
  if (options.featured !== undefined) extras.featured = options.featured;
  if (options.visibility !== undefined) extras.visibility = options.visibility;
  if (options.updated_at !== undefined) extras.updatedAt = options.updated_at;
  if (Object.keys(extras).length > 0) post.extras = extras;
  return post;
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
  const post = await callPublishing<Record<string, unknown>>(
    'createPost',
    { post: buildUnifiedPost(options) },
    config,
  );
  return normalizePost(post);
}

export async function updatePost(
  config: GhostConfig,
  postId: string,
  options: Partial<CreatePostOptions> & { updated_at?: string },
): Promise<GhostPost> {
  const post = await callPublishing<Record<string, unknown>>(
    'updatePost',
    { post: { postId, ...buildUnifiedPost(options) } },
    config,
  );
  return normalizePost(post);
}

export async function getPost(config: GhostConfig, postId: string): Promise<GhostPost> {
  const post = await callPublishing<Record<string, unknown>>(
    'getPost',
    { postId },
    config,
  );
  return normalizePost(post);
}

export async function publishPost(config: GhostConfig, postId: string): Promise<GhostPost> {
  const post = await callPublishing<Record<string, unknown>>(
    'transitionPostState',
    { postId, toState: 'published' },
    config,
  );
  return normalizePost(post);
}

export async function unpublishPost(config: GhostConfig, postId: string): Promise<GhostPost> {
  const post = await callPublishing<Record<string, unknown>>(
    'transitionPostState',
    { postId, toState: 'draft' },
    config,
  );
  return normalizePost(post);
}

export async function deletePost(
  config: GhostConfig,
  postId: string,
): Promise<{ ok: boolean; id: string }> {
  const r = await callPublishing<Record<string, unknown>>(
    'deletePost',
    { postId },
    config,
  );
  return {
    ok: Boolean(r.ok ?? true),
    id: String(r.id ?? r.postId ?? postId),
  };
}

export async function listPosts(
  config: GhostConfig,
  page = 1,
  limit = 15,
  status?: GhostPost['status'],
): Promise<{ posts: GhostPost[]; total: number }> {
  // Ghost adapter 接 paging 透传给 ghost-openapi.service.listPosts，原 dto 里只看 page/limit。
  const state =
    !status
      ? 'all'
      : status === 'sent'
        ? 'all' // unified PostState 没有 'sent'，回退到全量；调用方很少用这个值
        : status; // 'draft' / 'published' / 'scheduled'
  const r = await callPublishing<Record<string, unknown>>(
    'listPosts',
    { filter: { state, paging: { page, limit } } },
    config,
  );
  return {
    posts: Array.isArray(r.posts)
      ? r.posts.map((entry) => normalizePost(entry as Record<string, unknown>))
      : [],
    total: Number(r.total ?? 0),
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
  const media: Record<string, unknown> = {
    kind: 'image',
    filename,
    source: { base64: content.toString('base64') },
  };
  const contentType = detectMimeType(filename);
  if (contentType) media.contentType = contentType;

  const response = await callPublishing<Record<string, unknown>>(
    'uploadMedia',
    { media },
    config,
  );
  return {
    url: String(response.url ?? response.sourceUrl ?? ''),
    ref: (response.ref as string | null | undefined) ?? null,
  };
}

export async function validateConnection(config: GhostConfig): Promise<GhostConnectionResult> {
  const response = await callPublishing<Record<string, unknown>>('validateConnection', {}, config);
  return {
    ok: Boolean(response.ok),
    message: String(response.message ?? ''),
    siteTitle: (response.siteTitle as string | null | undefined) ?? null,
    siteUrl: (response.siteUrl as string | null | undefined) ?? null,
    total: typeof response.total === 'number' ? response.total : undefined,
  };
}
