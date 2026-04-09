/**
 * hashnode-api.ts — MOCK IMPLEMENTATION
 *
 * This file is a mock. The skill talks to Hashnode exclusively through
 * YouMind's OpenAPI proxy, but YouMind has not yet shipped the Hashnode
 * namespace on that OpenAPI. This mock lets the rest of the skill
 * (publisher, CLI) be built and smoke-tested end-to-end right now, without
 * a real backend.
 *
 * Swap-in plan when the real YouMind endpoints ship:
 *   1. YouMind will expose REST-style POST/GET endpoints under
 *      `https://youmind.com/openapi/v1/hashnode/<op>`. Internally the YouMind
 *      proxy will translate these REST calls into Hashnode's GraphQL API
 *      (publishPost / updatePost / post / publication.posts / searchTags
 *      mutations and queries), so the mock's stable TypeScript signatures
 *      below already encode the response shape the real endpoints will
 *      return. The only auth difference is that YouMind accepts
 *      `x-api-key: <youmind_api_key>` instead of a Hashnode Personal Access
 *      Token — YouMind holds the user's Hashnode token server-side and
 *      attaches it to the upstream GraphQL request.
 *   2. Replace each mock function body below with a `fetch()` POST/GET to
 *      the corresponding `https://youmind.com/openapi/v1/hashnode/<op>`
 *      using the `x-api-key` header (same helper pattern as youmind-api.ts).
 *   3. Keep the exported type signatures stable — they ARE the swap-in
 *      contract. Nothing in publisher.ts / cli.ts should need to change.
 *   4. Delete the `mockState`, `initMockState`, and the mock builder
 *      helpers at that point.
 *
 * loadHashnodeConfig is NOT mocked — it reads real config the same way as
 * youmind-api.ts, because users will set their YouMind API key through the
 * normal config flow even before the Hashnode endpoints exist.
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

// ---------------------------------------------------------------------------
// Public types — stable contract (do NOT change signatures when swapping to
// real HTTP; only the function bodies below should change).
// ---------------------------------------------------------------------------

export interface HashnodeConfig {
  apiKey: string;
  baseUrl: string;
}

export interface HashnodePost {
  id: string;
  title: string;
  subtitle: string | null;
  slug: string;
  url: string;
  canonicalUrl: string | null;
  coverImage: { url: string } | null;
  brief: string;
  content: { markdown: string; html: string };
  tags: { id: string; name: string; slug: string }[];
  series: { id: string; name: string } | null;
  publishedAt: string | null;
  readTimeInMinutes: number;
  reactionCount: number;
  views: number;
  [key: string]: unknown;
}

export interface PublishPostInput {
  title: string;
  contentMarkdown: string;
  subtitle?: string;
  tags?: { id: string; name: string; slug: string }[];
  tagSlugs?: string[];
  coverImageOptions?: { coverImageURL: string };
  canonicalUrl?: string;
  seriesId?: string;
  metaTags?: { title?: string; description?: string; image?: string };
  publishAs?: string;
  disableComments?: boolean;
}

export interface UpdatePostInput {
  title?: string;
  contentMarkdown?: string;
  subtitle?: string;
  tags?: { id: string; name: string; slug: string }[];
  tagSlugs?: string[];
  coverImageOptions?: { coverImageURL: string };
  canonicalUrl?: string;
  seriesId?: string;
  metaTags?: { title?: string; description?: string; image?: string };
}

export interface HashnodeTag {
  id: string;
  name: string;
  slug: string;
  postsCount: number;
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

export function loadHashnodeConfig(): HashnodeConfig {
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
  publishedPosts: HashnodePost[];
  mockTags: HashnodeTag[];
}

function initMockState(): MockState {
  return {
    postCounter: 0,
    publishedPosts: [],
    mockTags: [
      { id: 'mock_tag_1', name: 'JavaScript', slug: 'javascript', postsCount: 12345 },
      { id: 'mock_tag_2', name: 'TypeScript', slug: 'typescript', postsCount: 8765 },
      { id: 'mock_tag_3', name: 'React', slug: 'react', postsCount: 9876 },
      { id: 'mock_tag_4', name: 'Node.js', slug: 'nodejs', postsCount: 6543 },
      { id: 'mock_tag_5', name: 'GraphQL', slug: 'graphql', postsCount: 4321 },
      { id: 'mock_tag_6', name: 'Web Development', slug: 'web-development', postsCount: 15432 },
      { id: 'mock_tag_7', name: 'Python', slug: 'python', postsCount: 11234 },
      { id: 'mock_tag_8', name: 'API', slug: 'api', postsCount: 5678 },
    ],
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

function normalizeTags(
  tags?: { id: string; name: string; slug: string }[],
  tagSlugs?: string[],
): { id: string; name: string; slug: string }[] {
  if (tags?.length) return tags;
  if (tagSlugs?.length) {
    return tagSlugs.map((slug, idx) => ({
      id: `mock_tag_${Date.now()}_${idx}`,
      name: slug,
      slug,
    }));
  }
  return [];
}

function estimateReadTime(markdown: string): number {
  const words = markdown.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function buildMockPost(
  counter: number,
  input: PublishPostInput,
): HashnodePost {
  const slugBase = slugify(input.title) || `mock-article-${counter}`;
  const id = `mock_hashnode_post_${Date.now()}_${counter}`;
  const now = new Date().toISOString();
  const markdown = input.contentMarkdown;

  return {
    id,
    title: input.title,
    subtitle: input.subtitle ?? null,
    slug: slugBase,
    url: `https://mock.hashnode.dev/mock-article-${counter}`,
    canonicalUrl: input.canonicalUrl ?? null,
    coverImage: input.coverImageOptions?.coverImageURL
      ? { url: input.coverImageOptions.coverImageURL }
      : null,
    brief: markdown.slice(0, 250),
    content: {
      markdown,
      html: `<p>${markdown.slice(0, 200)}</p>`,
    },
    tags: normalizeTags(input.tags, input.tagSlugs),
    series: input.seriesId ? { id: input.seriesId, name: 'Mock Series' } : null,
    publishedAt: now,
    readTimeInMinutes: estimateReadTime(markdown),
    reactionCount: 0,
    views: 0,
  };
}

// ---------------------------------------------------------------------------
// Exported mock functions
// ---------------------------------------------------------------------------

/**
 * Publish a new post to a Hashnode publication.
 */
export async function publishPost(
  _config: HashnodeConfig,
  options: PublishPostInput,
): Promise<HashnodePost> {
  mockState.postCounter += 1;
  const post = buildMockPost(mockState.postCounter, options);
  mockState.publishedPosts.unshift(post);
  return post;
}

/**
 * Update an existing Hashnode post.
 */
export async function updatePost(
  _config: HashnodeConfig,
  postId: string,
  options: UpdatePostInput,
): Promise<HashnodePost> {
  const existing = mockState.publishedPosts.find((p) => p.id === postId);
  if (existing) {
    if (options.title !== undefined) existing.title = options.title;
    if (options.contentMarkdown !== undefined) {
      existing.content = {
        markdown: options.contentMarkdown,
        html: `<p>${options.contentMarkdown.slice(0, 200)}</p>`,
      };
      existing.brief = options.contentMarkdown.slice(0, 250);
      existing.readTimeInMinutes = estimateReadTime(options.contentMarkdown);
    }
    if (options.subtitle !== undefined) existing.subtitle = options.subtitle ?? null;
    const normalized = normalizeTags(options.tags, options.tagSlugs);
    if (normalized.length) existing.tags = normalized;
    if (options.coverImageOptions) {
      existing.coverImage = { url: options.coverImageOptions.coverImageURL };
    }
    if (options.canonicalUrl !== undefined) existing.canonicalUrl = options.canonicalUrl ?? null;
    if (options.seriesId !== undefined) {
      existing.series = options.seriesId
        ? { id: options.seriesId, name: 'Mock Series' }
        : null;
    }
    return existing;
  }

  // Fabricate a plausible post if we've never seen this id.
  mockState.postCounter += 1;
  return buildMockPost(mockState.postCounter, {
    title: options.title ?? `Mock Article ${postId}`,
    contentMarkdown: options.contentMarkdown ?? '# Mock content',
    subtitle: options.subtitle,
    tags: options.tags,
    tagSlugs: options.tagSlugs,
    coverImageOptions: options.coverImageOptions,
    canonicalUrl: options.canonicalUrl,
    seriesId: options.seriesId,
    metaTags: options.metaTags,
  });
}

/**
 * Get a single Hashnode post by ID.
 */
export async function getPost(
  _config: HashnodeConfig,
  postId: string,
): Promise<HashnodePost> {
  const found = mockState.publishedPosts.find((p) => p.id === postId);
  if (found) return found;
  mockState.postCounter += 1;
  return buildMockPost(mockState.postCounter, {
    title: `Mock Article ${postId}`,
    contentMarkdown: '# Mock content\n\nThis is a mock Hashnode post.',
  });
}

/**
 * List posts from a Hashnode publication.
 */
export async function listPosts(
  _config: HashnodeConfig,
  first = 10,
): Promise<HashnodePost[]> {
  return mockState.publishedPosts.slice(0, first);
}

/**
 * Search for Hashnode tags by keyword.
 */
export async function searchTags(
  _config: HashnodeConfig,
  keyword: string,
  first = 10,
): Promise<HashnodeTag[]> {
  const needle = keyword.toLowerCase();
  const matches = mockState.mockTags.filter(
    (t) => t.name.toLowerCase().includes(needle) || t.slug.toLowerCase().includes(needle),
  );
  return matches.slice(0, first);
}
