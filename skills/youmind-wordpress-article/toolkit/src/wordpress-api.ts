/**
 * wordpress-api.ts — MOCK IMPLEMENTATION
 *
 * ⚠️ This file is a mock. The skill talks to WordPress exclusively through
 * YouMind's OpenAPI proxy, but YouMind has not yet shipped the WordPress
 * namespace on that OpenAPI. This mock lets the rest of the skill
 * (publisher, CLI) be built and smoke-tested end-to-end right now, without
 * a real backend.
 *
 * Swap-in plan when the real YouMind endpoints ship:
 *   1. YouMind will expose endpoints whose request/response shape mirrors
 *      WordPress's REST API (same field names like `title`, `content`,
 *      `excerpt`, `status`, `categories`, `tags`, `featured_media`, same
 *      /posts, /posts/{id}, /media, /categories, /tags endpoints). The
 *      only auth difference is that YouMind accepts
 *      `x-api-key: <youmind_api_key>` instead of Basic Auth to
 *      `{site_url}/wp-json/wp/v2/` with an Application Password —
 *      YouMind holds the user's site_url + app_password server-side and
 *      attaches them.
 *   2. Replace each mock function body below with a `fetch()` POST/GET/PUT
 *      to the corresponding `https://youmind.com/openapi/v1/wordpress/<op>`
 *      using the `x-api-key` header (same helper pattern as youmind-api.ts).
 *   3. Keep the exported type signatures stable — they ARE the swap-in
 *      contract. Nothing in publisher.ts / cli.ts / content-adapter.ts
 *      should need to change.
 *   4. Delete the `mockState`, `initMockState`, and the mock seed data
 *      at that point.
 *
 * loadWordPressConfig is NOT mocked — it reads real config the same way as
 * youmind-api.ts, because users will set their YouMind API key through the
 * normal config flow even before the WordPress endpoints exist.
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

// ---------------------------------------------------------------------------
// Public types — stable contract (do NOT change signatures when swapping to
// real HTTP; only the function bodies below should change).
// ---------------------------------------------------------------------------

export interface WordPressConfig {
  apiKey: string;
  baseUrl: string;
}

export interface WPPost {
  id: number;
  date: string;
  date_gmt: string;
  slug: string;
  status: 'publish' | 'draft' | 'pending' | 'private' | 'future' | 'trash';
  title: { rendered: string };
  content: { rendered: string };
  excerpt: { rendered: string };
  author: number;
  featured_media: number;
  categories: number[];
  tags: number[];
  link: string;
  [key: string]: unknown;
}

export interface CreatePostOptions {
  title: string;
  content: string;
  excerpt?: string;
  status?: 'publish' | 'draft' | 'pending' | 'private' | 'future';
  categories?: number[];
  tags?: number[];
  featured_media?: number;
  slug?: string;
  date?: string;
  format?: 'standard' | 'aside' | 'chat' | 'gallery' | 'link' | 'image' | 'quote' | 'status' | 'video' | 'audio';
}

export interface WPMedia {
  id: number;
  date: string;
  slug: string;
  status: string;
  title: { rendered: string };
  source_url: string;
  media_type: string;
  mime_type: string;
  [key: string]: unknown;
}

export interface WPCategory {
  id: number;
  count: number;
  description: string;
  link: string;
  name: string;
  slug: string;
  parent: number;
  [key: string]: unknown;
}

export interface WPTag {
  id: number;
  count: number;
  description: string;
  link: string;
  name: string;
  slug: string;
  [key: string]: unknown;
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

export function loadWordPressConfig(): WordPressConfig {
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
  postCounter: number;
  mediaCounter: number;
  categoryCounter: number;
  tagCounter: number;
  publishedPosts: WPPost[];
  mediaById: Map<number, WPMedia>;
  categories: WPCategory[];
  tags: WPTag[];
}

function buildMockCategory(id: number, name: string): WPCategory {
  const slug = slugify(name) || `category-${id}`;
  return {
    id,
    count: 0,
    description: '',
    link: `https://mock.wordpress.com/category/${slug}/`,
    name,
    slug,
    parent: 0,
  };
}

function buildMockTag(id: number, name: string): WPTag {
  const slug = slugify(name) || `tag-${id}`;
  return {
    id,
    count: 0,
    description: '',
    link: `https://mock.wordpress.com/tag/${slug}/`,
    name,
    slug,
  };
}

function initMockState(): MockState {
  const seededCategories: WPCategory[] = [
    buildMockCategory(1, 'Uncategorized'),
    buildMockCategory(2, 'Tech'),
    buildMockCategory(3, 'Writing'),
  ];
  const seededTags: WPTag[] = [
    buildMockTag(1, 'ai'),
    buildMockTag(2, 'tutorial'),
    buildMockTag(3, 'productivity'),
  ];
  return {
    postCounter: 100,
    mediaCounter: 500,
    categoryCounter: seededCategories.length,
    tagCounter: seededTags.length,
    publishedPosts: [],
    mediaById: new Map<number, WPMedia>(),
    categories: seededCategories,
    tags: seededTags,
  };
}

const mockState: MockState = initMockState();

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function mockPostLink(id: number): string {
  return `https://mock.wordpress.com/?p=${id}`;
}

function buildMockPost(id: number, options: CreatePostOptions): WPPost {
  const now = new Date();
  const iso = now.toISOString();
  const slugBase = options.slug || slugify(options.title) || `mock-post-${id}`;
  const rawExcerpt = options.excerpt || `${options.content.slice(0, 150)}...`;
  return {
    id,
    date: iso,
    date_gmt: iso,
    slug: slugBase,
    status: options.status ?? 'draft',
    title: { rendered: options.title },
    content: { rendered: options.content },
    excerpt: { rendered: `<p>${rawExcerpt}</p>` },
    author: 1,
    featured_media: options.featured_media ?? 0,
    categories: options.categories ?? [1],
    tags: options.tags ?? [],
    link: mockPostLink(id),
  };
}

// ---------------------------------------------------------------------------
// Exported mock functions — Posts
// ---------------------------------------------------------------------------

/**
 * Create a new WordPress post.
 */
export async function createPost(
  _config: WordPressConfig,
  options: CreatePostOptions,
): Promise<WPPost> {
  mockState.postCounter += 1;
  const post = buildMockPost(mockState.postCounter, options);
  mockState.publishedPosts.unshift(post);
  return post;
}

/**
 * Update an existing WordPress post.
 */
export async function updatePost(
  _config: WordPressConfig,
  postId: number,
  options: Partial<CreatePostOptions>,
): Promise<WPPost> {
  const existing = mockState.publishedPosts.find((p) => p.id === postId);
  if (existing) {
    if (options.title !== undefined) existing.title = { rendered: options.title };
    if (options.content !== undefined) existing.content = { rendered: options.content };
    if (options.excerpt !== undefined) existing.excerpt = { rendered: `<p>${options.excerpt}</p>` };
    if (options.status !== undefined) existing.status = options.status;
    if (options.categories !== undefined) existing.categories = options.categories;
    if (options.tags !== undefined) existing.tags = options.tags;
    if (options.featured_media !== undefined) existing.featured_media = options.featured_media;
    if (options.slug !== undefined) existing.slug = options.slug;
    return existing;
  }

  // Fabricate a plausible post if we've never seen this id.
  return buildMockPost(postId, {
    title: options.title ?? `Mock Post ${postId}`,
    content: options.content ?? '<p>Mock content.</p>',
    excerpt: options.excerpt,
    status: options.status,
    categories: options.categories,
    tags: options.tags,
    featured_media: options.featured_media,
    slug: options.slug,
  });
}

/**
 * Get a single WordPress post by ID.
 */
export async function getPost(
  _config: WordPressConfig,
  postId: number,
): Promise<WPPost> {
  const found = mockState.publishedPosts.find((p) => p.id === postId);
  if (found) return found;
  return buildMockPost(postId, {
    title: `Mock Post ${postId}`,
    content: '<p>Mock content.</p>',
    status: 'publish',
  });
}

/**
 * List recent WordPress posts.
 */
export async function listPosts(
  _config: WordPressConfig,
  page = 1,
  perPage = 10,
): Promise<WPPost[]> {
  const start = (page - 1) * perPage;
  return mockState.publishedPosts.slice(start, start + perPage);
}

// ---------------------------------------------------------------------------
// Exported mock functions — Media
// ---------------------------------------------------------------------------

/**
 * Upload a media file to WordPress.
 */
export async function uploadMedia(
  _config: WordPressConfig,
  filePath: string,
  filename?: string,
): Promise<WPMedia> {
  mockState.mediaCounter += 1;
  const id = mockState.mediaCounter;
  const name = filename || filePath.split('/').pop() || `mock-media-${id}`;
  const ext = name.split('.').pop()?.toLowerCase() || 'jpg';

  const mimeMap: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    mp4: 'video/mp4',
    pdf: 'application/pdf',
  };
  const mimeType = mimeMap[ext] || 'application/octet-stream';
  const mediaType = mimeType.startsWith('image/')
    ? 'image'
    : mimeType.startsWith('video/')
      ? 'video'
      : 'file';

  const slug = slugify(name.replace(/\.[^.]+$/, '')) || `mock-media-${id}`;
  const iso = new Date().toISOString();
  const media: WPMedia = {
    id,
    date: iso,
    slug,
    status: 'inherit',
    title: { rendered: name },
    source_url: `https://mock.wordpress.com/wp-content/uploads/${slug}.${ext}`,
    media_type: mediaType,
    mime_type: mimeType,
  };
  mockState.mediaById.set(id, media);
  return media;
}

// ---------------------------------------------------------------------------
// Exported mock functions — Categories
// ---------------------------------------------------------------------------

/**
 * List all WordPress categories.
 */
export async function listCategories(
  _config: WordPressConfig,
): Promise<WPCategory[]> {
  return [...mockState.categories];
}

// ---------------------------------------------------------------------------
// Exported mock functions — Tags
// ---------------------------------------------------------------------------

/**
 * List all WordPress tags.
 */
export async function listTags(
  _config: WordPressConfig,
): Promise<WPTag[]> {
  return [...mockState.tags];
}

/**
 * Create a new WordPress tag.
 */
export async function createTag(
  _config: WordPressConfig,
  name: string,
): Promise<WPTag> {
  const existing = mockState.tags.find(
    (t) => t.name.toLowerCase() === name.toLowerCase(),
  );
  if (existing) return existing;

  mockState.tagCounter += 1;
  const tag = buildMockTag(mockState.tagCounter, name);
  mockState.tags.push(tag);
  return tag;
}

// ---------------------------------------------------------------------------
// Exported mock functions — Validation
// ---------------------------------------------------------------------------

/**
 * Validate the API connection to WordPress via the YouMind proxy.
 */
export async function validateConnection(
  config: WordPressConfig,
): Promise<{ ok: boolean; message: string }> {
  if (!config.apiKey) {
    return {
      ok: false,
      message: 'youmind.api_key not set in config.yaml',
    };
  }
  try {
    const posts = await listPosts(config, 1, 1);
    return {
      ok: true,
      message: `Connected to WordPress via YouMind proxy. Found ${posts.length} recent post(s). API is working.`,
    };
  } catch (e) {
    return {
      ok: false,
      message: `Connection failed: ${(e as Error).message}`,
    };
  }
}
