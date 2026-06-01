/**
 * WeChat client via YouMind OpenAPI (aggregated publishing endpoints).
 *
 * 后端把旧的 26 个 per-op 端点合并成 6 个 resource 端点；platform=wechat 通过 body.platform 区分。
 * 所有响应统一为 { platform, data }，本层自动解嵌套返回 data。
 *
 * 端点契约（apps/youapi spec 016 v2 → 6-resource）：
 *   POST /openapi/v1/publishing/connections   body: { platform, action, [actionKey]? }
 *   POST /openapi/v1/publishing/posts         body: { platform, action, [actionKey] }
 *   POST /openapi/v1/publishing/media         body: { platform, action, [actionKey] }
 *   POST /openapi/v1/publishing/engagement    body: { platform, action, [actionKey] }
 *   POST /openapi/v1/publishing/taxonomy      body: { platform, action, [actionKey] }
 *   POST /openapi/v1/publishing/insights      body: { platform, scope, postId?, dateRange? }  // 无 action
 *
 * 旧 op 名（validateConnection / createPost / getPost / listPosts / ...）经 buildPublishingRequest
 * 映射到 { route, action, key }，本层 callPublishing 保持原调用站点零改动。
 *
 * 跨边界注意：
 * - 草稿 mediaId ↔ unified postId；发布 articleId ↔ unified postId（用 state 区分）。
 * - 一稿多图文：把多个 article 放进 post.extras.articles（adapter 优先读这个数组）。
 * - 素材 / 永久素材接口（uploadMaterial / listMaterial 等）当前 toolkit 用不到，未在此暴露。
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadYouMindConfig, YOUMIND_CONFIG_ERROR_HINT } from './config.js';

// ---------------------------------------------------------------------------
// Public types — 维持旧 toolkit 对外契约，调用方（cli / publisher / fetch-stats）零改动
// ---------------------------------------------------------------------------

export interface WeChatConfig {
  apiKey: string;
  baseUrl: string;
}

export interface WeChatConnectionResult {
  ok: boolean;
  message: string;
  appid: string;
  tokenExpiresIn: number;
}

export interface WeChatResultLink {
  label: string;
  kind: string;
  url: string;
}

export interface WeChatArticleInput {
  title: string;
  content: string;
  thumbMediaId: string;
  author?: string;
  digest?: string;
  contentSourceUrl?: string;
  needOpenComment?: 0 | 1;
  onlyFansCanComment?: 0 | 1;
  showCoverPic?: 0 | 1;
}

export interface WeChatArticle {
  title: string;
  content: string;
  author: string;
  thumbMediaId: string;
  thumbUrl: string;
  digest: string;
  contentSourceUrl: string;
  url: string;
  needOpenComment: number;
  onlyFansCanComment: number;
  showCoverPic: number;
}

export interface WeChatDraft {
  mediaId: string;
  articles: WeChatArticle[];
  updateTime?: number;
  resultLinks?: WeChatResultLink[];
}

export interface WeChatDraftListResponse {
  items: WeChatDraft[];
  totalCount: number;
  itemCount: number;
}

export interface WeChatPublishedItem {
  articleId: string;
  articles: WeChatArticle[];
  updateTime?: number;
  resultLinks?: WeChatResultLink[];
}

export interface WeChatPublishSubmit {
  publishId: string;
  msgDataId?: string;
  resultLinks?: WeChatResultLink[];
}

export interface WeChatPublishStatus {
  publishId: string;
  publishStatus: number;
  articleId?: string;
  articles?: WeChatArticle[];
  failIdx?: number[];
  resultLinks?: WeChatResultLink[];
}

export interface WeChatArticleStatsItem {
  refDate: string;
  msgid: string;
  title?: string;
  intPageReadUser: number;
  intPageReadCount: number;
  oriPageReadUser: number;
  oriPageReadCount: number;
  shareUser: number;
  shareCount: number;
  addToFavUser: number;
  addToFavCount: number;
}

const WECHAT_PLATFORM_URL = 'https://mp.weixin.qq.com/';
const PLATFORM = 'wechat' as const;

// ---------------------------------------------------------------------------
// Config loading
// ---------------------------------------------------------------------------

export function loadWeChatConfig(): WeChatConfig {
  const { apiKey, baseUrl } = loadYouMindConfig();
  return {
    apiKey,
    baseUrl,
  };
}

// ---------------------------------------------------------------------------
// HTTP transport
// ---------------------------------------------------------------------------

interface OpenApiErrorDetail {
  connectUrl?: string;
  upgradeUrl?: string;
  hint?: string;
  upstreamError?: string;
  errcode?: number;
  errmsg?: string;
  status?: number | null;
}

interface OpenApiErrorResponse {
  message?: string;
  code?: string;
  detail?: OpenApiErrorDetail;
}

async function postJson<T = unknown>(
  endpoint: string,
  body: Record<string, unknown> = {},
  config?: WeChatConfig,
): Promise<T> {
  const cfg = config ?? loadWeChatConfig();
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
      `YouMind WeChat API ${endpoint} failed (${response.status}): ${formatOpenApiError(parsed, text)}`,
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

// 聚合层调用：自动从 { platform, data } 解出 data，对外保持旧接口形状
async function callPublishing<T = unknown>(
  op: string,
  payload: Record<string, unknown>,
  config?: WeChatConfig,
): Promise<T> {
  const { route, body } = buildPublishingRequest(op, { platform: PLATFORM, ...payload });
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

function formatOpenApiError(parsed: OpenApiErrorResponse | null, raw: string): string {
  if (!parsed) return raw.slice(0, 300);
  const parts = [parsed.message, parsed.code, parsed.detail?.hint].filter(
    (v): v is string => typeof v === 'string' && v.length > 0,
  );
  if (parsed.detail?.connectUrl) parts.push(`Connect WeChat: ${parsed.detail.connectUrl}`);
  if (parsed.detail?.upgradeUrl) parts.push(`Upgrade plan: ${parsed.detail.upgradeUrl}`);
  if (parsed.detail?.upstreamError) parts.push(`Upstream: ${parsed.detail.upstreamError}`);
  if (parsed.detail?.errmsg) parts.push(`WeChat: [${parsed.detail.errcode ?? '?'}] ${parsed.detail.errmsg}`);
  return parts.join(' | ') || raw.slice(0, 300);
}

// ---------------------------------------------------------------------------
// File helper — read local file as base64 + derive filename
// ---------------------------------------------------------------------------

function readFileAsBase64(filePath: string): { base64: string; filename: string } {
  const abs = resolve(filePath);
  if (!existsSync(abs)) {
    throw new Error(`File not found: ${abs}`);
  }
  const buf = readFileSync(abs);
  return {
    base64: buf.toString('base64'),
    filename: abs.split('/').pop() || 'upload.bin',
  };
}

// ---------------------------------------------------------------------------
// Normalizers
// ---------------------------------------------------------------------------

function normalizeArticle(a: Record<string, unknown>): WeChatArticle {
  return {
    title: String(a.title ?? ''),
    content: String(a.content ?? ''),
    author: String(a.author ?? ''),
    thumbMediaId: String(a.thumbMediaId ?? ''),
    thumbUrl: String(a.thumbUrl ?? ''),
    digest: String(a.digest ?? ''),
    contentSourceUrl: String(a.contentSourceUrl ?? ''),
    url: String(a.url ?? ''),
    needOpenComment: Number(a.needOpenComment ?? 0),
    onlyFansCanComment: Number(a.onlyFansCanComment ?? 0),
    showCoverPic: Number(a.showCoverPic ?? 0),
  };
}

function normalizeDraft(d: Record<string, unknown>): WeChatDraft {
  // 聚合层 createPost / getPost 返回的对象，把 postId 当作 mediaId（WeChat 草稿 = mediaId）
  const mediaId = String(d.mediaId ?? d.postId ?? '');
  const articles = Array.isArray(d.articles)
    ? d.articles.map((a) => normalizeArticle(a as Record<string, unknown>))
    : [];
  return {
    mediaId,
    articles,
    updateTime: typeof d.updateTime === 'number' ? d.updateTime : undefined,
    resultLinks: buildResultLinks({
      upstream: d.resultLinks,
      articles,
      articleKind: 'preview_post',
      articleLabel: 'Draft preview',
      platformLabel: 'WeChat backend / draft box',
    }),
  };
}

function normalizeResultLinks(value: unknown): WeChatResultLink[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const links = value
    .map((entry) => {
      const item = entry as Record<string, unknown>;
      const label = typeof item.label === 'string' ? item.label : '';
      const kind = typeof item.kind === 'string' ? item.kind : '';
      const url = typeof item.url === 'string' ? item.url : '';
      return label && url ? { label, kind, url } : null;
    })
    .filter((entry): entry is WeChatResultLink => entry !== null);

  return links.length > 0 ? links : undefined;
}

function buildResultLinks(options: {
  upstream?: unknown;
  articles?: WeChatArticle[];
  articleKind?: string;
  articleLabel?: string;
  platformLabel: string;
}): WeChatResultLink[] | undefined {
  const upstreamLinks = normalizeResultLinks(options.upstream) ?? [];
  const articleUrls = Array.from(
    new Set(
      (options.articles ?? [])
        .map((article) => article.url)
        .filter((url): url is string => typeof url === 'string' && url.length > 0),
    ),
  );

  const articleLinks = articleUrls.map((url, index) => ({
    label:
      articleUrls.length === 1
        ? (options.articleLabel ?? 'Article link')
        : `${options.articleLabel ?? 'Article link'} ${index + 1}`,
    kind: options.articleKind ?? 'article',
    url,
  }));

  const combined = [
    ...upstreamLinks,
    ...articleLinks,
    {
      label: options.platformLabel,
      kind: 'dashboard',
      url: WECHAT_PLATFORM_URL,
    },
  ];

  const deduped = combined.filter(
    (link, index, arr) => arr.findIndex((candidate) => candidate.url === link.url) === index,
  );
  return deduped.length > 0 ? deduped : undefined;
}

// ---------------------------------------------------------------------------
// Public API — Connection
// ---------------------------------------------------------------------------

export async function validateConnection(config?: WeChatConfig): Promise<WeChatConnectionResult> {
  const r = await callPublishing<Record<string, unknown>>('validateConnection', {}, config);
  return {
    ok: Boolean(r.ok),
    message: String(r.message ?? ''),
    appid: String(r.appid ?? ''),
    tokenExpiresIn: Number(r.tokenExpiresIn ?? 0),
  };
}

// ---------------------------------------------------------------------------
// Public API — Backwards-compatible: getAccessToken / uploadImage / uploadThumb
//
// The `accessToken` arg is ignored (YouMind manages tokens server-side).
// 老的调用方（cli.ts / fetch-stats.ts）不用动签名。
// ---------------------------------------------------------------------------

const PROXY_TOKEN_PLACEHOLDER = 'youmind-managed-token';

export async function getAccessToken(
  _appid?: string,
  _secret?: string,
  _forceRefresh = false,
  config?: WeChatConfig,
): Promise<string> {
  // Validate via the proxy so the caller fails fast if creds aren't bound.
  await validateConnection(config);
  return PROXY_TOKEN_PLACEHOLDER;
}

export async function uploadImage(
  _accessToken: string,
  imagePath: string,
  config?: WeChatConfig,
): Promise<string> {
  const { base64, filename } = readFileAsBase64(imagePath);
  const r = await callPublishing<Record<string, unknown>>(
    'uploadMedia',
    {
      media: {
        kind: 'image',
        filename,
        source: { base64 },
      },
    },
    config,
  );
  const url = String(r.url ?? '');
  if (!url) {
    throw new Error('uploadImage returned empty URL');
  }
  return url;
}

export async function uploadThumb(
  _accessToken: string,
  imagePath: string,
  config?: WeChatConfig,
): Promise<string> {
  const { base64, filename } = readFileAsBase64(imagePath);
  const r = await callPublishing<Record<string, unknown>>(
    'uploadMedia',
    {
      media: {
        kind: 'thumb',
        filename,
        source: { base64 },
      },
    },
    config,
  );
  const mediaId = String(r.mediaId ?? '');
  if (!mediaId) {
    throw new Error('uploadThumb returned empty media_id');
  }
  return mediaId;
}

// ---------------------------------------------------------------------------
// Public API — Drafts (mapped onto createPost / getPost / deletePost / listPosts)
//
// WeChat 一稿可多图文，统一通过 post.extras.articles 整体下发。adapter 会优先读
// extras.articles，没有时才用 post 本体的 title/content。
// ---------------------------------------------------------------------------

export async function createDraftFull(
  articles: WeChatArticleInput[],
  config?: WeChatConfig,
): Promise<WeChatDraft> {
  if (!articles.length) {
    throw new Error('createDraftFull requires at least one article');
  }
  const first = articles[0];
  const r = await callPublishing<Record<string, unknown>>(
    'createPost',
    {
      post: {
        title: first.title,
        content: { format: 'html', body: first.content },
        excerpt: first.digest,
        mediaIds: first.thumbMediaId ? [first.thumbMediaId] : undefined,
        canonicalUrl: first.contentSourceUrl,
        extras: { articles, author: first.author },
      },
    },
    config,
  );
  return normalizeDraft(r);
}

export async function getDraft(
  mediaId: string,
  config?: WeChatConfig,
): Promise<WeChatDraft> {
  const r = await callPublishing<Record<string, unknown>>(
    'getPost',
    { postId: mediaId, state: 'draft' },
    config,
  );
  return normalizeDraft(r);
}

export async function deleteDraft(
  mediaId: string,
  config?: WeChatConfig,
): Promise<{ ok: boolean; id: string }> {
  const r = await callPublishing<Record<string, unknown>>(
    'deletePost',
    { postId: mediaId, state: 'draft' },
    config,
  );
  return { ok: Boolean(r.ok ?? true), id: String(r.id ?? mediaId) };
}

export async function listDrafts(
  offset = 0,
  count = 20,
  noContent = false,
  config?: WeChatConfig,
): Promise<WeChatDraftListResponse> {
  const r = await callPublishing<Record<string, unknown>>(
    'listPosts',
    {
      filter: {
        state: 'draft',
        paging: { offset, count, noContent },
      },
    },
    config,
  );
  return {
    items: Array.isArray(r.items)
      ? r.items.map((d) => normalizeDraft(d as Record<string, unknown>))
      : [],
    totalCount: Number(r.totalCount ?? 0),
    itemCount: Number(r.itemCount ?? 0),
  };
}

export async function countDrafts(
  config?: WeChatConfig,
): Promise<{ totalCount: number }> {
  const r = await callPublishing<Record<string, unknown>>(
    'listPosts',
    {
      filter: { state: 'draft', countOnly: true },
    },
    config,
  );
  return { totalCount: Number(r.totalCount ?? 0) };
}

// ---------------------------------------------------------------------------
// Public API — Publishing (mapped onto transitionPostState / getPublishJob /
//   getPost(state=published) / deletePost(state=published))
// ---------------------------------------------------------------------------

export async function publishDraft(
  mediaId: string,
  config?: WeChatConfig,
): Promise<WeChatPublishSubmit> {
  const r = await callPublishing<Record<string, unknown>>(
    'transitionPostState',
    { postId: mediaId, toState: 'published' },
    config,
  );
  return {
    publishId: String(r.publishId ?? ''),
    msgDataId: r.msgDataId as string | undefined,
    resultLinks: buildResultLinks({
      upstream: r.resultLinks,
      platformLabel: 'WeChat backend / publish management',
    }),
  };
}

export async function getPublishStatus(
  publishId: string,
  config?: WeChatConfig,
): Promise<WeChatPublishStatus> {
  const r = await callPublishing<Record<string, unknown>>(
    'getPublishJob',
    { jobId: publishId },
    config,
  );
  const articles = Array.isArray(r.articles)
    ? r.articles.map((a) => normalizeArticle(a as Record<string, unknown>))
    : undefined;
  return {
    publishId: String(r.publishId ?? publishId),
    publishStatus: Number(r.publishStatus ?? 0),
    articleId: r.articleId as string | undefined,
    articles,
    failIdx: Array.isArray(r.failIdx) ? (r.failIdx as number[]) : undefined,
    resultLinks: buildResultLinks({
      upstream: r.resultLinks,
      articles,
      articleKind: 'public_post',
      articleLabel: 'Published article',
      platformLabel: 'WeChat backend / publish management',
    }),
  };
}

export async function getPublished(
  articleId: string,
  config?: WeChatConfig,
): Promise<WeChatPublishedItem> {
  const r = await callPublishing<Record<string, unknown>>(
    'getPost',
    { postId: articleId, state: 'published' },
    config,
  );
  const articles = Array.isArray(r.articles)
    ? r.articles.map((a) => normalizeArticle(a as Record<string, unknown>))
    : [];
  return {
    articleId: String(r.articleId ?? articleId),
    articles,
    updateTime: typeof r.updateTime === 'number' ? r.updateTime : undefined,
    resultLinks: buildResultLinks({
      upstream: r.resultLinks,
      articles,
      articleKind: 'public_post',
      articleLabel: 'Published article',
      platformLabel: 'WeChat backend / published articles',
    }),
  };
}

export async function deletePublished(
  articleId: string,
  index?: number,
  config?: WeChatConfig,
): Promise<{ ok: boolean; id: string }> {
  const payload: Record<string, unknown> = {
    postId: articleId,
    state: 'published',
  };
  if (typeof index === 'number') payload.articleIndex = index;

  const r = await callPublishing<Record<string, unknown>>('deletePost', payload, config);
  return { ok: Boolean(r.ok ?? true), id: String(r.id ?? articleId) };
}

// ---------------------------------------------------------------------------
// Public API — Stats (mapped onto getInsights)
// ---------------------------------------------------------------------------

export async function getArticleStats(
  beginDate: string,
  endDate: string,
  config?: WeChatConfig,
): Promise<WeChatArticleStatsItem[]> {
  const r = await callPublishing<{ items?: WeChatArticleStatsItem[] }>(
    'getInsights',
    {
      scope: 'post',
      dateRange: { beginDate, endDate },
    },
    config,
  );
  return r.items ?? [];
}

export async function getArticleSummary(
  beginDate: string,
  endDate: string,
  config?: WeChatConfig,
): Promise<WeChatArticleStatsItem[]> {
  const r = await callPublishing<{ items?: WeChatArticleStatsItem[] }>(
    'getInsights',
    {
      scope: 'summary',
      dateRange: { beginDate, endDate },
    },
    config,
  );
  return r.items ?? [];
}
