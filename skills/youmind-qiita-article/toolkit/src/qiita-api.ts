/**
 * Qiita API client via YouMind OpenAPI (aggregated publishing endpoints).
 *
 * 后端把 publishing 收敛到 6 个 resource 端点：connections / posts / media /
 * engagement / taxonomy / insights，body 带 { platform, action, [actionKey] }。
 * platform=qiita 通过 discriminated union 区分；callPublishing helper 通过
 * buildPublishingRequest 把旧 op 名映射到新端点，响应统一是 { platform, data }。
 */

import { loadYouMindConfig, YOUMIND_CONFIG_ERROR_HINT } from './config.js';

export interface QiitaConfig {
  apiKey: string;
  baseUrl: string;
}

export interface QiitaTag {
  name: string;
  versions: string[];
}

export interface QiitaItemUser {
  id: string;
  name: string | null;
  profileImageUrl: string | null;
}

export interface QiitaItem {
  id: string;
  title: string;
  body: string;
  renderedBody?: string;
  url: string;
  private: boolean;
  tags: QiitaTag[];
  likesCount: number;
  stocksCount: number;
  commentsCount: number;
  reactionsCount: number;
  createdAt: string;
  updatedAt: string;
  user?: QiitaItemUser;
}

export interface QiitaItemListResponse {
  items: QiitaItem[];
  total: number;
  page: number;
  perPage: number;
}

export interface QiitaConnectionResult {
  ok: boolean;
  message: string;
  accountId?: string;
  accountName?: string;
  profileImageUrl?: string;
  imageMonthlyUploadLimit?: number;
  imageMonthlyUploadRemaining?: number;
}

export interface QiitaTagInput {
  name: string;
  versions?: string[];
}

export interface CreateItemOptions {
  title: string;
  body: string;
  tags: Array<string | QiitaTagInput>;
  private?: boolean;
  tweet?: boolean;
  slide?: boolean;
}

export interface UpdateItemOptions extends Partial<CreateItemOptions> {}

export interface DeleteItemResult {
  ok: boolean;
  id: string;
}

const DEFAULT_YOUMIND_OPENAPI_BASE_URL = 'https://youmind.com/openapi/v1';

interface OpenApiErrorDetail {
  connectUrl?: string;
  upgradeUrl?: string;
  hint?: string;
  upstreamMessage?: string;
  retryAfter?: string | null;
  status?: number | null;
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

export function loadQiitaConfig(): QiitaConfig {
  const { apiKey, baseUrl } = loadYouMindConfig();
  return {
    apiKey,
    baseUrl: normalizeBaseUrl(baseUrl) || DEFAULT_YOUMIND_OPENAPI_BASE_URL,
  };
}

async function postJson<T = unknown>(
  endpoint: string,
  body: Record<string, unknown> = {},
  config?: QiitaConfig,
): Promise<T> {
  const cfg = config ?? loadQiitaConfig();
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
      `YouMind Qiita API ${endpoint} failed (${response.status})` +
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
  config?: QiitaConfig,
): Promise<T> {
  const { route, body } = buildPublishingRequest(op, payload);
  const wrapped = await postJson<{ platform: string; data: T }>(`/publishing/${route}`, body, config);
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
    parts.push(`Connect Qiita: ${parsed.detail.connectUrl}`);
  }
  if (parsed.detail?.upgradeUrl) {
    parts.push(`Upgrade plan: ${parsed.detail.upgradeUrl}`);
  }
  if (parsed.detail?.upstreamMessage) {
    parts.push(`Qiita said: ${parsed.detail.upstreamMessage}`);
  }
  if (parsed.detail?.retryAfter) {
    parts.push(`Retry-After: ${parsed.detail.retryAfter}`);
  }

  return parts.join(' | ') || rawText.slice(0, 300);
}

function normalizeTag(tag: Record<string, unknown>): QiitaTag {
  return {
    name: String(tag.name ?? ''),
    versions: Array.isArray(tag.versions)
      ? tag.versions.filter((v): v is string => typeof v === 'string')
      : [],
  };
}

function normalizeUser(user: Record<string, unknown> | undefined): QiitaItemUser | undefined {
  if (!user) return undefined;
  return {
    id: String(user.id ?? ''),
    name: (user.name as string | null | undefined) ?? null,
    profileImageUrl: (user.profileImageUrl as string | null | undefined) ?? null,
  };
}

function normalizeItem(item: Record<string, unknown>): QiitaItem {
  return {
    id: String(item.id ?? ''),
    title: String(item.title ?? ''),
    body: String(item.body ?? ''),
    renderedBody: (item.renderedBody as string | undefined) ?? undefined,
    url: String(item.url ?? ''),
    private: Boolean(item.private),
    tags: Array.isArray(item.tags)
      ? item.tags.map((t) => normalizeTag(t as Record<string, unknown>))
      : [],
    likesCount: Number(item.likesCount ?? 0),
    stocksCount: Number(item.stocksCount ?? 0),
    commentsCount: Number(item.commentsCount ?? 0),
    reactionsCount: Number(item.reactionsCount ?? 0),
    createdAt: String(item.createdAt ?? ''),
    updatedAt: String(item.updatedAt ?? ''),
    user: normalizeUser(item.user as Record<string, unknown> | undefined),
  };
}

// 把 Qiita 复合 tag 形状 (Array<string | QiitaTagInput>) 拍平到 string[]
function flattenTagNames(tags: Array<string | QiitaTagInput> | undefined): string[] | undefined {
  if (!tags) return undefined;
  return tags.map((t) => (typeof t === 'string' ? t : t.name)).filter(Boolean);
}

// 把 CreateItemOptions / UpdateItemOptions 映射到 UnifiedPost
function toUnifiedPost(options: Partial<CreateItemOptions>): Record<string, unknown> {
  const post: Record<string, unknown> = {};
  if (options.title !== undefined) post.title = options.title;
  if (options.body !== undefined) {
    post.content = { format: 'markdown', body: options.body };
  }
  const tagNames = flattenTagNames(options.tags);
  if (tagNames) post.tags = tagNames;
  if (options.private !== undefined) {
    post.state = options.private ? 'private' : 'published';
  }
  const extras: Record<string, unknown> = {};
  if (options.tweet !== undefined) extras.tweet = options.tweet;
  if (options.slide !== undefined) extras.slide = options.slide;
  if (Object.keys(extras).length > 0) post.extras = extras;
  return post;
}

export async function validateConnection(config?: QiitaConfig): Promise<QiitaConnectionResult> {
  const response = await callPublishing<Record<string, unknown>>(
    'validateConnection',
    { platform: 'qiita' },
    config,
  );
  return {
    ok: Boolean(response.ok),
    message: String(response.message ?? ''),
    accountId: (response.accountId as string | undefined) ?? undefined,
    accountName: (response.accountName as string | undefined) ?? undefined,
    profileImageUrl: (response.profileImageUrl as string | undefined) ?? undefined,
    imageMonthlyUploadLimit:
      typeof response.imageMonthlyUploadLimit === 'number'
        ? response.imageMonthlyUploadLimit
        : undefined,
    imageMonthlyUploadRemaining:
      typeof response.imageMonthlyUploadRemaining === 'number'
        ? response.imageMonthlyUploadRemaining
        : undefined,
  };
}

export async function createItem(
  config: QiitaConfig | undefined,
  options: CreateItemOptions,
): Promise<QiitaItem> {
  const item = await callPublishing<Record<string, unknown>>(
    'createPost',
    { platform: 'qiita', post: toUnifiedPost(options) },
    config,
  );
  return normalizeItem(item);
}

export async function updateItem(
  config: QiitaConfig | undefined,
  itemId: string,
  options: UpdateItemOptions,
): Promise<QiitaItem> {
  const item = await callPublishing<Record<string, unknown>>(
    'updatePost',
    {
      platform: 'qiita',
      post: { postId: itemId, ...toUnifiedPost(options) },
    },
    config,
  );
  return normalizeItem(item);
}

export async function getItem(
  config: QiitaConfig | undefined,
  itemId: string,
): Promise<QiitaItem> {
  const item = await callPublishing<Record<string, unknown>>(
    'getPost',
    { platform: 'qiita', postId: itemId },
    config,
  );
  return normalizeItem(item);
}

export async function deleteItem(
  config: QiitaConfig | undefined,
  itemId: string,
): Promise<DeleteItemResult> {
  const response = await callPublishing<Record<string, unknown>>(
    'deletePost',
    { platform: 'qiita', postId: itemId },
    config,
  );
  return {
    ok: Boolean(response.ok ?? true),
    id: String(response.id ?? itemId),
  };
}

export async function listMyItems(
  config: QiitaConfig | undefined,
  page = 1,
  perPage = 20,
): Promise<QiitaItemListResponse> {
  const response = await callPublishing<Record<string, unknown>>(
    'listPosts',
    {
      platform: 'qiita',
      // paging 走 snake_case：后端 service 用 dto.per_page 读取，x-use-camel-case=true 不会改写 body
      filter: { paging: { page, per_page: perPage } },
    },
    config,
  );
  return {
    items: Array.isArray(response.items)
      ? response.items.map((it) => normalizeItem(it as Record<string, unknown>))
      : [],
    total: Number(response.total ?? 0),
    page: Number(response.page ?? page),
    perPage: Number(response.perPage ?? perPage),
  };
}

export async function setItemPrivate(
  config: QiitaConfig | undefined,
  itemId: string,
): Promise<QiitaItem> {
  return updateItem(config, itemId, { private: true });
}

export async function setItemPublic(
  config: QiitaConfig | undefined,
  itemId: string,
): Promise<QiitaItem> {
  return updateItem(config, itemId, { private: false });
}
