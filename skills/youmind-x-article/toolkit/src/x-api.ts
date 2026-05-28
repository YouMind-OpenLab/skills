/**
 * X (Twitter) client via YouMind OpenAPI (aggregated publishing endpoints).
 *
 * 后端统一在 /openapi/v1/publishing/<op>，platform=x 通过 discriminated union 区分。
 * 所有响应统一为 { platform, data }，本层自动解嵌套返回 data。
 *
 * 端点契约（apps/youapi spec 016 v2）：
 *   POST /openapi/v1/publishing/createPost
 *   body: { platform: 'x', post: { content: { format, body }, mediaUrls?, mediaIds?, replyToPostId? } }
 *
 *   POST /openapi/v1/publishing/uploadMedia
 *   body: { platform: 'x', media: { kind: 'image', filename, source: { base64 }, contentType? } }
 *
 *   POST /openapi/v1/publishing/deletePost
 *   body: { platform: 'x', postId }
 */

import { loadYouMindConfig, YOUMIND_CONFIG_ERROR_HINT } from './config.js';

export interface XConfig {
  apiKey: string;
  baseUrl: string;
}

export interface CreateXPostOptions {
  text: string;
  /** Optional image URLs — must be publicly reachable https URLs under cdn.gooo.ai. Max 4. */
  mediaUrls?: string[];
  /** Optional pre-uploaded X media IDs returned by uploadXMedia. Max 4. */
  mediaIds?: string[];
  /**
   * Optional tweet ID this post replies to. Used to build threads — publish the first tweet,
   * then pass its `postId` here for each subsequent tweet so X renders the chain natively.
   */
  replyToPostId?: string;
}

export interface XPost {
  postId: string;
  text: string;
  url: string;
}

export interface DeleteXPostResult {
  ok: boolean;
  postId: string;
}

export interface UploadXMediaOptions {
  filename: string;
  contentBase64: string;
  contentType?: string;
}

export interface UploadedXMedia {
  mediaId: string;
}

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

export function loadXConfig(): XConfig {
  const { apiKey, baseUrl } = loadYouMindConfig();
  return {
    apiKey,
    baseUrl,
  };
}

async function postJson<T = unknown>(
  endpoint: string,
  body: Record<string, unknown> = {},
  config?: XConfig,
): Promise<T> {
  const cfg = config ?? loadXConfig();
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
      `YouMind X API ${endpoint} failed (${response.status})` +
        `: ${formatOpenApiError(parsed, text)}`,
    );
  }

  return response.json() as Promise<T>;
}

// 聚合层调用：包一层自动从 { platform, data } 解出 data，对外保持旧接口形状
async function callPublishing<T = unknown>(
  op: string,
  payload: Record<string, unknown>,
  config?: XConfig,
): Promise<T> {
  const wrapped = await postJson<{ platform: string; data: T }>(
    `/publishing/${op}`,
    payload,
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
    parts.push(`Connect X: ${parsed.detail.connectUrl}`);
  }

  if (parsed.detail?.upgradeUrl) {
    parts.push(`Upgrade plan: ${parsed.detail.upgradeUrl}`);
  }

  return parts.join(' | ') || rawText.slice(0, 300);
}

function normalizePost(raw: Record<string, unknown>): XPost {
  return {
    postId: String(raw.postId ?? raw.post_id ?? ''),
    text: String(raw.text ?? ''),
    url: String(raw.url ?? ''),
  };
}

/**
 * Publish a single tweet via the YouMind proxy.
 *
 * `options.mediaUrls` must be publicly reachable https URLs under cdn.gooo.ai
 * — the YouMind backend enforces this allowlist to avoid SSRF. Non-cdn URLs
 * will be rejected with `X_MEDIA_HOST_NOT_ALLOWED`.
 *
 * `options.replyToPostId` chains this tweet as a reply to an existing one.
 * That is how threads are built: publish the first tweet, then for each
 * subsequent tweet in the sequence pass the previous tweet's `postId` here.
 */
export async function createXPost(
  config: XConfig,
  options: CreateXPostOptions,
): Promise<XPost> {
  const post: Record<string, unknown> = {
    content: { format: 'plain', body: options.text },
  };
  if (options.mediaUrls?.length) post.mediaUrls = options.mediaUrls;
  if (options.mediaIds?.length) post.mediaIds = options.mediaIds;
  if (options.replyToPostId) post.replyToPostId = options.replyToPostId;
  const data = await callPublishing<Record<string, unknown>>(
    'createPost',
    { platform: 'x', post },
    config,
  );
  return normalizePost(data);
}

export async function uploadXMedia(
  config: XConfig,
  options: UploadXMediaOptions,
): Promise<UploadedXMedia> {
  const media: Record<string, unknown> = {
    kind: 'image',
    filename: options.filename,
    source: { base64: options.contentBase64 },
  };
  if (options.contentType) media.contentType = options.contentType;
  const data = await callPublishing<Record<string, unknown>>(
    'uploadMedia',
    { platform: 'x', media },
    config,
  );
  return { mediaId: String(data.mediaId ?? data.media_id ?? '') };
}

export async function deleteXPost(
  config: XConfig,
  postId: string,
): Promise<DeleteXPostResult> {
  const data = await callPublishing<Record<string, unknown>>(
    'deletePost',
    { platform: 'x', postId },
    config,
  );
  return {
    ok: Boolean(data.ok ?? true),
    postId: String(data.postId ?? data.post_id ?? postId),
  };
}
