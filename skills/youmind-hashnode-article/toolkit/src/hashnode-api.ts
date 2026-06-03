/**
 * Hashnode client via YouMind OpenAPI (aggregated publishing endpoints).
 *
 * 后端把原先 26 个 per-op 端点合并成 6 个 resource 端点：
 *   /publishing/{connections,posts,media,engagement,taxonomy,insights}
 * 每个 body = { platform, action, [actionKey]: payload }（insights 无 action，payload 平铺）。
 * platform=hashnode 通过 discriminated union 区分；旧 op 名经 buildPublishingRequest 重塑路由。
 * 所有响应统一为 { platform, data }，本层自动解嵌套返回 data。
 *
 * 关键映射：
 *   - PostState enum: 'draft' / 'published' (草稿状态)
 *   - post.content = { format: 'markdown', body: string }
 *   - publicationId / disableComments / publishedAt / metaTitle / metaDescription / metaImage
 *     / seriesId 等平台特有字段走 post.extras
 *   - blogIdentifier = publicationId
 *   - tags: string[]（slug 列表）
 *   - taxonomy（series/tag）: listTaxonomy { filter: { kind } } + upsertTaxonomy { taxonomy: { kind: 'series', ... } }
 *
 * 端点契约（apps/youapi spec 016 v2，6-resource 端点；旧 op 名见 PUBLISHING_OP_MAP）：
 *   posts:    create / update / get / list / delete / transition（post/postId/filter 嵌套在 action key 下）
 *   taxonomy: list（filter: { kind: 'tag'|'series', query? } 嵌套在 list 下）
 *   connections: validate（仅 { platform, action }）
 */

import { loadYouMindConfig, YOUMIND_CONFIG_ERROR_HINT } from './config.js';

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

export function loadHashnodeConfig(): HashnodeConfig {
  const { apiKey, baseUrl } = loadYouMindConfig();
  return {
    apiKey,
    baseUrl,
  };
}

async function postJson<T = unknown>(
  endpoint: string,
  body: Record<string, unknown> = {},
  config?: HashnodeConfig,
): Promise<T> {
  const cfg = config ?? loadHashnodeConfig();
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
      `YouMind Hashnode API ${endpoint} failed (${response.status})` +
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

// 聚合层调用：包一层自动从 { platform, data } 解出 data，对外保持旧接口形状
async function callPublishing<T = unknown>(
  op: string,
  payload: Record<string, unknown>,
  config?: HashnodeConfig,
): Promise<T> {
  const { route, body } = buildPublishingRequest(op, payload);
  const wrapped = await postJson<{ platform: string; data: T }>(
    `/publishing/${route}`,
    body,
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

// 把 SDK 旧的扁平 options 折叠成聚合层的 UnifiedPost 形状
function toUnifiedPost(options: CreateHashnodePostOptions | UpdateHashnodePostOptions): Record<string, unknown> {
  const post: Record<string, unknown> = {};
  if (options.title !== undefined) post.title = options.title;
  if (options.contentMarkdown !== undefined) {
    post.content = { format: 'markdown', body: options.contentMarkdown };
  }
  if (options.subtitle !== undefined) post.excerpt = options.subtitle;
  if (options.tags !== undefined) post.tags = options.tags;
  if (options.coverImageUrl !== undefined) post.coverImageUrl = options.coverImageUrl;
  if (options.canonicalUrl !== undefined) post.canonicalUrl = options.canonicalUrl;
  if (options.slug !== undefined) post.slug = options.slug;

  // 平台特有字段进 extras——adapter 内的 toNative 会把它们展开回 native payload
  const extras: Record<string, unknown> = {};
  if (options.seriesId !== undefined) extras.seriesId = options.seriesId;
  if (options.publishedAt !== undefined) extras.publishedAt = options.publishedAt;
  if (options.disableComments !== undefined) extras.disableComments = options.disableComments;
  if (options.metaTitle !== undefined) extras.metaTitle = options.metaTitle;
  if (options.metaDescription !== undefined) extras.metaDescription = options.metaDescription;
  if (options.metaImage !== undefined) extras.metaImage = options.metaImage;
  if (Object.keys(extras).length > 0) post.extras = extras;

  return post;
}

export async function createDraft(
  config: HashnodeConfig,
  options: CreateHashnodePostOptions,
): Promise<HashnodePost> {
  const post = { ...toUnifiedPost(options), state: 'draft' };
  const data = await callPublishing<Record<string, unknown>>(
    'createPost',
    { platform: 'hashnode', post },
    config,
  );
  return normalizePost(data);
}

export async function publishDraft(config: HashnodeConfig, id: string): Promise<HashnodePost> {
  const data = await callPublishing<Record<string, unknown>>(
    'transitionPostState',
    { platform: 'hashnode', postId: id, toState: 'published' },
    config,
  );
  return normalizePost(data);
}

export async function removeDraft(
  config: HashnodeConfig,
  id: string,
): Promise<{ ok: boolean; id: string }> {
  const data = await callPublishing<Record<string, unknown>>(
    'deletePost',
    { platform: 'hashnode', postId: id, state: 'draft' },
    config,
  );
  return {
    ok: Boolean(data.ok ?? true),
    id: String(data.id ?? id),
  };
}

export async function removePost(
  config: HashnodeConfig,
  id: string,
): Promise<{ ok: boolean; id: string }> {
  const data = await callPublishing<Record<string, unknown>>(
    'deletePost',
    { platform: 'hashnode', postId: id },
    config,
  );
  return {
    ok: Boolean(data.ok ?? true),
    id: String(data.id ?? id),
  };
}

export async function getDraft(config: HashnodeConfig, id: string): Promise<HashnodePost> {
  const data = await callPublishing<Record<string, unknown>>(
    'getPost',
    { platform: 'hashnode', postId: id, state: 'draft' },
    config,
  );
  return normalizePost(data);
}

export async function listDrafts(
  config: HashnodeConfig,
  page = 1,
  limit = 15,
): Promise<HashnodePostListResponse> {
  const data = await callPublishing<Record<string, unknown>>(
    'listPosts',
    {
      platform: 'hashnode',
      filter: { state: 'draft', paging: { page, limit } },
    },
    config,
  );
  return normalizeListResponse(data);
}

export async function createPost(
  config: HashnodeConfig,
  options: CreateHashnodePostOptions,
): Promise<HashnodePost> {
  const post = { ...toUnifiedPost(options), state: 'published' };
  const data = await callPublishing<Record<string, unknown>>(
    'createPost',
    { platform: 'hashnode', post },
    config,
  );
  return normalizePost(data);
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
  const post = { postId: id, ...toUnifiedPost(options) };
  const data = await callPublishing<Record<string, unknown>>(
    'updatePost',
    { platform: 'hashnode', post },
    config,
  );
  return normalizePost(data);
}

export async function getPost(config: HashnodeConfig, id: string): Promise<HashnodePost> {
  const data = await callPublishing<Record<string, unknown>>(
    'getPost',
    { platform: 'hashnode', postId: id },
    config,
  );
  return normalizePost(data);
}

export async function listPosts(
  config: HashnodeConfig,
  page = 1,
  limit = 15,
): Promise<HashnodePostListResponse> {
  const data = await callPublishing<Record<string, unknown>>(
    'listPosts',
    { platform: 'hashnode', filter: { paging: { page, limit } } },
    config,
  );
  return normalizeListResponse(data);
}

export async function listPublishedPosts(
  config: HashnodeConfig,
  page = 1,
  limit = 15,
): Promise<HashnodePostListResponse> {
  const data = await callPublishing<Record<string, unknown>>(
    'listPosts',
    {
      platform: 'hashnode',
      filter: { state: 'published', paging: { page, limit } },
    },
    config,
  );
  return normalizeListResponse(data);
}

export async function searchTags(
  config: HashnodeConfig,
  query: string,
  limit = 5,
): Promise<HashnodeTag[]> {
  const data = await callPublishing<unknown>(
    'listTaxonomy',
    {
      platform: 'hashnode',
      filter: { kind: 'tag', query, paging: { limit } },
    },
    config,
  );
  // 后端响应可能是数组、或 { tags: [...] } / { items: [...] }——三种都吞下
  const list = Array.isArray(data)
    ? data
    : Array.isArray((data as Record<string, unknown>)?.tags)
      ? ((data as Record<string, unknown>).tags as unknown[])
      : Array.isArray((data as Record<string, unknown>)?.items)
        ? ((data as Record<string, unknown>).items as unknown[])
        : [];
  return list.map((tag) => normalizeTag(tag as Record<string, unknown>));
}

export async function validateConnection(
  config: HashnodeConfig,
): Promise<HashnodeConnectionResult> {
  return callPublishing<HashnodeConnectionResult>(
    'validateConnection',
    { platform: 'hashnode' },
    config,
  );
}
