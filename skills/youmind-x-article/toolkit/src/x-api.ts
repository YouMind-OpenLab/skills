/**
 * x-api.ts — MOCK IMPLEMENTATION
 *
 * ⚠️ This file is a mock. The skill talks to X (Twitter) exclusively through
 * YouMind's OpenAPI proxy, but YouMind has not yet shipped the X namespace on
 * that OpenAPI. This mock lets the rest of the skill (publisher, CLI) be
 * built and smoke-tested end-to-end right now, without a real backend.
 *
 * Why a mock and not the real X API? The previous version of this file
 * supported BOTH OAuth 2.0 (Bearer token) and OAuth 1.0a (HMAC-SHA1 signed
 * requests with nonce/timestamp/percent-encoded base string), because X's
 * v2 endpoints want OAuth 2.0 user tokens but media upload still lives on
 * v1.1 which only accepts OAuth 1.0a. That dual-flow complexity is now GONE
 * from the skill: YouMind holds the user's X credentials server-side and
 * picks whichever auth mode each downstream endpoint requires. The skill
 * itself only ever talks to one URL, with one header, end of story.
 *
 * Swap-in plan when the real YouMind endpoints ship:
 *   1. YouMind will expose endpoints whose request/response shape mirrors
 *      X's v2 API (same field names like `text`, `reply.in_reply_to_tweet_id`,
 *      `media.media_ids`, `quote_tweet_id`; same /tweets, /tweets/{id},
 *      /users/me endpoints; v1.1-style media upload exposed at a v2-shaped
 *      proxy endpoint). The only auth difference is that YouMind accepts
 *      `x-api-key: <youmind_api_key>` instead of an X access token / OAuth
 *      1.0a Authorization header — YouMind holds the X credentials and
 *      attaches whichever flow each endpoint needs.
 *   2. Replace each mock function body below with a `fetch()` POST/GET/DELETE
 *      to the corresponding `https://youmind.com/openapi/v1/x/<op>` using the
 *      `x-api-key` header (same helper pattern as youmind-api.ts).
 *   3. Keep the exported type signatures stable — they ARE the swap-in
 *      contract. The thread-chain flow (each reply uses the previous post's
 *      id as `reply_to`) is also part of the contract; publisher.ts and the
 *      CLI rely on the Tweet/TweetResponse shape and the createThread loop
 *      semantics. Nothing in publisher.ts / cli.ts should need to change.
 *   4. Delete the `mockState`, `initMockState`, and the OAuth-1.0a helper
 *      block at that point (the helpers are already deleted in this mock —
 *      no nonce, no HMAC-SHA1, no percent-encode, no signature base string).
 *
 * loadXConfig is NOT mocked — it reads real config the same way as
 * youmind-api.ts, because users will set their YouMind API key through the
 * normal config flow even before the X endpoints exist.
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

// ---------------------------------------------------------------------------
// Public types — stable contract (do NOT change signatures when swapping to
// real HTTP; only the function bodies below should change).
// ---------------------------------------------------------------------------

export interface XConfig {
  apiKey: string;
  baseUrl: string;
}

export interface Tweet {
  id: string;
  text: string;
  edit_history_tweet_ids?: string[];
  /** Optional traceability: id of the tweet this one replies to (chain flow). */
  in_reply_to_tweet_id?: string;
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

// Auth-mode type kept for backwards compatibility with x-browser.ts and any
// downstream code that imports it. Now degenerate: there is exactly one
// effective mode — the YouMind proxy — but the type is preserved so the
// public surface stays stable.
export type AuthMode = 'oauth2' | 'oauth1' | 'browser' | 'youmind';

// ---------------------------------------------------------------------------
// Config loading — real implementation, mirrors youmind-api.ts pattern.
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_DIR = resolve(__dirname, '../..');

const YOUMIND_OPENAPI_BASE_URLS = [
  'https://youmind.com/openapi/v1',
];

function loadCentralCredentials(): Record<string, unknown> {
  const home = process.env.HOME || process.env.USERPROFILE || '';
  const p = resolve(home, '.youmind-skill', 'credentials.yaml');
  if (existsSync(p)) {
    return parseYaml(readFileSync(p, 'utf-8')) ?? {};
  }
  return {};
}

function loadLocalConfig(): Record<string, unknown> {
  for (const name of ['config.yaml', 'config.example.yaml']) {
    const p = resolve(PROJECT_DIR, name);
    if (existsSync(p)) {
      return parseYaml(readFileSync(p, 'utf-8')) ?? {};
    }
  }
  return {};
}

export function loadXConfig(): XConfig {
  const central = loadCentralCredentials();
  const local = loadLocalConfig();
  const ym = {
    ...(central.youmind as Record<string, unknown> ?? {}),
    ...(local.youmind as Record<string, unknown> ?? {}),
  };
  // Filter out local empty strings so central credentials aren't masked.
  for (const [k, v] of Object.entries(ym)) {
    if (v === '' && (central.youmind as Record<string, unknown>)?.[k]) {
      ym[k] = (central.youmind as Record<string, unknown>)[k];
    }
  }
  return {
    apiKey: (ym.api_key as string) || '',
    baseUrl: (ym.base_url as string) || YOUMIND_OPENAPI_BASE_URLS[0],
  };
}

// ---------------------------------------------------------------------------
// Mock state — module-scoped, lives for the lifetime of the process. Not
// exported; swap-in code should delete this whole block.
// ---------------------------------------------------------------------------

interface MockState {
  tweetCounter: number;
  mediaCounter: number;
  publishedTweets: Tweet[];
  mediaById: Map<string, MediaUploadResult>;
}

function initMockState(): MockState {
  return {
    tweetCounter: 0,
    mediaCounter: 0,
    publishedTweets: [],
    mediaById: new Map<string, MediaUploadResult>(),
  };
}

const mockState: MockState = initMockState();

// ---------------------------------------------------------------------------
// Exported mock functions — Tweets
// ---------------------------------------------------------------------------

/**
 * Create a single tweet. If `options.reply_to` is set, the tweet is recorded
 * as a reply to that tweet id (this is what makes the thread-chain flow
 * work end-to-end via mocks).
 */
export async function createTweet(
  config: XConfig,
  text: string,
  options?: CreateTweetOptions,
): Promise<TweetResponse> {
  void config;
  mockState.tweetCounter += 1;
  const id = `mock_x_tweet_${Date.now()}_${mockState.tweetCounter}`;
  const tweet: Tweet = {
    id,
    text,
    edit_history_tweet_ids: [id],
  };
  if (options?.reply_to) {
    tweet.in_reply_to_tweet_id = options.reply_to;
  }
  if (options?.media_ids?.length) {
    tweet.attachments = { media_keys: options.media_ids };
  }
  if (options?.quote_tweet_id) {
    tweet.quoted_tweet_id = options.quote_tweet_id;
  }
  mockState.publishedTweets.unshift(tweet);
  return { data: tweet };
}

/**
 * Create a thread (sequential tweets as a reply chain). Each tweet after the
 * first uses the previous tweet's id as its `reply_to`.
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

  // Post first tweet — no reply_to
  const first = await createTweet(config, tweets[0]);
  results.push(first);
  console.log(`Thread 1/${tweets.length}: ${first.data.id}`);

  // Post remaining as replies, each chained to the previous one
  let previousId = first.data.id;
  for (let i = 1; i < tweets.length; i++) {
    const reply = await createTweet(config, tweets[i], {
      reply_to: previousId,
    });
    results.push(reply);
    previousId = reply.data.id;
    console.log(`Thread ${i + 1}/${tweets.length}: ${reply.data.id}`);
  }

  return results;
}

/**
 * Delete a tweet by ID. Returns `{ deleted: true }` if the tweet was found
 * in the mock state, otherwise `{ deleted: false }`.
 */
export async function deleteTweet(
  _config: XConfig,
  tweetId: string,
): Promise<{ deleted: boolean }> {
  const idx = mockState.publishedTweets.findIndex((t) => t.id === tweetId);
  if (idx >= 0) {
    mockState.publishedTweets.splice(idx, 1);
    return { deleted: true };
  }
  return { deleted: false };
}

// ---------------------------------------------------------------------------
// Exported mock functions — Users
// ---------------------------------------------------------------------------

/**
 * Get the authenticated user's profile.
 */
export async function getMe(_config: XConfig): Promise<XUser> {
  return {
    id: 'mock_x_user',
    name: 'Mock User',
    username: 'mock_user',
  };
}

// ---------------------------------------------------------------------------
// Exported mock functions — Media
// ---------------------------------------------------------------------------

/**
 * Upload media (image / video) for use in tweets. Returns a fake
 * media_id_string that publisher.ts can attach to a subsequent createTweet
 * call. No real upload happens.
 */
export async function uploadMedia(
  _config: XConfig,
  _mediaData: Buffer | string,
  _mediaType: string = 'image/png',
): Promise<MediaUploadResult> {
  mockState.mediaCounter += 1;
  const idStr = `mock_x_media_${Date.now()}_${mockState.mediaCounter}`;
  const idNum = mockState.mediaCounter;
  const result: MediaUploadResult = {
    media_id: idNum,
    media_id_string: idStr,
    media_key: `${idNum}_${idStr}`,
    size: 0,
    expires_after_secs: 86_400,
  };
  mockState.mediaById.set(idStr, result);
  return result;
}

// ---------------------------------------------------------------------------
// Auth mode — degenerate. Always reports the YouMind-proxy mode now that the
// dual OAuth complexity is gone. The function is preserved so that any
// downstream caller (publisher.ts, x-browser.ts type imports, etc.) keeps
// compiling without modification.
// ---------------------------------------------------------------------------

export function getAuthMode(_config: XConfig): AuthMode {
  return 'youmind';
}
