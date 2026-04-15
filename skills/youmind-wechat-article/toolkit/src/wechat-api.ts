/**
 * WeChat API client via YouMind OpenAPI.
 *
 * The skill only requires a YouMind API key locally. The user's WeChat
 * Official Account appid + secret are configured once inside YouMind
 * (Connector → WeChat), and the YouMind backend manages access_token
 * caching and proxies all cgi-bin calls.
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

// ---------------------------------------------------------------------------
// Public types
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
}

export interface WeChatPublishedListResponse {
  items: WeChatPublishedItem[];
  totalCount: number;
  itemCount: number;
}

export interface WeChatPublishSubmit {
  publishId: string;
  msgDataId?: string;
}

export interface WeChatPublishStatus {
  publishId: string;
  publishStatus: number;
  articleId?: string;
  articles?: WeChatArticle[];
  failIdx?: number[];
}

// ---------------------------------------------------------------------------
// Config loading — local config.yaml + ~/.youmind-skill/credentials.yaml
// ---------------------------------------------------------------------------

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

function loadCentralCredentials(): Record<string, unknown> {
  const home = process.env.HOME || process.env.USERPROFILE || '';
  const p = join(home, '.youmind-skill', 'credentials.yaml');
  if (existsSync(p)) {
    return (parseYaml(readFileSync(p, 'utf-8')) ?? {}) as Record<string, unknown>;
  }
  return {};
}

function loadLocalConfig(): Record<string, unknown> {
  const p = resolve(PROJECT_DIR, 'config.yaml');
  if (existsSync(p)) {
    return (parseYaml(readFileSync(p, 'utf-8')) ?? {}) as Record<string, unknown>;
  }
  return {};
}

export function loadWeChatConfig(): WeChatConfig {
  const central = loadCentralCredentials();
  const local = loadLocalConfig();
  const ym: Record<string, unknown> = {
    ...((central.youmind as Record<string, unknown>) ?? {}),
    ...((local.youmind as Record<string, unknown>) ?? {}),
  };
  for (const [k, v] of Object.entries(ym)) {
    if (v === '' && (central.youmind as Record<string, unknown>)?.[k]) {
      ym[k] = (central.youmind as Record<string, unknown>)[k];
    }
  }
  const configuredBaseUrl = normalizeBaseUrl(ym.base_url as string | undefined);
  return {
    apiKey: (ym.api_key as string) || '',
    baseUrl: configuredBaseUrl || DEFAULT_YOUMIND_OPENAPI_BASE_URL,
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
    throw new Error('YouMind API key not configured. Set youmind.api_key in config.yaml.');
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
// Public API — Connection
// ---------------------------------------------------------------------------

export async function validateConnection(config?: WeChatConfig): Promise<WeChatConnectionResult> {
  const r = await postJson<Record<string, unknown>>(
    '/wechat/validateConnection',
    {},
    config,
  );
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
// The `accessToken` arg is ignored in the new world (YouMind manages tokens
// server-side). Existing callers (cli.ts, fetch-stats.ts) keep working
// without changes; new callers should pass an empty string.
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
  const r = await postJson<{ url?: string }>(
    '/wechat/uploadImage',
    { filename, contentBase64: base64 },
    config,
  );
  if (!r.url) {
    throw new Error('uploadImage returned empty URL');
  }
  return r.url;
}

export async function uploadThumb(
  _accessToken: string,
  imagePath: string,
  config?: WeChatConfig,
): Promise<string> {
  const { base64, filename } = readFileAsBase64(imagePath);
  const r = await postJson<{ mediaId?: string }>(
    '/wechat/uploadThumb',
    { filename, contentBase64: base64 },
    config,
  );
  if (!r.mediaId) {
    throw new Error('uploadThumb returned empty media_id');
  }
  return r.mediaId;
}

// ---------------------------------------------------------------------------
// Public API — Drafts
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
  return {
    mediaId: String(d.mediaId ?? ''),
    articles: Array.isArray(d.articles)
      ? d.articles.map((a) => normalizeArticle(a as Record<string, unknown>))
      : [],
    updateTime: typeof d.updateTime === 'number' ? d.updateTime : undefined,
  };
}

export async function createDraftFull(
  articles: WeChatArticleInput[],
  config?: WeChatConfig,
): Promise<WeChatDraft> {
  const r = await postJson<Record<string, unknown>>('/wechat/createDraft', { articles }, config);
  return normalizeDraft(r);
}

export async function getDraft(
  mediaId: string,
  config?: WeChatConfig,
): Promise<WeChatDraft> {
  const r = await postJson<Record<string, unknown>>('/wechat/getDraft', { mediaId }, config);
  return normalizeDraft(r);
}

export async function deleteDraft(
  mediaId: string,
  config?: WeChatConfig,
): Promise<{ ok: boolean; id: string }> {
  const r = await postJson<{ ok?: boolean; id?: string }>(
    '/wechat/deleteDraft',
    { mediaId },
    config,
  );
  return { ok: Boolean(r.ok), id: String(r.id ?? mediaId) };
}

export async function listDrafts(
  offset = 0,
  count = 20,
  noContent = false,
  config?: WeChatConfig,
): Promise<WeChatDraftListResponse> {
  const r = await postJson<Record<string, unknown>>(
    '/wechat/listDrafts',
    { offset, count, noContent },
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
  const r = await postJson<{ totalCount?: number }>('/wechat/countDrafts', {}, config);
  return { totalCount: Number(r.totalCount ?? 0) };
}

// ---------------------------------------------------------------------------
// Public API — Publishing
// ---------------------------------------------------------------------------

export async function publishDraft(
  mediaId: string,
  config?: WeChatConfig,
): Promise<WeChatPublishSubmit> {
  const r = await postJson<{ publishId?: string; msgDataId?: string }>(
    '/wechat/publishDraft',
    { mediaId },
    config,
  );
  return {
    publishId: String(r.publishId ?? ''),
    msgDataId: r.msgDataId,
  };
}

export async function getPublishStatus(
  publishId: string,
  config?: WeChatConfig,
): Promise<WeChatPublishStatus> {
  const r = await postJson<Record<string, unknown>>(
    '/wechat/getPublishStatus',
    { publishId },
    config,
  );
  return {
    publishId: String(r.publishId ?? publishId),
    publishStatus: Number(r.publishStatus ?? 0),
    articleId: r.articleId as string | undefined,
    articles: Array.isArray(r.articles)
      ? r.articles.map((a) => normalizeArticle(a as Record<string, unknown>))
      : undefined,
    failIdx: Array.isArray(r.failIdx) ? (r.failIdx as number[]) : undefined,
  };
}

export async function listPublished(
  offset = 0,
  count = 20,
  noContent = false,
  config?: WeChatConfig,
): Promise<WeChatPublishedListResponse> {
  const r = await postJson<Record<string, unknown>>(
    '/wechat/listPublished',
    { offset, count, noContent },
    config,
  );
  return {
    items: Array.isArray(r.items)
      ? r.items.map((it) => {
          const obj = it as Record<string, unknown>;
          return {
            articleId: String(obj.articleId ?? ''),
            articles: Array.isArray(obj.articles)
              ? obj.articles.map((a) => normalizeArticle(a as Record<string, unknown>))
              : [],
            updateTime: typeof obj.updateTime === 'number' ? obj.updateTime : undefined,
          };
        })
      : [],
    totalCount: Number(r.totalCount ?? 0),
    itemCount: Number(r.itemCount ?? 0),
  };
}

export async function getPublished(
  articleId: string,
  config?: WeChatConfig,
): Promise<WeChatPublishedItem> {
  const r = await postJson<Record<string, unknown>>(
    '/wechat/getPublished',
    { articleId },
    config,
  );
  return {
    articleId: String(r.articleId ?? articleId),
    articles: Array.isArray(r.articles)
      ? r.articles.map((a) => normalizeArticle(a as Record<string, unknown>))
      : [],
    updateTime: typeof r.updateTime === 'number' ? r.updateTime : undefined,
  };
}

export async function deletePublished(
  articleId: string,
  index?: number,
  config?: WeChatConfig,
): Promise<{ ok: boolean; id: string }> {
  const r = await postJson<{ ok?: boolean; id?: string }>(
    '/wechat/deletePublished',
    index !== undefined ? { articleId, index } : { articleId },
    config,
  );
  return { ok: Boolean(r.ok), id: String(r.id ?? articleId) };
}

// ---------------------------------------------------------------------------
// Public API — Stats
// ---------------------------------------------------------------------------

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

export async function getArticleStats(
  beginDate: string,
  endDate: string,
  config?: WeChatConfig,
): Promise<WeChatArticleStatsItem[]> {
  const r = await postJson<{ items?: WeChatArticleStatsItem[] }>(
    '/wechat/getArticleStats',
    { beginDate, endDate },
    config,
  );
  return r.items ?? [];
}

export async function getArticleSummary(
  beginDate: string,
  endDate: string,
  config?: WeChatConfig,
): Promise<WeChatArticleStatsItem[]> {
  const r = await postJson<{ items?: WeChatArticleStatsItem[] }>(
    '/wechat/getArticleSummary',
    { beginDate, endDate },
    config,
  );
  return r.items ?? [];
}
