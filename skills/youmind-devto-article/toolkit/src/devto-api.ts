/**
 * Dev.to API client via YouMind OpenAPI (aggregated publishing endpoints).
 *
 * 后端把 26 个 per-op 端点合并成 6 个 resource 端点：
 * /publishing/{connections,posts,media,engagement,taxonomy,insights}，
 * body 携带 { platform, action, [actionKey]: payload }（insights 无 action，payload 平铺）。
 * platform=devto 通过 discriminated union 区分。
 * 响应统一是 { platform, data }，callPublishing helper 经 buildPublishingRequest 转换并自动解出 data。
 */

import { loadYouMindConfig, YOUMIND_CONFIG_ERROR_HINT } from './config.js';

export interface DevtoConfig {
  apiKey: string;
  baseUrl: string;
}

export interface DevtoArticle {
  id: number;
  title: string;
  description: string;
  slug: string;
  url: string;
  canonical_url: string | null;
  cover_image: string | null;
  published: boolean;
  published_at: string | null;
  tag_list: string[];
  tags: string;
  body_markdown: string;
  body_html: string;
  comments_count: number;
  positive_reactions_count: number;
  public_reactions_count: number;
  page_views_count: number;
  reading_time_minutes: number;
  user: {
    username: string;
    name: string;
  };
  [key: string]: unknown;
}

export interface CreateArticleOptions {
  title: string;
  bodyMarkdown: string;
  published?: boolean;
  tags?: string[];
  description?: string;
  canonicalUrl?: string;
  coverImage?: string;
  series?: string;
}

export interface UpdateArticleOptions extends Partial<CreateArticleOptions> {}

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

export function loadDevtoConfig(): DevtoConfig {
  const { apiKey, baseUrl } = loadYouMindConfig();
  return {
    apiKey,
    baseUrl,
  };
}

async function post<T = unknown>(
  endpoint: string,
  body: Record<string, unknown> = {},
  config?: DevtoConfig,
): Promise<T> {
  const cfg = config ?? loadDevtoConfig();
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
      `YouMind Dev.to API ${endpoint} failed (${response.status})` +
        `: ${formatOpenApiError(parsed, text)}`,
    );
  }

  return response.json() as Promise<T>;
}

// ─── 6-endpoint adapter: 后端把 26 个 publishing op 合并成 6 个 resource 端点 ───
// 每个端点 body = { platform, action, [actionKey]: <payload> }；insights 无 action（payload 平铺）。
const PUBLISHING_OP_MAP: Record<
  string,
  { route: string; action: string | null; key: string | null }
> = {
  // connections
  listConnections: { route: 'connections', action: 'list', key: 'list' },
  validateConnection: { route: 'connections', action: 'validate', key: null },
  disconnect: { route: 'connections', action: 'disconnect', key: 'disconnect' },
  authenticate: { route: 'connections', action: 'authenticate', key: 'authenticate' },
  getCredentials: { route: 'connections', action: 'getCredentials', key: null },
  // posts
  createPost: { route: 'posts', action: 'create', key: 'create' },
  updatePost: { route: 'posts', action: 'update', key: 'update' },
  getPost: { route: 'posts', action: 'get', key: 'get' },
  listPosts: { route: 'posts', action: 'list', key: 'list' },
  deletePost: { route: 'posts', action: 'delete', key: 'delete' },
  transitionPostState: { route: 'posts', action: 'transition', key: 'transition' },
  getPublishJob: { route: 'posts', action: 'getJob', key: 'getJob' },
  manageQueue: { route: 'posts', action: 'manageQueue', key: 'manageQueue' },
  // media
  uploadMedia: { route: 'media', action: 'upload', key: 'upload' },
  listMedia: { route: 'media', action: 'list', key: 'list' },
  deleteMedia: { route: 'media', action: 'delete', key: 'delete' },
  // engagement
  listEngagement: { route: 'engagement', action: 'list', key: 'list' },
  upsertEngagement: { route: 'engagement', action: 'upsert', key: 'upsert' },
  deleteEngagement: { route: 'engagement', action: 'delete', key: 'delete' },
  listSocial: { route: 'engagement', action: 'listSocial', key: 'listSocial' },
  setSocialAction: { route: 'engagement', action: 'setSocialAction', key: 'setSocialAction' },
  // taxonomy
  listTaxonomy: { route: 'taxonomy', action: 'list', key: 'list' },
  upsertTaxonomy: { route: 'taxonomy', action: 'upsert', key: 'upsert' },
  deleteTaxonomy: { route: 'taxonomy', action: 'delete', key: 'delete' },
  attachPostToTaxonomy: { route: 'taxonomy', action: 'attachPost', key: 'attachPost' },
  // insights（单操作，无 action 区分符）
  getInsights: { route: 'insights', action: null, key: null },
};

// 把旧的 { platform, ...payload } 调用重塑成新的 6-端点 body：{ platform, action, [key]: rest }。
function buildPublishingRequest(
  op: string,
  payload: Record<string, unknown>,
): { route: string; body: Record<string, unknown> } {
  const mapping = PUBLISHING_OP_MAP[op];
  if (!mapping) {
    throw new Error('Unknown publishing op: ' + op);
  }
  const { platform, ...rest } = payload;
  if (mapping.action === null) {
    // insights：scope / postId / dateRange 平铺，无 action
    return { route: mapping.route, body: { platform, ...rest } };
  }
  if (mapping.key === null) {
    // validate / getCredentials：仅需 platform + action，无 sub-payload
    return { route: mapping.route, body: { platform, action: mapping.action } };
  }
  return { route: mapping.route, body: { platform, action: mapping.action, [mapping.key]: rest } };
}

// 聚合层调用：自动从 { platform, data } 解出 data
async function callPublishing<T = unknown>(
  op: string,
  payload: Record<string, unknown>,
  config?: DevtoConfig,
): Promise<T> {
  const { route, body } = buildPublishingRequest(op, payload);
  const wrapped = await post<{ platform: string; data: T }>(`/publishing/${route}`, body, config);
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

  const parts = [parsed.message, parsed.code, parsed.detail?.hint]
    .filter((value): value is string => typeof value === 'string' && value.length > 0);

  if (parsed.detail?.connectUrl) {
    parts.push(`Connect Dev.to: ${parsed.detail.connectUrl}`);
  }

  if (parsed.detail?.upgradeUrl) {
    parts.push(`Upgrade plan: ${parsed.detail.upgradeUrl}`);
  }

  return parts.join(' | ') || rawText.slice(0, 300);
}

function normalizeTagList(tagList: unknown, tags: unknown): string[] {
  if (Array.isArray(tagList)) {
    return tagList.filter((item): item is string => typeof item === 'string' && item.length > 0);
  }

  const source = typeof tagList === 'string' ? tagList : typeof tags === 'string' ? tags : '';
  if (!source) return [];

  return source
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function normalizeArticle(article: Record<string, unknown>): DevtoArticle {
  const tagList = normalizeTagList(article.tagList ?? article.tag_list, article.tags);
  const user = typeof article.user === 'object' && article.user
    ? article.user as Record<string, unknown>
    : {};

  return {
    ...article,
    id: Number(article.id ?? 0),
    title: String(article.title ?? ''),
    description: String(article.description ?? ''),
    slug: String(article.slug ?? ''),
    url: String(article.url ?? ''),
    canonical_url: ((article.canonicalUrl ?? article.canonical_url) as string | null | undefined) ?? null,
    cover_image: ((article.coverImage ?? article.cover_image) as string | null | undefined) ?? null,
    published: Boolean(article.published),
    published_at: ((article.publishedAt ?? article.published_at) as string | null | undefined) ?? null,
    tag_list: tagList,
    tags: typeof article.tags === 'string' ? article.tags : tagList.join(', '),
    body_markdown: String(article.bodyMarkdown ?? article.body_markdown ?? ''),
    body_html: String(article.bodyHtml ?? article.body_html ?? ''),
    comments_count: Number(article.commentsCount ?? article.comments_count ?? 0),
    positive_reactions_count: Number(
      article.positiveReactionsCount ?? article.positive_reactions_count ?? 0,
    ),
    public_reactions_count: Number(
      article.publicReactionsCount ?? article.public_reactions_count ?? 0,
    ),
    page_views_count: Number(article.pageViewsCount ?? article.page_views_count ?? 0),
    reading_time_minutes: Number(article.readingTimeMinutes ?? article.reading_time_minutes ?? 0),
    user: {
      username: String(user.username ?? ''),
      name: String(user.name ?? ''),
    },
  };
}

// 把 CreateArticleOptions / UpdateArticleOptions 映射到 UnifiedPost
function toUnifiedPost(options: Partial<CreateArticleOptions>): Record<string, unknown> {
  const post: Record<string, unknown> = {};
  if (options.title !== undefined) post.title = options.title;
  if (options.bodyMarkdown !== undefined) {
    post.content = { format: 'markdown', body: options.bodyMarkdown };
  }
  if (options.description !== undefined) post.excerpt = options.description;
  if (options.tags !== undefined) post.tags = options.tags;
  if (options.canonicalUrl !== undefined) post.canonicalUrl = options.canonicalUrl;
  if (options.coverImage !== undefined) post.coverImageUrl = options.coverImage;
  if (options.published !== undefined) {
    post.state = options.published ? 'published' : 'draft';
  }
  if (options.series !== undefined) post.extras = { series: options.series };
  return post;
}

export async function createArticle(
  config: DevtoConfig,
  options: CreateArticleOptions,
): Promise<DevtoArticle> {
  const article = await callPublishing<Record<string, unknown>>(
    'createPost',
    { platform: 'devto', post: toUnifiedPost(options) },
    config,
  );

  return normalizeArticle(article);
}

export async function updateArticle(
  config: DevtoConfig,
  id: number,
  options: UpdateArticleOptions,
): Promise<DevtoArticle> {
  const article = await callPublishing<Record<string, unknown>>(
    'updatePost',
    {
      platform: 'devto',
      post: { postId: String(id), ...toUnifiedPost(options) },
    },
    config,
  );

  return normalizeArticle(article);
}

export async function getArticle(
  config: DevtoConfig,
  id: number,
): Promise<DevtoArticle> {
  const article = await callPublishing<Record<string, unknown>>(
    'getPost',
    { platform: 'devto', postId: String(id) },
    config,
  );
  return normalizeArticle(article);
}

export async function listMyArticles(
  config: DevtoConfig,
  page = 1,
  perPage = 30,
): Promise<DevtoArticle[]> {
  const data = await callPublishing<unknown>(
    'listPosts',
    // paging 走 snake_case：后端 service 用 dto.per_page 读取，x-use-camel-case=true 不会改写 body
    { platform: 'devto', filter: { state: 'all', paging: { page, per_page: perPage } } },
    config,
  );
  return normalizeListResponse(data);
}

export async function listDraftArticles(
  config: DevtoConfig,
  page = 1,
  perPage = 30,
): Promise<DevtoArticle[]> {
  const data = await callPublishing<unknown>(
    'listPosts',
    { platform: 'devto', filter: { state: 'draft', paging: { page, per_page: perPage } } },
    config,
  );
  return normalizeListResponse(data);
}

export async function listPublishedArticles(
  config: DevtoConfig,
  page = 1,
  perPage = 30,
): Promise<DevtoArticle[]> {
  const data = await callPublishing<unknown>(
    'listPosts',
    { platform: 'devto', filter: { state: 'published', paging: { page, per_page: perPage } } },
    config,
  );
  return normalizeListResponse(data);
}

export async function publishArticle(
  config: DevtoConfig,
  id: number,
): Promise<DevtoArticle> {
  const article = await callPublishing<Record<string, unknown>>(
    'transitionPostState',
    { platform: 'devto', postId: String(id), toState: 'published' },
    config,
  );
  return normalizeArticle(article);
}

export async function unpublishArticle(
  config: DevtoConfig,
  id: number,
): Promise<DevtoArticle> {
  const article = await callPublishing<Record<string, unknown>>(
    'transitionPostState',
    { platform: 'devto', postId: String(id), toState: 'draft' },
    config,
  );
  return normalizeArticle(article);
}

// listPosts 在不同 adapter 实现里有可能返裸数组或 { articles: [] } 包装；这里两种都兼容
function normalizeListResponse(raw: unknown): DevtoArticle[] {
  if (Array.isArray(raw)) {
    return raw.map((a) => normalizeArticle(a as Record<string, unknown>));
  }
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    const list = (obj.articles ?? obj.items ?? obj.posts) as unknown[] | undefined;
    if (Array.isArray(list)) {
      return list.map((a) => normalizeArticle(a as Record<string, unknown>));
    }
  }
  return [];
}
