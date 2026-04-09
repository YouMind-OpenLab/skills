/**
 * devto-api.ts — MOCK IMPLEMENTATION
 *
 * ⚠️ This file is a mock. The skill talks to Dev.to exclusively through
 * YouMind's OpenAPI proxy, but YouMind has not yet shipped the Dev.to
 * namespace on that OpenAPI. This mock lets the rest of the skill
 * (publisher, CLI) be built and smoke-tested end-to-end right now, without
 * a real backend.
 *
 * Swap-in plan when the real YouMind endpoints ship:
 *   1. YouMind will expose endpoints whose request/response shape mirrors
 *      Dev.to's Forem API (same field names like `title`, `body_markdown`,
 *      `published`, `tags`, same /articles, /articles/{id}, /articles/me
 *      endpoints). The only auth difference is that YouMind accepts
 *      `x-api-key: <youmind_api_key>` instead of a Dev.to `api-key` header —
 *      YouMind holds the user's Dev.to token server-side and attaches it.
 *   2. Replace each mock function body below with a `fetch()` POST/GET/PUT
 *      to the corresponding `https://youmind.com/openapi/v1/devto/<op>`
 *      using the `x-api-key` header (same helper pattern as youmind-api.ts).
 *   3. Keep the exported type signatures stable — they ARE the swap-in
 *      contract. Nothing in publisher.ts / cli.ts should need to change.
 *   4. Delete the `mockState` and `initMockState` at that point.
 *
 * loadDevtoConfig is NOT mocked — it reads real config the same way as
 * youmind-api.ts, because users will set their YouMind API key through the
 * normal config flow even before the Dev.to endpoints exist.
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

// ---------------------------------------------------------------------------
// Public types — stable contract (do NOT change signatures when swapping to
// real HTTP; only the function bodies below should change).
// ---------------------------------------------------------------------------

export interface DevtoConfig {
  apiKey: string;
  baseUrl: string;
}

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

export function loadDevtoConfig(): DevtoConfig {
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
  articleCounter: number;
  publishedArticles: DevtoArticle[];
}

function initMockState(): MockState {
  return {
    articleCounter: 0,
    publishedArticles: [],
  };
}

const mockState: MockState = initMockState();

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function buildMockArticle(
  id: number,
  options: CreateArticleOptions,
): DevtoArticle {
  const slugBase = slugify(options.title) || `mock-article-${id}`;
  const slug = `${slugBase}-${id}`;
  const now = new Date().toISOString();
  const description = options.description?.slice(0, 170) ?? '';
  const tagList = (options.tags ?? []).slice(0, 4);

  return {
    id,
    title: options.title,
    description,
    slug,
    url: `https://dev.to/mock_user/${slug}`,
    canonical_url: options.canonical_url ?? null,
    cover_image: options.cover_image ?? null,
    published: options.published ?? false,
    published_at: options.published ? now : null,
    tag_list: tagList,
    tags: tagList.join(', '),
    body_markdown: options.body_markdown,
    body_html: `<p>${options.body_markdown.slice(0, 200)}</p>`,
    comments_count: 0,
    positive_reactions_count: 0,
    public_reactions_count: 0,
    page_views_count: 0,
    reading_time_minutes: Math.max(1, Math.round(options.body_markdown.split(/\s+/).length / 200)),
    user: {
      username: 'mock_user',
      name: 'Mock User',
    },
  };
}

// ---------------------------------------------------------------------------
// Exported mock functions
// ---------------------------------------------------------------------------

/**
 * Create a new Dev.to article.
 */
export async function createArticle(
  _config: DevtoConfig,
  options: CreateArticleOptions,
): Promise<DevtoArticle> {
  mockState.articleCounter += 1;
  const id = parseInt(`${Date.now()}${mockState.articleCounter}`.slice(-10), 10);
  const article = buildMockArticle(id, options);
  mockState.publishedArticles.unshift(article);
  return article;
}

/**
 * Update an existing Dev.to article.
 */
export async function updateArticle(
  _config: DevtoConfig,
  id: number,
  options: UpdateArticleOptions,
): Promise<DevtoArticle> {
  const existing = mockState.publishedArticles.find((a) => a.id === id);
  if (existing) {
    if (options.title !== undefined) existing.title = options.title;
    if (options.body_markdown !== undefined) existing.body_markdown = options.body_markdown;
    if (options.published !== undefined) {
      existing.published = options.published;
      existing.published_at = options.published ? new Date().toISOString() : null;
    }
    if (options.tags?.length) {
      const tagList = options.tags.slice(0, 4);
      existing.tag_list = tagList;
      existing.tags = tagList.join(', ');
    }
    if (options.description !== undefined) {
      existing.description = options.description?.slice(0, 170) ?? '';
    }
    if (options.canonical_url !== undefined) existing.canonical_url = options.canonical_url ?? null;
    if (options.cover_image !== undefined) existing.cover_image = options.cover_image ?? null;
    return existing;
  }

  // Fabricate a plausible article if we've never seen this id.
  return buildMockArticle(id, {
    title: options.title ?? `Mock Article ${id}`,
    body_markdown: options.body_markdown ?? '',
    published: options.published,
    tags: options.tags,
    description: options.description,
    canonical_url: options.canonical_url,
    cover_image: options.cover_image,
    series: options.series,
  });
}

/**
 * Get a single Dev.to article by ID.
 */
export async function getArticle(
  _config: DevtoConfig,
  id: number,
): Promise<DevtoArticle> {
  const found = mockState.publishedArticles.find((a) => a.id === id);
  if (found) return found;
  return buildMockArticle(id, {
    title: `Mock Article ${id}`,
    body_markdown: '# Mock content\n\nThis is a mock Dev.to article.',
    published: true,
  });
}

/**
 * List the authenticated user's articles.
 */
export async function listMyArticles(
  _config: DevtoConfig,
  page = 1,
  perPage = 30,
): Promise<DevtoArticle[]> {
  const start = (page - 1) * perPage;
  return mockState.publishedArticles.slice(start, start + perPage);
}
