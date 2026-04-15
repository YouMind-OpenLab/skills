/**
 * X (Twitter) client via YouMind OpenAPI.
 *
 * The skill only requires a YouMind API key locally. The user's X account is
 * connected once inside YouMind (OAuth 2.0 PKCE), and the YouMind backend
 * attaches the X access token when proxying the tweet request.
 *
 * Backend contract (apps/youapi):
 *   POST /openapi/v1/createXPost
 *   headers:   x-api-key, x-use-camel-case: true
 *   request:   {
 *     text: string (1-280),
 *     mediaUrls?: string[] (≤4, cdn.gooo.ai only),
 *     replyToPostId?: string (numeric tweet ID; build threads by chaining)
 *   }
 *   response:  { postId: string, text: string, url: string }
 *
 * Threads are published as a native X reply chain by passing each previous
 * tweet's postId as the next tweet's replyToPostId. Quote-tweets, delete,
 * and local media upload are not in the OpenAPI surface today.
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

export interface XConfig {
  apiKey: string;
  baseUrl: string;
}

export interface CreateXPostOptions {
  text: string;
  /** Optional image URLs — must be publicly reachable https URLs under cdn.gooo.ai. Max 4. */
  mediaUrls?: string[];
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

export function loadXConfig(): XConfig {
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
  config?: XConfig,
): Promise<T> {
  const cfg = config ?? loadXConfig();
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
  const body: Record<string, unknown> = { text: options.text };
  if (options.mediaUrls?.length) {
    body.mediaUrls = options.mediaUrls;
  }
  if (options.replyToPostId) {
    body.replyToPostId = options.replyToPostId;
  }
  const raw = await postJson<Record<string, unknown>>('/createXPost', body, config);
  return normalizePost(raw);
}
