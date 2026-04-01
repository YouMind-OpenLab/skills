/**
 * X (Twitter) API v2 wrapper.
 *
 * Supports both OAuth 2.0 (Bearer token) and OAuth 1.0a (HMAC-SHA1 signature).
 * Tweet creation, threads, deletion, media upload, and user info.
 *
 * Usage:
 *   import { createTweet, createThread, deleteTweet, getMe } from './x-api.js';
 */

import { createHmac, randomBytes } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_DIR = resolve(__dirname, '../..');

const X_API_BASE = 'https://api.x.com/2';
const X_UPLOAD_BASE = 'https://upload.twitter.com/1.1';

export interface XConfig {
  /** OAuth 2.0 user access token (preferred for posting) */
  accessToken: string;
  /** App-only bearer token (read-only) */
  bearerToken: string;
  /** OAuth 1.0a credentials (legacy) */
  oauth1?: {
    apiKey: string;
    apiSecret: string;
    accessToken: string;
    accessTokenSecret: string;
  };
}

function loadCentralCredentials(): Record<string, unknown> {
  const home = process.env.HOME || process.env.USERPROFILE || '';
  const p = resolve(home, '.youmind-skill', 'credentials.yaml');
  if (existsSync(p)) {
    return parseYaml(readFileSync(p, 'utf-8')) ?? {};
  }
  return {};
}

export function loadXConfig(): XConfig {
  const central = loadCentralCredentials();
  let local: Record<string, unknown> = {};
  for (const name of ['config.yaml', 'config.example.yaml']) {
    const p = resolve(PROJECT_DIR, name);
    if (existsSync(p)) {
      local = parseYaml(readFileSync(p, 'utf-8')) ?? {};
      break;
    }
  }
  const x = { ...(central.x as Record<string, unknown> ?? {}), ...(local.x as Record<string, unknown> ?? {}) };
  for (const [k, v] of Object.entries(x)) {
    if (v === '' && (central.x as Record<string, unknown>)?.[k]) {
      x[k] = (central.x as Record<string, unknown>)[k];
    }
  }

  const oauth1 =
    x.api_key && x.api_secret && x.access_token_legacy && x.access_token_secret
      ? {
          apiKey: x.api_key as string,
          apiSecret: x.api_secret as string,
          accessToken: x.access_token_legacy as string,
          accessTokenSecret: x.access_token_secret as string,
        }
      : undefined;

  return {
    accessToken: (x.access_token as string) || '',
    bearerToken: (x.bearer_token as string) || '',
    oauth1,
  };
}

// ---------------------------------------------------------------------------
// OAuth 1.0a Signature (HMAC-SHA1)
// ---------------------------------------------------------------------------

function percentEncode(str: string): string {
  return encodeURIComponent(str).replace(/[!'()*]/g, (c) =>
    `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

function generateNonce(): string {
  return randomBytes(16).toString('hex');
}

function generateTimestamp(): string {
  return Math.floor(Date.now() / 1000).toString();
}

/**
 * Generate OAuth 1.0a Authorization header value.
 */
function oauth1Header(
  method: string,
  url: string,
  params: Record<string, string>,
  oauth1: NonNullable<XConfig['oauth1']>,
): string {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: oauth1.apiKey,
    oauth_nonce: generateNonce(),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: generateTimestamp(),
    oauth_token: oauth1.accessToken,
    oauth_version: '1.0',
  };

  // Combine all params for signature base string
  const allParams: Record<string, string> = { ...params, ...oauthParams };
  const sortedKeys = Object.keys(allParams).sort();
  const paramString = sortedKeys
    .map((k) => `${percentEncode(k)}=${percentEncode(allParams[k])}`)
    .join('&');

  // Signature base string
  const baseString = [
    method.toUpperCase(),
    percentEncode(url),
    percentEncode(paramString),
  ].join('&');

  // Signing key
  const signingKey = `${percentEncode(oauth1.apiSecret)}&${percentEncode(oauth1.accessTokenSecret)}`;

  // HMAC-SHA1 signature
  const signature = createHmac('sha1', signingKey)
    .update(baseString)
    .digest('base64');

  oauthParams['oauth_signature'] = signature;

  // Build Authorization header
  const headerParts = Object.keys(oauthParams)
    .sort()
    .map((k) => `${percentEncode(k)}="${percentEncode(oauthParams[k])}"`)
    .join(', ');

  return `OAuth ${headerParts}`;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Tweet {
  id: string;
  text: string;
  edit_history_tweet_ids?: string[];
  [key: string]: unknown;
}

export interface TweetResponse {
  data: Tweet;
  [key: string]: unknown;
}

export interface CreateTweetOptions {
  reply_to?: string;
  media_ids?: string[];
  quote_tweet_id?: string;
}

export interface XUser {
  id: string;
  name: string;
  username: string;
  [key: string]: unknown;
}

export interface MediaUploadResult {
  media_id: number;
  media_id_string: string;
  size?: number;
  expires_after_secs?: number;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

type AuthMethod = 'oauth2' | 'oauth1' | 'bearer';

function getAuthHeader(
  config: XConfig,
  method: string,
  url: string,
  params: Record<string, string> = {},
  preferredAuth?: AuthMethod,
): string {
  // Determine which auth to use
  if (preferredAuth === 'oauth1' && config.oauth1) {
    return oauth1Header(method, url, params, config.oauth1);
  }

  if (preferredAuth === 'bearer' && config.bearerToken) {
    return `Bearer ${config.bearerToken}`;
  }

  // Default: prefer OAuth 2.0 user token for write operations
  if (config.accessToken) {
    return `Bearer ${config.accessToken}`;
  }

  if (config.oauth1) {
    return oauth1Header(method, url, params, config.oauth1);
  }

  if (config.bearerToken) {
    return `Bearer ${config.bearerToken}`;
  }

  throw new Error(
    'No X API credentials configured. Set x.access_token (OAuth 2.0) or OAuth 1.0a fields in config.yaml.',
  );
}

async function xFetch<T = unknown>(
  url: string,
  method: string,
  config: XConfig,
  body?: Record<string, unknown>,
  authMethod?: AuthMethod,
): Promise<T> {
  const headers: Record<string, string> = {
    Authorization: getAuthHeader(config, method, url, {}, authMethod),
  };

  const init: RequestInit = {
    method,
    headers,
    signal: AbortSignal.timeout(30_000),
  };

  if (body) {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }

  const resp = await fetch(url, init);

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`X API error (${resp.status}): ${text.slice(0, 500)}`);
  }

  const contentType = resp.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return resp.json() as Promise<T>;
  }

  return {} as T;
}

// ---------------------------------------------------------------------------
// Public API -- Create Tweet
// ---------------------------------------------------------------------------

/**
 * Create a single tweet.
 */
export async function createTweet(
  config: XConfig,
  text: string,
  options?: CreateTweetOptions,
): Promise<TweetResponse> {
  const body: Record<string, unknown> = { text };

  if (options?.reply_to) {
    body.reply = { in_reply_to_tweet_id: options.reply_to };
  }

  if (options?.media_ids?.length) {
    body.media = { media_ids: options.media_ids };
  }

  if (options?.quote_tweet_id) {
    body.quote_tweet_id = options.quote_tweet_id;
  }

  return xFetch<TweetResponse>(`${X_API_BASE}/tweets`, 'POST', config, body);
}

// ---------------------------------------------------------------------------
// Public API -- Create Thread
// ---------------------------------------------------------------------------

/**
 * Create a thread (sequential tweets as reply chain).
 * Each tweet replies to the previous one.
 *
 * @returns Array of tweet responses in order
 */
export async function createThread(
  config: XConfig,
  tweets: string[],
): Promise<TweetResponse[]> {
  if (tweets.length === 0) {
    throw new Error('Thread must contain at least one tweet.');
  }

  const results: TweetResponse[] = [];

  // Post first tweet
  const first = await createTweet(config, tweets[0]);
  results.push(first);
  console.log(`Thread 1/${tweets.length}: ${first.data.id}`);

  // Post remaining tweets as replies
  let previousId = first.data.id;
  for (let i = 1; i < tweets.length; i++) {
    // Small delay to avoid rate limiting
    await new Promise((r) => setTimeout(r, 1000));

    const reply = await createTweet(config, tweets[i], {
      reply_to: previousId,
    });
    results.push(reply);
    previousId = reply.data.id;
    console.log(`Thread ${i + 1}/${tweets.length}: ${reply.data.id}`);
  }

  return results;
}

// ---------------------------------------------------------------------------
// Public API -- Delete Tweet
// ---------------------------------------------------------------------------

/**
 * Delete a tweet by ID.
 */
export async function deleteTweet(
  config: XConfig,
  tweetId: string,
): Promise<{ deleted: boolean }> {
  const result = await xFetch<{ data: { deleted: boolean } }>(
    `${X_API_BASE}/tweets/${tweetId}`,
    'DELETE',
    config,
  );
  return { deleted: result.data?.deleted ?? false };
}

// ---------------------------------------------------------------------------
// Public API -- Get Me
// ---------------------------------------------------------------------------

/**
 * Get the authenticated user's profile.
 */
export async function getMe(config: XConfig): Promise<XUser> {
  const result = await xFetch<{ data: XUser }>(
    `${X_API_BASE}/users/me`,
    'GET',
    config,
  );
  return result.data;
}

// ---------------------------------------------------------------------------
// Public API -- Upload Media (v1.1 endpoint)
// ---------------------------------------------------------------------------

/**
 * Upload media to X for use in tweets.
 * Note: Media upload still uses v1.1 API and requires OAuth 1.0a.
 *
 * @param config X configuration (must have oauth1 credentials)
 * @param mediaData Image buffer or file path
 * @param mediaType MIME type (e.g., 'image/png', 'image/jpeg')
 */
export async function uploadMedia(
  config: XConfig,
  mediaData: Buffer | string,
  mediaType: string = 'image/png',
): Promise<MediaUploadResult> {
  let buffer: Buffer;

  if (typeof mediaData === 'string') {
    if (mediaData.startsWith('http://') || mediaData.startsWith('https://')) {
      const resp = await fetch(mediaData, { signal: AbortSignal.timeout(30_000) });
      if (!resp.ok) throw new Error(`Failed to download media: ${resp.status}`);
      buffer = Buffer.from(await resp.arrayBuffer());
    } else {
      const filePath = resolve(mediaData);
      if (!existsSync(filePath)) throw new Error(`Media file not found: ${filePath}`);
      buffer = readFileSync(filePath);
    }
  } else {
    buffer = mediaData;
  }

  const base64Data = buffer.toString('base64');
  const uploadUrl = `${X_UPLOAD_BASE}/media/upload.json`;

  // Media upload requires OAuth 1.0a or OAuth 2.0 with proper scopes
  const formParams: Record<string, string> = {
    media_data: base64Data,
    media_category: mediaType.startsWith('video/') ? 'tweet_video' : 'tweet_image',
  };

  // Build form body
  const formBody = Object.entries(formParams)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

  const authHeader = config.oauth1
    ? oauth1Header('POST', uploadUrl, formParams, config.oauth1)
    : `Bearer ${config.accessToken}`;

  const resp = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formBody,
    signal: AbortSignal.timeout(60_000),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`X media upload failed (${resp.status}): ${text.slice(0, 300)}`);
  }

  return resp.json() as Promise<MediaUploadResult>;
}

// ---------------------------------------------------------------------------
// CLI (when run directly)
// ---------------------------------------------------------------------------

async function cli() {
  const args = process.argv.slice(2);
  const command = args[0];
  const config = loadXConfig();

  if (!command || command === '--help') {
    console.log(`X API CLI

Commands:
  tweet --text "..."
  thread --texts "tweet1" "tweet2" "tweet3"
  delete --id <tweet_id>
  me
  upload --file <path>`);
    return;
  }

  const getArg = (flag: string): string | undefined => {
    const i = args.indexOf(flag);
    return i >= 0 && i + 1 < args.length ? args[i + 1] : undefined;
  };

  switch (command) {
    case 'tweet': {
      const text = getArg('--text');
      if (!text) { console.error('--text required'); process.exit(1); }
      const replyTo = getArg('--reply-to');
      const quoteTweetId = getArg('--quote');
      const result = await createTweet(config, text, {
        reply_to: replyTo,
        quote_tweet_id: quoteTweetId,
      });
      console.log(JSON.stringify(result, null, 2));
      break;
    }

    case 'thread': {
      const textsIdx = args.indexOf('--texts');
      if (textsIdx < 0) { console.error('--texts required'); process.exit(1); }
      const tweets = args.slice(textsIdx + 1);
      if (tweets.length === 0) { console.error('At least one tweet text required'); process.exit(1); }
      const results = await createThread(config, tweets);
      console.log(JSON.stringify(results, null, 2));
      break;
    }

    case 'delete': {
      const id = getArg('--id');
      if (!id) { console.error('--id required'); process.exit(1); }
      const result = await deleteTweet(config, id);
      console.log(JSON.stringify(result, null, 2));
      break;
    }

    case 'me': {
      const user = await getMe(config);
      console.log(JSON.stringify(user, null, 2));
      break;
    }

    case 'upload': {
      const file = getArg('--file');
      if (!file) { console.error('--file required'); process.exit(1); }
      const result = await uploadMedia(config, file);
      console.log(JSON.stringify(result, null, 2));
      break;
    }

    default:
      console.error(`Unknown command: ${command}`);
      process.exit(1);
  }
}

const isMain =
  process.argv[1]?.endsWith('x-api.ts') ||
  process.argv[1]?.endsWith('x-api.js');
if (isMain) {
  cli().catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}
