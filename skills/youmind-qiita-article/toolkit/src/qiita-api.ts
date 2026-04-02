/**
 * Qiita REST API v2 wrapper.
 *
 * Endpoints:
 *   POST   /api/v2/items                    — create article
 *   PATCH  /api/v2/items/{id}               — update article
 *   GET    /api/v2/items/{id}               — get article by id
 *   GET    /api/v2/authenticated_user/items  — list authenticated user's articles
 *
 * API docs: https://qiita.com/api/v2/docs
 */

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

const QIITA_API_BASE = 'https://qiita.com/api/v2';

interface QiitaConfig {
  accessToken: string;
}

interface FullConfig {
  qiita: QiitaConfig;
  youmind?: { api_key?: string; base_url?: string };
}

function loadCentralCredentials(): Record<string, unknown> {
  const home = process.env.HOME || process.env.USERPROFILE || '';
  const p = resolve(home, '.youmind-skill', 'credentials.yaml');
  if (existsSync(p)) {
    return parseYaml(readFileSync(p, 'utf-8')) ?? {};
  }
  return {};
}

export function loadConfig(): FullConfig {
  const central = loadCentralCredentials();
  let local: Record<string, unknown> = {};
  for (const name of ['config.yaml', 'config.example.yaml']) {
    const p = resolve(PROJECT_DIR, name);
    if (existsSync(p)) {
      local = parseYaml(readFileSync(p, 'utf-8')) ?? {};
      break;
    }
  }
  const qiita = { ...(central.qiita as Record<string, unknown> ?? {}), ...(local.qiita as Record<string, unknown> ?? {}) };
  for (const [k, v] of Object.entries(qiita)) {
    if (v === '' && (central.qiita as Record<string, unknown>)?.[k]) {
      qiita[k] = (central.qiita as Record<string, unknown>)[k];
    }
  }
  const youmind = { ...(central.youmind as Record<string, unknown> ?? {}), ...(local.youmind as Record<string, unknown> ?? {}) };
  for (const [k, v] of Object.entries(youmind)) {
    if (v === '' && (central.youmind as Record<string, unknown>)?.[k]) {
      youmind[k] = (central.youmind as Record<string, unknown>)[k];
    }
  }
  return {
    qiita: {
      accessToken: (qiita.access_token as string) || '',
    },
    youmind: youmind as FullConfig['youmind'],
  };
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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
// HTTP helpers
// ---------------------------------------------------------------------------

async function apiRequest<T = unknown>(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  accessToken: string,
  body?: Record<string, unknown>,
): Promise<T> {
  if (!accessToken) {
    throw new Error(
      'Qiita access token not configured. Set qiita.access_token in config.yaml or pass --access-token.',
    );
  }

  const url = `${QIITA_API_BASE}${path}`;
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  const resp = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(30_000),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(
      `Qiita API ${method} ${path} failed (${resp.status}): ${text.slice(0, 500)}`,
    );
  }

  return resp.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Create a new Qiita article (item).
 */
export async function createItem(
  accessToken: string,
  options: CreateItemOptions,
): Promise<QiitaItem> {
  const item: Record<string, unknown> = {
    title: options.title,
    body: options.body,
    tags: options.tags,
    private: options.private ?? false,
  };

  if (options.tweet !== undefined) {
    item.tweet = options.tweet;
  }
  if (options.slide !== undefined) {
    item.slide = options.slide;
  }
  if (options.organization_url_name !== undefined) {
    item.organization_url_name = options.organization_url_name;
  }

  return apiRequest<QiitaItem>('POST', '/items', accessToken, item);
}

/**
 * Update an existing Qiita article (item).
 */
export async function updateItem(
  accessToken: string,
  id: string,
  options: UpdateItemOptions,
): Promise<QiitaItem> {
  const item: Record<string, unknown> = {};

  if (options.title !== undefined) item.title = options.title;
  if (options.body !== undefined) item.body = options.body;
  if (options.tags !== undefined) item.tags = options.tags;
  if (options.private !== undefined) item.private = options.private;
  if (options.slide !== undefined) item.slide = options.slide;
  if (options.organization_url_name !== undefined) item.organization_url_name = options.organization_url_name;

  return apiRequest<QiitaItem>('PATCH', `/items/${id}`, accessToken, item);
}

/**
 * Get a single Qiita article by ID.
 */
export async function getItem(
  accessToken: string,
  id: string,
): Promise<QiitaItem> {
  return apiRequest<QiitaItem>('GET', `/items/${id}`, accessToken);
}

/**
 * List the authenticated user's articles.
 */
export async function listMyItems(
  accessToken: string,
  page = 1,
  perPage = 20,
): Promise<QiitaItem[]> {
  return apiRequest<QiitaItem[]>(
    'GET',
    `/authenticated_user/items?page=${page}&per_page=${perPage}`,
    accessToken,
  );
}
