/**
 * Dev.to API client via YouMind OpenAPI.
 *
 * The skill only requires a YouMind API key locally. The user's Dev.to token
 * is configured once inside YouMind, and the YouMind backend attaches it when
 * proxying Dev.to requests.
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

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
  bodyMarkdown: string;
  published?: boolean;
  tags?: string[];
  description?: string;
  canonicalUrl?: string;
  coverImage?: string;
  series?: string;
}

export interface UpdateArticleOptions extends Partial<CreateArticleOptions> {}

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

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_DIR = resolve(__dirname, '../..');

const YOUMIND_OPENAPI_BASE_URLS = ['https://youmind.com/openapi/v1'];

function loadCentralCredentials(): Record<string, unknown> {
  const home = process.env.HOME || process.env.USERPROFILE || '';
  const path = resolve(home, '.youmind-skill', 'credentials.yaml');
  if (existsSync(path)) {
    return parseYaml(readFileSync(path, 'utf-8')) ?? {};
  }
  return {};
}

function loadLocalConfig(): Record<string, unknown> {
  for (const name of ['config.yaml', 'config.example.yaml']) {
    const path = resolve(PROJECT_DIR, name);
    if (existsSync(path)) {
      return parseYaml(readFileSync(path, 'utf-8')) ?? {};
    }
  }
  return {};
}

function normalizeBaseUrl(value: string | undefined): string {
  if (!value) return '';
  const trimmed = value.replace(/\/+$/, '');
  if (trimmed.endsWith('/openapi/v1')) return trimmed;
  if (trimmed.endsWith('/openapi')) return `${trimmed}/v1`;
  return `${trimmed}/openapi/v1`;
}

export function loadDevtoConfig(): DevtoConfig {
  const central = loadCentralCredentials();
  const local = loadLocalConfig();
  const ym = {
    ...(central.youmind as Record<string, unknown> ?? {}),
    ...(local.youmind as Record<string, unknown> ?? {}),
  };

  for (const [key, value] of Object.entries(ym)) {
    if (value === '' && (central.youmind as Record<string, unknown>)?.[key]) {
      ym[key] = (central.youmind as Record<string, unknown>)[key];
    }
  }

  const envApiKey =
    process.env.YOUMIND_API_KEY ||
    process.env.YM_API_KEY ||
    '';
  const envBaseUrl = normalizeBaseUrl(
    process.env.YOUMIND_OPENAPI_BASE_URL || process.env.YOUMIND_BASE_URL,
  );
  const configuredBaseUrl = normalizeBaseUrl(ym.base_url as string | undefined);

  return {
    apiKey: (ym.api_key as string) || envApiKey || '',
    baseUrl: configuredBaseUrl || envBaseUrl || YOUMIND_OPENAPI_BASE_URLS[0],
  };
}

async function post<T = unknown>(
  endpoint: string,
  body: Record<string, unknown> = {},
  config?: DevtoConfig,
): Promise<T> {
  const cfg = config ?? loadDevtoConfig();
  if (!cfg.apiKey) {
    throw new Error('YouMind API key not configured. Set youmind.api_key in config.yaml or YOUMIND_API_KEY.');
  }

  const shouldFallbackToHosted =
    !/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(?:\/|$)/i.test(cfg.baseUrl);
  const baseUrls = shouldFallbackToHosted
    ? [cfg.baseUrl, ...YOUMIND_OPENAPI_BASE_URLS.filter((url) => url !== cfg.baseUrl)]
    : [cfg.baseUrl];
  let lastError: Error | null = null;

  for (const baseUrl of baseUrls) {
    try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': cfg.apiKey,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(30_000),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        const parsed = parseOpenApiError(text);
        const error = new Error(
          `YouMind Dev.to API ${endpoint} failed via ${baseUrl} (${response.status})` +
            `: ${formatOpenApiError(parsed, text)}`,
        );

        // Surface client-side API errors directly. Falling through to another
        // base URL hides the real problem, which is especially confusing when
        // local development points at localhost and the hosted API lags behind.
        if (response.status < 500) {
          throw error;
        }

        lastError = error;
        continue;
      }

      return response.json() as Promise<T>;
    } catch (error) {
      lastError = error as Error;
    }
  }

  throw lastError ?? new Error(`YouMind Dev.to API ${endpoint} failed`);
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

  const parts = [parsed.message, parsed.code, parsed.detail?.hint]
    .filter((value): value is string => typeof value === 'string' && value.length > 0);

  if (parsed.detail?.connectUrl) {
    parts.push(`Connect Dev.to: ${parsed.detail.connectUrl}`);
  }

  if (parsed.detail?.upgradeUrl) {
    parts.push(`Upgrade plan: ${parsed.detail.upgradeUrl}`);
  }

  return parts.join(' | ') || rawText.slice(0, 300);
}

function normalizeTagList(tagList: unknown, tags: unknown): string[] {
  if (Array.isArray(tagList)) {
    return tagList.filter((item): item is string => typeof item === 'string' && item.length > 0);
  }

  const source = typeof tagList === 'string' ? tagList : typeof tags === 'string' ? tags : '';
  if (!source) return [];

  return source
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function normalizeArticle(article: Record<string, unknown>): DevtoArticle {
  const tagList = normalizeTagList(article.tag_list, article.tags);
  const user = typeof article.user === 'object' && article.user
    ? article.user as Record<string, unknown>
    : {};

  return {
    ...article,
    id: Number(article.id ?? 0),
    title: String(article.title ?? ''),
    description: String(article.description ?? ''),
    slug: String(article.slug ?? ''),
    url: String(article.url ?? ''),
    canonical_url: (article.canonical_url as string | null | undefined) ?? null,
    cover_image: (article.cover_image as string | null | undefined) ?? null,
    published: Boolean(article.published),
    published_at: (article.published_at as string | null | undefined) ?? null,
    tag_list: tagList,
    tags: typeof article.tags === 'string' ? article.tags : tagList.join(', '),
    body_markdown: String(article.body_markdown ?? article.bodyMarkdown ?? ''),
    body_html: String(article.body_html ?? article.bodyHtml ?? ''),
    comments_count: Number(article.comments_count ?? 0),
    positive_reactions_count: Number(article.positive_reactions_count ?? 0),
    public_reactions_count: Number(article.public_reactions_count ?? 0),
    page_views_count: Number(article.page_views_count ?? 0),
    reading_time_minutes: Number(article.reading_time_minutes ?? 0),
    user: {
      username: String(user.username ?? ''),
      name: String(user.name ?? ''),
    },
  };
}

export async function createArticle(
  config: DevtoConfig,
  options: CreateArticleOptions,
): Promise<DevtoArticle> {
  const article = await post<Record<string, unknown>>('/devto/createArticle', {
    title: options.title,
    bodyMarkdown: options.bodyMarkdown,
    published: options.published ?? false,
    tags: options.tags,
    description: options.description,
    canonicalUrl: options.canonicalUrl,
    coverImage: options.coverImage,
    series: options.series,
  }, config);

  return normalizeArticle(article);
}

export async function updateArticle(
  config: DevtoConfig,
  id: number,
  options: UpdateArticleOptions,
): Promise<DevtoArticle> {
  const article = await post<Record<string, unknown>>('/devto/updateArticle', {
    id,
    ...options,
  }, config);

  return normalizeArticle(article);
}

export async function getArticle(
  config: DevtoConfig,
  id: number,
): Promise<DevtoArticle> {
  const article = await post<Record<string, unknown>>('/devto/getArticle', { id }, config);
  return normalizeArticle(article);
}

export async function listMyArticles(
  config: DevtoConfig,
  page = 1,
  perPage = 30,
): Promise<DevtoArticle[]> {
  const articles = await post<Record<string, unknown>[]>(
    '/devto/listMyArticles',
    { page, per_page: perPage },
    config,
  );

  return articles.map((article) => normalizeArticle(article));
}

export async function listDraftArticles(
  config: DevtoConfig,
  page = 1,
  perPage = 30,
): Promise<DevtoArticle[]> {
  const articles = await post<Record<string, unknown>[]>(
    '/devto/listDrafts',
    { page, per_page: perPage },
    config,
  );

  return articles.map((article) => normalizeArticle(article));
}

export async function listPublishedArticles(
  config: DevtoConfig,
  page = 1,
  perPage = 30,
): Promise<DevtoArticle[]> {
  const articles = await post<Record<string, unknown>[]>(
    '/devto/listPublished',
    { page, per_page: perPage },
    config,
  );

  return articles.map((article) => normalizeArticle(article));
}

export async function publishArticle(
  config: DevtoConfig,
  id: number,
): Promise<DevtoArticle> {
  const article = await post<Record<string, unknown>>('/devto/publishArticle', { id }, config);
  return normalizeArticle(article);
}

export async function unpublishArticle(
  config: DevtoConfig,
  id: number,
): Promise<DevtoArticle> {
  const article = await post<Record<string, unknown>>('/devto/unpublishArticle', { id }, config);
  return normalizeArticle(article);
}
