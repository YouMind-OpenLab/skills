/**
 * threads-api.ts — MOCK IMPLEMENTATION
 *
 * ⚠️ This file is a mock. The skill talks to Threads exclusively through
 * YouMind's OpenAPI proxy, but YouMind has not yet shipped the Threads
 * namespace on that OpenAPI. This mock lets the rest of the skill (publisher,
 * CLI, pipeline) be built and smoke-tested end-to-end right now, without a
 * real backend.
 *
 * Swap-in plan when the real YouMind endpoints ship:
 *   1. YouMind will expose endpoints whose request/response shape mirrors
 *      Meta's Threads API (same field names like `text`, `media_type`,
 *      `image_url`, `video_url`, `reply_to_id`, same container → publish
 *      two-step flow). The only auth difference is that YouMind accepts
 *      `x-api-key: <youmind_api_key>` instead of a Meta long-lived token —
 *      YouMind holds the user's Meta token server-side and attaches it.
 *   2. Replace each mock function body below with a `fetch()` POST to the
 *      corresponding `https://youmind.com/openapi/v1/<endpoint>` using the
 *      `x-api-key` header (same helper pattern as `youmind-api.ts`).
 *   3. Keep the exported type signatures stable — they ARE the swap-in
 *      contract. Nothing in publisher.ts / cli.ts should need to change.
 *   4. Delete the `mockState`, `initMockState`, and the env-var switches
 *      at that point.
 *
 * Mock behavior (current):
 *   - getBindingStatus     → bound=true unless THREADS_MOCK_UNBOUND=1
 *   - getPublishingLimits  → in-memory counters (decrement on each publish)
 *   - createContainer      → immediate fake container id
 *   - publishContainer     → fake post id + permalink, decrement quota, record post
 *   - listPosts            → posts accumulated in this process
 *
 * Env var switches for testing:
 *   - THREADS_MOCK_UNBOUND=1    → getBindingStatus returns bound=false
 *   - THREADS_MOCK_QUOTA_LOW=1  → start with posts_remaining=2
 *   - THREADS_MOCK_FAIL_AT=N    → createContainer throws on the Nth call (1-indexed)
 *
 * loadThreadsConfig is NOT mocked — it reads real config the same way as
 * youmind-api.ts, because users will set their YouMind API key through the
 * normal config flow even before the Threads endpoints exist.
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

// ---------------------------------------------------------------------------
// Public types — stable contract (do NOT change signatures when swapping to
// real HTTP; only the function bodies below should change).
// ---------------------------------------------------------------------------

export interface ThreadsConfig {
  apiKey: string;
  baseUrl: string;
}

export interface BindingStatus {
  bound: boolean;
  username?: string;
  expires_at?: string; // ISO 8601
}

export interface ThreadsPost {
  id: string;
  permalink: string;
  text?: string;
  created_time?: string;
}

export interface PublishingLimits {
  quota_posts_remaining: number;   // ≤ 250 ceiling
  quota_replies_remaining: number; // ≤ 1000 ceiling
  reset_at: string;                // ISO 8601
}

export interface CreateContainerInput {
  text: string;
  mediaType: 'TEXT' | 'IMAGE' | 'VIDEO';
  imageUrl?: string;
  videoUrl?: string;
  replyToId?: string;
}

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

export function loadThreadsConfig(): ThreadsConfig {
  const central = loadCentralCredentials();
  const local = loadLocalConfig();
  const ym = {
    ...(central.youmind as Record<string, unknown> ?? {}),
    ...(local.youmind as Record<string, unknown> ?? {}),
  };
  // 过滤本地的空字符串值，避免覆盖中心配置
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
  postsRemaining: number;
  repliesRemaining: number;
  resetAt: string;
  containerCounter: number;
  postCounter: number;
  publishedPosts: ThreadsPost[];
  createContainerCallCount: number;
  containerTextById: Map<string, string>;
}

function initMockState(): MockState {
  const quotaLow = process.env.THREADS_MOCK_QUOTA_LOW === '1';
  return {
    postsRemaining: quotaLow ? 2 : 250,
    repliesRemaining: 1000,
    resetAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    containerCounter: 0,
    postCounter: 0,
    publishedPosts: [],
    createContainerCallCount: 0,
    containerTextById: new Map<string, string>(),
  };
}

const mockState: MockState = initMockState();

// ---------------------------------------------------------------------------
// Exported mock functions
// ---------------------------------------------------------------------------

export async function getBindingStatus(_cfg: ThreadsConfig): Promise<BindingStatus> {
  if (process.env.THREADS_MOCK_UNBOUND === '1') {
    return { bound: false };
  }
  const expires = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();
  return {
    bound: true,
    username: 'mock_user',
    expires_at: expires,
  };
}

export async function getPublishingLimits(_cfg: ThreadsConfig): Promise<PublishingLimits> {
  return {
    quota_posts_remaining: mockState.postsRemaining,
    quota_replies_remaining: mockState.repliesRemaining,
    reset_at: mockState.resetAt,
  };
}

export async function createContainer(
  _cfg: ThreadsConfig,
  input: CreateContainerInput,
): Promise<{ container_id: string }> {
  mockState.createContainerCallCount += 1;

  const failAtRaw = process.env.THREADS_MOCK_FAIL_AT;
  if (failAtRaw) {
    const failAt = parseInt(failAtRaw, 10);
    if (!Number.isNaN(failAt) && failAt === mockState.createContainerCallCount) {
      throw new Error(
        `MOCK: createContainer simulated failure at call #${mockState.createContainerCallCount} (THREADS_MOCK_FAIL_AT=${failAtRaw})`,
      );
    }
  }

  mockState.containerCounter += 1;
  const containerId = `mock_container_${mockState.containerCounter}`;
  const truncated = input.text.slice(0, 80);
  mockState.containerTextById.set(containerId, truncated);
  return { container_id: containerId };
}

export async function publishContainer(
  _cfg: ThreadsConfig,
  containerId: string,
): Promise<{ id: string; permalink: string }> {
  mockState.postCounter += 1;
  const id = `mock_post_${Date.now()}_${mockState.postCounter}`;
  const permalink = `https://threads.net/@mock_user/post/${id}`;
  mockState.postsRemaining = Math.max(0, mockState.postsRemaining - 1);

  const text = mockState.containerTextById.get(containerId);
  const post: ThreadsPost = {
    id,
    permalink,
    text,
    created_time: new Date().toISOString(),
  };
  mockState.publishedPosts.unshift(post);

  return { id, permalink };
}

export async function listPosts(
  _cfg: ThreadsConfig,
  limit: number,
): Promise<{ data: ThreadsPost[] }> {
  return { data: mockState.publishedPosts.slice(0, limit) };
}
