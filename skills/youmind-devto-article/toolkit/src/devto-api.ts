/**
 * Dev.to REST API wrapper.
 *
 * Endpoints:
 *   POST   /api/articles       — create article
 *   PUT    /api/articles/{id}  — update article
 *   GET    /api/articles/{id}  — get article by id
 *   GET    /api/articles/me    — list authenticated user's articles
 *
 * API docs: https://developers.forem.com/api/v1
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

const DEVTO_API_BASE = 'https://dev.to/api';

interface DevtoConfig {
  apiKey: string;
}

interface FullConfig {
  devto: DevtoConfig;
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
  const devto = { ...(central.devto as Record<string, unknown> ?? {}), ...(local.devto as Record<string, unknown> ?? {}) };
  const youmind = { ...(central.youmind as Record<string, unknown> ?? {}), ...(local.youmind as Record<string, unknown> ?? {}) };
  return {
    devto: {
      apiKey: (devto.api_key as string) || '',
    },
    youmind: youmind as FullConfig['youmind'],
  };
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DevtoArticle {
  id: number;
  title: string;
  description: string;
  slug: string;
  url: string;
  canonical_url: string | null;
  cover_image: string | null;
  published: boolean;
  published_at: string | null;
  tag_list: string[];
  tags: string;
  body_markdown: string;
  body_html: string;
  comments_count: number;
  positive_reactions_count: number;
  public_reactions_count: number;
  page_views_count: number;
  reading_time_minutes: number;
  user: {
    username: string;
    name: string;
  };
  [key: string]: unknown;
}

export interface CreateArticleOptions {
  title: string;
  body_markdown: string;
  published?: boolean;
  tags?: string[];
  description?: string;
  canonical_url?: string;
  cover_image?: string;
  series?: string;
}

export interface UpdateArticleOptions extends Partial<CreateArticleOptions> {}

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

async function apiRequest<T = unknown>(
  method: 'GET' | 'POST' | 'PUT',
  path: string,
  apiKey: string,
  body?: Record<string, unknown>,
): Promise<T> {
  if (!apiKey) {
    throw new Error(
      'Dev.to API key not configured. Set devto.api_key in config.yaml or pass --api-key.',
    );
  }

  const url = `${DEVTO_API_BASE}${path}`;
  const headers: Record<string, string> = {
    'api-key': apiKey,
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
      `Dev.to API ${method} ${path} failed (${resp.status}): ${text.slice(0, 500)}`,
    );
  }

  return resp.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Create a new Dev.to article.
 */
export async function createArticle(
  apiKey: string,
  options: CreateArticleOptions,
): Promise<DevtoArticle> {
  const article: Record<string, unknown> = {
    title: options.title,
    body_markdown: options.body_markdown,
    published: options.published ?? false,
  };

  if (options.tags?.length) {
    article.tags = options.tags.slice(0, 4);
  }
  if (options.description) {
    article.description = options.description.slice(0, 170);
  }
  if (options.canonical_url) {
    article.canonical_url = options.canonical_url;
  }
  if (options.cover_image) {
    article.cover_image = options.cover_image;
  }
  if (options.series) {
    article.series = options.series;
  }

  return apiRequest<DevtoArticle>('POST', '/articles', apiKey, { article });
}

/**
 * Update an existing Dev.to article.
 */
export async function updateArticle(
  apiKey: string,
  id: number,
  options: UpdateArticleOptions,
): Promise<DevtoArticle> {
  const article: Record<string, unknown> = {};

  if (options.title !== undefined) article.title = options.title;
  if (options.body_markdown !== undefined) article.body_markdown = options.body_markdown;
  if (options.published !== undefined) article.published = options.published;
  if (options.tags?.length) article.tags = options.tags.slice(0, 4);
  if (options.description !== undefined) article.description = options.description?.slice(0, 170);
  if (options.canonical_url !== undefined) article.canonical_url = options.canonical_url;
  if (options.cover_image !== undefined) article.cover_image = options.cover_image;
  if (options.series !== undefined) article.series = options.series;

  return apiRequest<DevtoArticle>('PUT', `/articles/${id}`, apiKey, { article });
}

/**
 * Get a single Dev.to article by ID.
 */
export async function getArticle(
  apiKey: string,
  id: number,
): Promise<DevtoArticle> {
  return apiRequest<DevtoArticle>('GET', `/articles/${id}`, apiKey);
}

/**
 * List the authenticated user's articles.
 */
export async function listMyArticles(
  apiKey: string,
  page = 1,
  perPage = 30,
): Promise<DevtoArticle[]> {
  return apiRequest<DevtoArticle[]>(
    'GET',
    `/articles/me?page=${page}&per_page=${perPage}`,
    apiKey,
  );
}
