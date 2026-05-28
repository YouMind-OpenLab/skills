/**
 * WordPress client via YouMind OpenAPI (aggregated publishing endpoints).
 *
 * 后端统一在 /openapi/v1/publishing/<op>，platform=wordpress 通过 discriminated union 区分。
 * 所有响应统一为 { platform, data }，本层自动解嵌套返回 data，并把 UnifiedPost / UnifiedTaxonomy /
 * UnifiedEngagement 映射回 toolkit 原本的 WP 类型形状（保持 cli/publisher 调用稳定）。
 *
 * 端点契约（apps/youapi spec 016 v2）：
 *   POST /openapi/v1/publishing/{op}    body: { platform: 'wordpress', ...payload }
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadYouMindConfig, YOUMIND_CONFIG_ERROR_HINT } from './config.js';

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

// Comment / category types
export type WPCommentStatus = 'approved' | 'hold' | 'spam' | 'trash';
export type WPCommentListStatus = 'approve' | 'hold' | 'spam' | 'trash' | 'any';

export interface WPComment {
  id: number;
  post: number;
  parent: number;
  author: number;
  authorName: string;
  authorEmail?: string;
  authorUrl?: string;
  content: string;
  status: string;
  date: string;
  link: string;
}

export interface WPCommentListResponse {
  comments: WPComment[];
  total: number;
  totalPages: number;
  page: number;
  perPage: number;
}

export interface WPCommentDeleteResult {
  ok: boolean;
  id: number;
  deletedPermanently: boolean;
}

export interface WPCategoryDeleteResult {
  ok: boolean;
  id: number;
  deletedPermanently: boolean;
}

export interface CreateCategoryInput {
  name: string;
  description?: string;
  slug?: string;
  parent?: number;
}

export interface CreateCommentInput {
  postId: number;
  content: string;
  parent?: number;
  authorName?: string;
  authorEmail?: string;
  authorUrl?: string;
}

export interface UpdateCommentInput {
  content?: string;
  status?: WPCommentStatus;
}

// ---------------------------------------------------------------------------
// Config loading — YouMind apikey only; WP creds live in YouMind backend.
// ---------------------------------------------------------------------------

const DEFAULT_YOUMIND_OPENAPI_BASE_URL = 'https://youmind.com/openapi/v1';
const PLATFORM = 'wordpress' as const;

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

export function loadWordPressConfig(): WordPressConfig {
  const { apiKey, baseUrl } = loadYouMindConfig();
  return {
    apiKey,
    baseUrl: normalizeBaseUrl(baseUrl) || DEFAULT_YOUMIND_OPENAPI_BASE_URL,
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

// 聚合层调用：包一层自动从 { platform, data } 解出 data，对外保持旧接口形状
async function callPublishing<T = unknown>(
  op: string,
  payload: Record<string, unknown>,
  config?: WordPressConfig,
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
// Unified ↔ WP shape mapping
// ---------------------------------------------------------------------------

// WP 原生 status → toolkit 暴露的旧字符串；服务端把 PostState 映射回 WP native，
// 所以这里只做兜底（直接返回值通常已经是 'publish'/'draft'/...）。
function toWPStatus(raw: unknown): WPPostStatus {
  const s = String(raw ?? 'draft');
  // unified enum 名 → WP native（adapter 已经会用 toWordPressStatus 转回 native，
  // 但万一上游直接回了 unified state 也兜住）
  switch (s) {
    case 'published':
      return 'publish';
    case 'scheduled':
      return 'future';
    case 'trashed':
      return 'trash' as WPPostStatus;
    default:
      return s as WPPostStatus;
  }
}

// toolkit 调用方传入的 WP status → PostState enum 值
function wpStatusToPostState(s: WPPostStatus | undefined): string | undefined {
  if (!s) return undefined;
  switch (s) {
    case 'publish':
      return 'published';
    case 'future':
      return 'scheduled';
    case 'private':
      return 'private';
    case 'pending':
    case 'draft':
      return 'draft';
    default:
      return undefined;
  }
}

function normalizePost(post: Record<string, unknown>): WPPost {
  return {
    id: Number(post.id ?? 0),
    title: String(post.title ?? ''),
    content: String(post.content ?? ''),
    excerpt: (post.excerpt as string | undefined) ?? undefined,
    status: toWPStatus(post.status),
    slug: String(post.slug ?? ''),
    link: String(post.link ?? ''),
    author: Number(post.author ?? 0),
    featuredMedia: Number(post.featuredMedia ?? 0),
    categories: Array.isArray(post.categories)
      ? post.categories
          .map((n) => Number(n))
          .filter((n) => Number.isFinite(n))
      : [],
    tags: Array.isArray(post.tags)
      ? post.tags.map((n) => Number(n)).filter((n) => Number.isFinite(n))
      : [],
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

function normalizeComment(c: Record<string, unknown>): WPComment {
  return {
    id: Number(c.id ?? 0),
    post: Number(c.post ?? 0),
    parent: Number(c.parent ?? 0),
    author: Number(c.author ?? 0),
    authorName: String(c.authorName ?? ''),
    authorEmail: (c.authorEmail as string | undefined) ?? undefined,
    authorUrl: (c.authorUrl as string | undefined) ?? undefined,
    content: String(c.content ?? ''),
    status: String(c.status ?? ''),
    date: String(c.date ?? ''),
    link: String(c.link ?? ''),
  };
}

// CreatePostOptions / UpdatePostOptions → UnifiedPost-shaped payload
function buildUnifiedPost(options: UpdatePostOptions): Record<string, unknown> {
  const post: Record<string, unknown> = {};
  if (options.title !== undefined) post.title = options.title;
  if (options.content !== undefined) {
    post.content = { format: 'html', body: options.content };
  }
  if (options.excerpt !== undefined) post.excerpt = options.excerpt;
  const state = wpStatusToPostState(options.status);
  if (state !== undefined) post.state = state;
  if (options.tags !== undefined) post.tags = options.tags;
  if (options.categories !== undefined) post.categories = options.categories;
  if (options.featuredMedia !== undefined) {
    // featuredMedia 是 WP native 字段，下放到 extras 让 adapter 透传给 WP API
    post.extras = { ...(post.extras as Record<string, unknown> | undefined), featuredMedia: options.featuredMedia };
  }
  if (options.slug !== undefined) post.slug = options.slug;
  if (options.date !== undefined) post.scheduledAt = options.date;
  if (options.format !== undefined) {
    post.extras = { ...(post.extras as Record<string, unknown> | undefined), format: options.format };
  }
  return post;
}

// ---------------------------------------------------------------------------
// Public API — Posts
// ---------------------------------------------------------------------------

export async function validateConnection(config?: WordPressConfig): Promise<WPConnectionResult> {
  const r = await callPublishing<Record<string, unknown>>('validateConnection', {}, config);
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
  const post = await callPublishing<Record<string, unknown>>(
    'createPost',
    { post: buildUnifiedPost(options) },
    config,
  );
  return normalizePost(post);
}

export async function updatePost(
  config: WordPressConfig | undefined,
  postId: number,
  options: UpdatePostOptions,
): Promise<WPPost> {
  const post = await callPublishing<Record<string, unknown>>(
    'updatePost',
    { post: { postId: String(postId), ...buildUnifiedPost(options) } },
    config,
  );
  return normalizePost(post);
}

export async function getPost(
  config: WordPressConfig | undefined,
  postId: number,
  context: WPViewContext = 'view',
): Promise<WPPost> {
  const post = await callPublishing<Record<string, unknown>>(
    'getPost',
    { postId: String(postId), context },
    config,
  );
  return normalizePost(post);
}

export async function deletePost(
  config: WordPressConfig | undefined,
  postId: number,
  force = false,
): Promise<WPDeleteResult> {
  const r = await callPublishing<Record<string, unknown>>(
    'deletePost',
    { postId: String(postId), force },
    config,
  );
  return {
    ok: Boolean(r.ok ?? true),
    id: Number(r.id ?? r.postId ?? postId),
    deletedPermanently: Boolean(r.deletedPermanently ?? true),
  };
}

export async function publishPost(
  config: WordPressConfig | undefined,
  postId: number,
): Promise<WPPost> {
  const post = await callPublishing<Record<string, unknown>>(
    'transitionPostState',
    { postId: String(postId), toState: 'published' },
    config,
  );
  return normalizePost(post);
}

export async function unpublishPost(
  config: WordPressConfig | undefined,
  postId: number,
): Promise<WPPost> {
  const post = await callPublishing<Record<string, unknown>>(
    'transitionPostState',
    { postId: String(postId), toState: 'draft' },
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
  const state =
    !status || status === 'any'
      ? 'all'
      : status === 'publish'
        ? 'published'
        : status === 'future'
          ? 'scheduled'
          : status; // 'draft' / 'pending' / 'private' 直接透传
  const r = await callPublishing<Record<string, unknown>>(
    'listPosts',
    { filter: { state, paging: { page, perPage } } },
    config,
  );
  return {
    posts: Array.isArray(r.posts)
      ? r.posts.map((p) => normalizePost(p as Record<string, unknown>))
      : [],
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
  return listPosts(config, page, perPage, 'draft');
}

export async function listPublishedPosts(
  config: WordPressConfig | undefined,
  page = 1,
  perPage = 15,
): Promise<WPPostListResponse> {
  return listPosts(config, page, perPage, 'publish');
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

  const media: Record<string, unknown> = {
    kind: 'image',
    filename,
    source: { base64: contentBase64 },
  };
  if (input.contentType) media.contentType = input.contentType;
  // altText / caption 是 WP-only 字段，UnifiedMedia 没暴露——adapter 也没读，
  // 所以这里就不再下发了（旧 OpenAPI 才直接接收）。

  const result = await callPublishing<Record<string, unknown>>(
    'uploadMedia',
    { media },
    config,
  );
  return normalizeMedia(result);
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
  const filter: Record<string, unknown> = {
    kind: 'category',
    paging: { page, perPage },
  };
  if (search) filter.query = search;
  const r = await callPublishing<Record<string, unknown>>(
    'listTaxonomy',
    { filter },
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
  const filter: Record<string, unknown> = {
    kind: 'tag',
    paging: { page, perPage },
  };
  if (search) filter.query = search;
  const r = await callPublishing<Record<string, unknown>>(
    'listTaxonomy',
    { filter },
    config,
  );
  return {
    tags: Array.isArray(r.tags) ? r.tags.map((t) => normalizeTag(t as Record<string, unknown>)) : [],
    total: Number(r.total ?? 0),
    totalPages: Number(r.totalPages ?? 0),
  };
}

// ---------------------------------------------------------------------------
// Public API — Categories CRUD
// ---------------------------------------------------------------------------

export async function createCategory(
  config: WordPressConfig | undefined,
  input: CreateCategoryInput,
): Promise<WPCategory> {
  const taxonomy: Record<string, unknown> = { kind: 'category', name: input.name };
  if (input.slug !== undefined) taxonomy.slug = input.slug;
  if (input.description !== undefined) taxonomy.description = input.description;
  if (input.parent !== undefined) taxonomy.parentId = String(input.parent);
  const cat = await callPublishing<Record<string, unknown>>(
    'upsertTaxonomy',
    { taxonomy },
    config,
  );
  return normalizeCategory(cat);
}

export async function updateCategory(
  config: WordPressConfig | undefined,
  id: number,
  input: Partial<CreateCategoryInput>,
): Promise<WPCategory> {
  const taxonomy: Record<string, unknown> = { kind: 'category', id: String(id) };
  if (input.name !== undefined) taxonomy.name = input.name;
  if (input.slug !== undefined) taxonomy.slug = input.slug;
  if (input.description !== undefined) taxonomy.description = input.description;
  if (input.parent !== undefined) taxonomy.parentId = String(input.parent);
  const cat = await callPublishing<Record<string, unknown>>(
    'upsertTaxonomy',
    { taxonomy },
    config,
  );
  return normalizeCategory(cat);
}

export async function deleteCategory(
  config: WordPressConfig | undefined,
  id: number,
): Promise<WPCategoryDeleteResult> {
  const r = await callPublishing<Record<string, unknown>>(
    'deleteTaxonomy',
    { kind: 'category', taxonomyId: String(id) },
    config,
  );
  return {
    ok: Boolean(r.ok ?? true),
    id: Number(r.id ?? r.taxonomyId ?? id),
    deletedPermanently: Boolean(r.deletedPermanently ?? true),
  };
}

// ---------------------------------------------------------------------------
// Public API — Comments (走聚合 engagement)
// ---------------------------------------------------------------------------

export async function listComments(
  config: WordPressConfig | undefined,
  opts: { postId?: number; status?: WPCommentListStatus; page?: number; perPage?: number } = {},
): Promise<WPCommentListResponse> {
  const filter: Record<string, unknown> = { kind: 'comment' };
  if (opts.postId !== undefined) filter.postId = String(opts.postId);
  // status 是 WP-only 过滤项；UnifiedEngagement 的 filter 没显式暴露——透传，
  // 服务端 adapter 会无视未识别 key。
  if (opts.status !== undefined) filter.status = opts.status;
  const paging: Record<string, unknown> = {};
  if (opts.page !== undefined) paging.page = opts.page;
  if (opts.perPage !== undefined) paging.perPage = opts.perPage;
  if (Object.keys(paging).length > 0) filter.paging = paging;

  const r = await callPublishing<Record<string, unknown>>(
    'listEngagement',
    { filter },
    config,
  );
  return {
    comments: Array.isArray(r.comments)
      ? r.comments.map((c) => normalizeComment(c as Record<string, unknown>))
      : [],
    total: Number(r.total ?? 0),
    totalPages: Number(r.totalPages ?? 0),
    page: Number(r.page ?? opts.page ?? 1),
    perPage: Number(r.perPage ?? opts.perPage ?? 30),
  };
}

export async function getComment(
  config: WordPressConfig | undefined,
  id: number,
): Promise<WPComment> {
  // 聚合层用 listEngagement + filter.commentId 来读单条；adapter 内部走 getComment。
  const r = await callPublishing<Record<string, unknown>>(
    'listEngagement',
    { filter: { commentId: String(id) } },
    config,
  );
  // adapter 直接回单 comment 对象（不包数组）。万一某个实现包了 comments[]，做下兜底。
  if (Array.isArray(r.comments) && r.comments[0]) {
    return normalizeComment(r.comments[0] as Record<string, unknown>);
  }
  return normalizeComment(r);
}

export async function createComment(
  config: WordPressConfig | undefined,
  input: CreateCommentInput,
): Promise<WPComment> {
  const engagement: Record<string, unknown> = {
    kind: 'comment',
    postId: String(input.postId),
    content: input.content,
  };
  if (input.parent !== undefined) engagement.parentId = String(input.parent);
  if (input.authorName !== undefined) engagement.authorName = input.authorName;
  if (input.authorEmail !== undefined) engagement.authorEmail = input.authorEmail;
  if (input.authorUrl !== undefined) engagement.authorUrl = input.authorUrl;
  const c = await callPublishing<Record<string, unknown>>(
    'upsertEngagement',
    { engagement },
    config,
  );
  return normalizeComment(c);
}

export async function updateComment(
  config: WordPressConfig | undefined,
  id: number,
  input: UpdateCommentInput,
): Promise<WPComment> {
  const engagement: Record<string, unknown> = { commentId: String(id) };
  if (input.content !== undefined) engagement.content = input.content;
  // status 字段 unified 没暴露——只有 content 可改。
  const c = await callPublishing<Record<string, unknown>>(
    'upsertEngagement',
    { engagement },
    config,
  );
  return normalizeComment(c);
}

export async function deleteComment(
  config: WordPressConfig | undefined,
  id: number,
  force = false,
): Promise<WPCommentDeleteResult> {
  const r = await callPublishing<Record<string, unknown>>(
    'deleteEngagement',
    { commentId: String(id), force },
    config,
  );
  return {
    ok: Boolean(r.ok ?? true),
    id: Number(r.id ?? r.commentId ?? id),
    deletedPermanently: Boolean(r.deletedPermanently ?? true),
  };
}
