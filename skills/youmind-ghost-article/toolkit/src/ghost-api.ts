/**
 * ghost-api.ts — MOCK IMPLEMENTATION
 *
 * ⚠️ This file is a mock. The skill talks to Ghost exclusively through
 * YouMind's OpenAPI proxy, but YouMind has not yet shipped the Ghost
 * namespace on that OpenAPI. This mock lets the rest of the skill
 * (publisher, CLI) be built and smoke-tested end-to-end right now, without
 * a real backend.
 *
 * Swap-in plan when the real YouMind endpoints ship:
 *   1. YouMind will expose endpoints whose request/response shape mirrors
 *      Ghost's Admin API (same field names like `title`, `html`,
 *      `custom_excerpt`, `status`, `tags`, same /posts, /posts/{id},
 *      /images/upload endpoints). The only auth difference is that YouMind
 *      accepts `x-api-key: <youmind_api_key>` instead of a Ghost Admin JWT —
 *      YouMind holds the user's Ghost admin key server-side and attaches it.
 *   2. Replace each mock function body below with a `fetch()` POST/GET/PUT
 *      to the corresponding `https://youmind.com/openapi/v1/ghost/<op>`
 *      using the `x-api-key` header (same helper pattern as youmind-api.ts).
 *   3. Keep the exported type signatures stable — they ARE the swap-in
 *      contract. Nothing in publisher.ts / cli.ts should need to change.
 *   4. Delete the `mockState` and `initMockState` at that point.
 *
 * loadGhostConfig is NOT mocked — it reads real config the same way as
 * youmind-api.ts, because users will set their YouMind API key through the
 * normal config flow even before the Ghost endpoints exist.
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

// ---------------------------------------------------------------------------
// Public types — stable contract (do NOT change signatures when swapping to
// real HTTP; only the function bodies below should change).
// ---------------------------------------------------------------------------

export interface GhostConfig {
  apiKey: string;
  baseUrl: string;
}

export interface GhostTag {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  feature_image: string | null;
  visibility: string;
  [key: string]: unknown;
}

export interface GhostPost {
  id: string;
  uuid: string;
  title: string;
  slug: string;
  html: string | null;
  excerpt: string | null;
  custom_excerpt: string | null;
  feature_image: string | null;
  featured: boolean;
  status: 'published' | 'draft' | 'scheduled' | 'sent';
  visibility: 'public' | 'members' | 'paid' | 'tiers';
  created_at: string;
  updated_at: string;
  published_at: string | null;
  url: string;
  tags: GhostTag[];
  primary_tag: GhostTag | null;
  [key: string]: unknown;
}

export interface CreatePostOptions {
  title: string;
  html: string;
  custom_excerpt?: string;
  status?: 'published' | 'draft' | 'scheduled';
  tags?: Array<{ name: string } | { id: string }>;
  feature_image?: string;
  featured?: boolean;
  visibility?: 'public' | 'members' | 'paid' | 'tiers';
  slug?: string;
  published_at?: string;
}

export interface GhostImage {
  url: string;
  ref: string | null;
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

export function loadGhostConfig(): GhostConfig {
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
  imageCounter: number;
  publishedPosts: GhostPost[];
}

function initMockState(): MockState {
  return {
    postCounter: 0,
    imageCounter: 0,
    publishedPosts: [],
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

function mockUuid(seed: string): string {
  // Deterministic-ish 36-char UUID-like string derived from seed.
  const base = `${seed}${Date.now()}`.padEnd(32, '0');
  const hex = Buffer.from(base).toString('hex').slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

function buildMockTag(name: string): GhostTag {
  return {
    id: `mock_ghost_tag_${slugify(name) || 'tag'}`,
    name,
    slug: slugify(name) || 'tag',
    description: null,
    feature_image: null,
    visibility: 'public',
  };
}

function resolveTags(
  input: CreatePostOptions['tags'],
): { tags: GhostTag[]; primary: GhostTag | null } {
  if (!input || input.length === 0) {
    return { tags: [], primary: null };
  }
  const tags: GhostTag[] = input.map((t) => {
    if ('name' in t && typeof t.name === 'string') {
      return buildMockTag(t.name);
    }
    if ('id' in t && typeof t.id === 'string') {
      return {
        id: t.id,
        name: t.id,
        slug: slugify(t.id) || t.id,
        description: null,
        feature_image: null,
        visibility: 'public',
      };
    }
    return buildMockTag('untitled');
  });
  return { tags, primary: tags[0] ?? null };
}

function buildMockPost(
  id: string,
  options: CreatePostOptions,
): GhostPost {
  const now = new Date().toISOString();
  const status = options.status ?? 'draft';
  const { tags, primary } = resolveTags(options.tags);
  const slugBase = options.slug || slugify(options.title) || `mock-post-${id}`;
  const url = `https://mock.ghost.io/posts/${id}`;
  const excerpt =
    options.custom_excerpt ??
    (options.html ? options.html.replace(/<[^>]+>/g, '').slice(0, 300) : '');

  return {
    id,
    uuid: mockUuid(id),
    title: options.title,
    slug: slugBase,
    html: options.html ?? null,
    excerpt,
    custom_excerpt: options.custom_excerpt ?? null,
    feature_image: options.feature_image ?? null,
    featured: options.featured ?? false,
    status,
    visibility: options.visibility ?? 'public',
    created_at: now,
    updated_at: now,
    published_at: status === 'published' ? (options.published_at ?? now) : null,
    url,
    tags,
    primary_tag: primary,
  };
}

// ---------------------------------------------------------------------------
// Exported mock functions — Posts
// ---------------------------------------------------------------------------

/**
 * Create a new Ghost post.
 */
export async function createPost(
  _config: GhostConfig,
  options: CreatePostOptions,
): Promise<GhostPost> {
  mockState.postCounter += 1;
  const id = `mock_ghost_post_${Date.now()}_${mockState.postCounter}`;
  const post = buildMockPost(id, options);
  mockState.publishedPosts.unshift(post);
  return post;
}

/**
 * Update an existing Ghost post.
 */
export async function updatePost(
  _config: GhostConfig,
  postId: string,
  options: Partial<CreatePostOptions> & { updated_at: string },
): Promise<GhostPost> {
  const existing = mockState.publishedPosts.find((p) => p.id === postId);
  if (existing) {
    if (options.title !== undefined) existing.title = options.title;
    if (options.html !== undefined) {
      existing.html = options.html ?? null;
      if (options.custom_excerpt === undefined && options.html) {
        existing.excerpt = options.html.replace(/<[^>]+>/g, '').slice(0, 300);
      }
    }
    if (options.custom_excerpt !== undefined) {
      existing.custom_excerpt = options.custom_excerpt ?? null;
      existing.excerpt = options.custom_excerpt ?? existing.excerpt;
    }
    if (options.status !== undefined) {
      existing.status = options.status;
      existing.published_at =
        options.status === 'published'
          ? (options.published_at ?? new Date().toISOString())
          : null;
    }
    if (options.tags !== undefined) {
      const { tags, primary } = resolveTags(options.tags);
      existing.tags = tags;
      existing.primary_tag = primary;
    }
    if (options.feature_image !== undefined) existing.feature_image = options.feature_image ?? null;
    if (options.featured !== undefined) existing.featured = options.featured;
    if (options.visibility !== undefined) existing.visibility = options.visibility;
    if (options.slug !== undefined) existing.slug = options.slug;
    existing.updated_at = new Date().toISOString();
    return existing;
  }

  // Fabricate a plausible post if we've never seen this id.
  return buildMockPost(postId, {
    title: options.title ?? `Mock Post ${postId}`,
    html: options.html ?? '',
    custom_excerpt: options.custom_excerpt,
    status: options.status,
    tags: options.tags,
    feature_image: options.feature_image,
    featured: options.featured,
    visibility: options.visibility,
    slug: options.slug,
    published_at: options.published_at,
  });
}

/**
 * Get a single Ghost post by ID.
 */
export async function getPost(
  _config: GhostConfig,
  postId: string,
): Promise<GhostPost> {
  const found = mockState.publishedPosts.find((p) => p.id === postId);
  if (found) return found;
  return buildMockPost(postId, {
    title: `Mock Post ${postId}`,
    html: '<p>Mock Ghost post content.</p>',
    status: 'published',
  });
}

/**
 * List Ghost posts with pagination metadata.
 */
export async function listPosts(
  _config: GhostConfig,
  page = 1,
  limit = 15,
): Promise<{ posts: GhostPost[]; total: number }> {
  const start = (page - 1) * limit;
  const slice = mockState.publishedPosts.slice(start, start + limit);
  return { posts: slice, total: mockState.publishedPosts.length };
}

// ---------------------------------------------------------------------------
// Exported mock functions — Images
// ---------------------------------------------------------------------------

/**
 * Upload an image to Ghost. Mocked: returns a fake hosted URL without
 * touching the filesystem beyond what the caller already passed in.
 */
export async function uploadImage(
  _config: GhostConfig,
  filePath: string,
): Promise<GhostImage> {
  mockState.imageCounter += 1;
  const name = filePath.split(/[\\/]/).pop() || `image_${mockState.imageCounter}`;
  const safeName = slugify(name.replace(/\.[^.]+$/, '')) || `image-${mockState.imageCounter}`;
  return {
    url: `https://mock.ghost.io/content/images/${safeName}.jpg`,
    ref: null,
  };
}

// ---------------------------------------------------------------------------
// Exported mock functions — Validation
// ---------------------------------------------------------------------------

/**
 * Validate connectivity to Ghost via the YouMind proxy.
 */
export async function validateConnection(
  config: GhostConfig,
): Promise<{ ok: boolean; message: string }> {
  try {
    const result = await listPosts(config, 1, 1);
    return {
      ok: true,
      message: `Connected via YouMind proxy (${config.baseUrl}). Found ${result.total} total post(s). API is working.`,
    };
  } catch (e) {
    return {
      ok: false,
      message: `Connection failed: ${(e as Error).message}`,
    };
  }
}
