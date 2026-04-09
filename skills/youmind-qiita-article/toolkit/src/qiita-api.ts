/**
 * qiita-api.ts — MOCK IMPLEMENTATION
 *
 * ⚠️ This file is a mock. The skill talks to Qiita exclusively through
 * YouMind's OpenAPI proxy, but YouMind has not yet shipped the Qiita
 * namespace on that OpenAPI. This mock lets the rest of the skill
 * (publisher, CLI) be built and smoke-tested end-to-end right now, without
 * a real backend.
 *
 * Swap-in plan when the real YouMind endpoints ship:
 *   1. YouMind will expose endpoints whose request/response shape mirrors
 *      Qiita's REST API v2 (same field names like `title`, `body`, `tags`,
 *      `private`, same /items endpoints). The only auth difference is that
 *      YouMind accepts `x-api-key: <youmind_api_key>` instead of a Qiita
 *      personal access token — YouMind holds the user's Qiita token
 *      server-side and attaches it.
 *   2. Replace each mock function body below with a `fetch()` POST/GET/PATCH
 *      to the corresponding `https://youmind.com/openapi/v1/qiita/<op>`
 *      using the `x-api-key` header (same helper pattern as youmind-api.ts).
 *   3. Keep the exported type signatures stable — they ARE the swap-in
 *      contract. Nothing in publisher.ts / cli.ts should need to change.
 *   4. Delete the `mockState` and `initMockState` at that point.
 *
 * loadQiitaConfig is NOT mocked — it reads real config the same way as
 * youmind-api.ts, because users will set their YouMind API key through the
 * normal config flow even before the Qiita endpoints exist.
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

// ---------------------------------------------------------------------------
// Public types — stable contract (do NOT change signatures when swapping to
// real HTTP; only the function bodies below should change).
// ---------------------------------------------------------------------------

export interface QiitaConfig {
  apiKey: string;
  baseUrl: string;
}

export interface QiitaTag {
  name: string;
  versions: string[];
}

export interface QiitaItem {
  id: string;
  title: string;
  body: string;
  rendered_body: string;
  url: string;
  private: boolean;
  tags: QiitaTag[];
  likes_count: number;
  stocks_count: number;
  comments_count: number;
  page_views_count: number | null;
  created_at: string;
  updated_at: string;
  slide: boolean;
  user: {
    id: string;
    permanent_id: number;
    name: string;
    items_count: number;
    followers_count: number;
  };
  [key: string]: unknown;
}

export interface CreateItemOptions {
  title: string;
  body: string;
  tags: QiitaTag[];
  private?: boolean;
  tweet?: boolean;
  slide?: boolean;
  organization_url_name?: string | null;
}

export interface UpdateItemOptions extends Partial<CreateItemOptions> {}

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

export function loadQiitaConfig(): QiitaConfig {
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
  itemCounter: number;
  publishedItems: QiitaItem[];
}

function initMockState(): MockState {
  return {
    itemCounter: 0,
    publishedItems: [],
  };
}

const mockState: MockState = initMockState();

function mockItemUrl(itemId: string): string {
  return `https://qiita.com/mock_user/items/${itemId}`;
}

function buildMockItem(
  id: string,
  options: CreateItemOptions,
): QiitaItem {
  const now = new Date().toISOString();
  return {
    id,
    title: options.title,
    body: options.body,
    rendered_body: options.body,
    url: mockItemUrl(id),
    private: options.private ?? false,
    tags: options.tags,
    likes_count: 0,
    stocks_count: 0,
    comments_count: 0,
    page_views_count: null,
    created_at: now,
    updated_at: now,
    slide: options.slide ?? false,
    user: {
      id: 'mock_user',
      permanent_id: 1,
      name: 'Mock User',
      items_count: mockState.publishedItems.length,
      followers_count: 0,
    },
  };
}

// ---------------------------------------------------------------------------
// Exported mock functions
// ---------------------------------------------------------------------------

/**
 * Create a new Qiita article (item).
 */
export async function createItem(
  _config: QiitaConfig,
  options: CreateItemOptions,
): Promise<QiitaItem> {
  mockState.itemCounter += 1;
  const id = `mock_qiita_item_${Date.now()}_${mockState.itemCounter}`;
  const item = buildMockItem(id, options);
  mockState.publishedItems.unshift(item);
  return item;
}

/**
 * Update an existing Qiita article (item).
 */
export async function updateItem(
  _config: QiitaConfig,
  id: string,
  options: UpdateItemOptions,
): Promise<QiitaItem> {
  const existing = mockState.publishedItems.find((it) => it.id === id);
  const now = new Date().toISOString();
  if (existing) {
    if (options.title !== undefined) existing.title = options.title;
    if (options.body !== undefined) {
      existing.body = options.body;
      existing.rendered_body = options.body;
    }
    if (options.tags !== undefined) existing.tags = options.tags;
    if (options.private !== undefined) existing.private = options.private;
    if (options.slide !== undefined) existing.slide = options.slide;
    existing.updated_at = now;
    return existing;
  }
  // Not found — return a synthesized item so callers still get a stable shape.
  return buildMockItem(id, {
    title: options.title ?? 'Mock Qiita Item',
    body: options.body ?? '',
    tags: options.tags ?? [],
    private: options.private,
    slide: options.slide,
  });
}

/**
 * Get a single Qiita article by ID.
 */
export async function getItem(
  _config: QiitaConfig,
  id: string,
): Promise<QiitaItem> {
  const found = mockState.publishedItems.find((it) => it.id === id);
  if (found) return found;
  return buildMockItem(id, {
    title: 'Mock Qiita Item',
    body: '',
    tags: [],
  });
}

/**
 * List the authenticated user's articles.
 */
export async function listMyItems(
  _config: QiitaConfig,
  page = 1,
  perPage = 20,
): Promise<QiitaItem[]> {
  const start = (page - 1) * perPage;
  return mockState.publishedItems.slice(start, start + perPage);
}
