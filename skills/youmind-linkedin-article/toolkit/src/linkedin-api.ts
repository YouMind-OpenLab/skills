/**
 * linkedin-api.ts — MOCK IMPLEMENTATION
 *
 * This file is a mock. The skill talks to LinkedIn exclusively through
 * YouMind's OpenAPI proxy, but YouMind has not yet shipped the LinkedIn
 * namespace on that OpenAPI. This mock lets the rest of the skill
 * (publisher, CLI) be built and smoke-tested end-to-end right now, without
 * a real backend.
 *
 * LinkedIn's two-step image -> post flow is PRESERVED in the public
 * signatures: callers still uploadImage() first to get a fake asset URN,
 * then pass it via mediaAssets[] to createPost(). When YouMind ships its
 * `/linkedin/*` endpoints, only the function bodies below need to change;
 * the orchestration in publisher.ts stays the same.
 *
 * Person vs. organization distinction is YouMind's responsibility
 * server-side, based on the user's bound LinkedIn account. The skill no
 * longer needs to know person/organization URN types at the config level;
 * `createPost` still accepts an `asOrganization` hint, but the mock (and
 * the future proxy) will rely on the bound account, not on URNs the skill
 * sends in.
 *
 * Swap-in plan when the real YouMind endpoints ship:
 *   1. YouMind will expose endpoints whose request/response shape mirrors
 *      LinkedIn's REST API (same field names like `commentary`, `author`,
 *      `lifecycleState`, `visibility`, same `/posts` and `/assets` style
 *      operations). The auth difference is that YouMind accepts
 *      `x-api-key: <youmind_api_key>` instead of a LinkedIn OAuth bearer
 *      token — YouMind holds the user's LinkedIn token server-side and
 *      attaches it, and decides person-vs-organization authorship from
 *      the bound account.
 *   2. Replace each mock function body below with a `fetch()` POST/GET to
 *      the corresponding `https://youmind.com/openapi/v1/linkedin/<op>`
 *      using the `x-api-key` header (same helper pattern as youmind-api.ts).
 *      `uploadImage` becomes a single POST to `/linkedin/uploadImage` —
 *      the proxy internally runs LinkedIn's two-step register-then-PUT
 *      asset upload and returns the resulting asset URN. `createPost`
 *      becomes a POST to `/linkedin/createPost` — the proxy attaches the
 *      asset URN(s) and creates the post against LinkedIn's REST API.
 *   3. Keep the exported type signatures stable — they ARE the swap-in
 *      contract. Nothing in publisher.ts / cli.ts should need to change.
 *   4. Delete the `mockState`, `initMockState`, and the env-var switches
 *      at that point.
 *
 * loadLinkedInConfig is NOT mocked — it reads real config the same way as
 * youmind-api.ts, because users will set their YouMind API key through the
 * normal config flow even before the LinkedIn endpoints exist.
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

// ---------------------------------------------------------------------------
// Public types — stable contract (do NOT change signatures when swapping to
// real HTTP; only the function bodies below should change).
// ---------------------------------------------------------------------------

export interface LinkedInConfig {
  apiKey: string;
  baseUrl: string;
}

export interface LinkedInPost {
  id: string;
  activity?: string;
  [key: string]: unknown;
}

export interface CreatePostOptions {
  text: string;
  visibility?: 'PUBLIC' | 'CONNECTIONS';
  /** Post as organization page instead of personal profile. The mock
   *  ignores this; the real YouMind proxy will use the user's bound
   *  account to decide person vs. organization authorship. */
  asOrganization?: boolean;
  /** Media asset URNs to attach (returned by uploadImage). */
  mediaAssets?: Array<{
    id: string;
    title?: string;
    description?: string;
  }>;
}

export interface ImageUploadResult {
  asset: string;
  downloadUrl?: string;
}

export interface LinkedInProfile {
  sub: string;
  name: string;
  email?: string;
  picture?: string;
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

export function loadLinkedInConfig(): LinkedInConfig {
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
  assetCounter: number;
  uploadedAssets: Map<string, { url: string; asset: string }>;
  publishedPosts: LinkedInPost[];
}

function initMockState(): MockState {
  return {
    postCounter: 0,
    assetCounter: 0,
    uploadedAssets: new Map<string, { url: string; asset: string }>(),
    publishedPosts: [],
  };
}

const mockState: MockState = initMockState();

function mockPermalink(postId: string): string {
  return `https://linkedin.com/feed/update/${postId}`;
}

// ---------------------------------------------------------------------------
// Public API -- Upload Image (step 1 of the two-step image -> post flow)
// ---------------------------------------------------------------------------

/**
 * Upload an image to LinkedIn for use in posts.
 *
 * In the real LinkedIn API this is a two-step register-then-PUT flow. The
 * future YouMind proxy collapses that into a single POST and returns the
 * resulting asset URN. This mock just fabricates a URN; no upload happens.
 *
 * @param config LinkedIn configuration
 * @param imageSource Local file path or URL (the proxy will handle either)
 * @returns A fake `{ asset }` URN that can be passed to createPost via
 *          `mediaAssets[].id`.
 */
export async function uploadImage(
  _config: LinkedInConfig,
  imageSource: string,
): Promise<ImageUploadResult> {
  mockState.assetCounter += 1;
  const asset = `urn:li:digitalmediaAsset:mock_${mockState.assetCounter}`;
  const downloadUrl = `https://linkedin.com/dms/mock/${mockState.assetCounter}`;
  mockState.uploadedAssets.set(asset, { url: imageSource, asset });
  return { asset, downloadUrl };
}

// ---------------------------------------------------------------------------
// Public API -- Create Post (step 2 of the two-step image -> post flow)
// ---------------------------------------------------------------------------

/**
 * Create a LinkedIn post (UGC format via /posts endpoint).
 *
 * If `options.mediaAssets` contains asset URNs returned by an earlier
 * uploadImage() call, they'll be attached to the post.
 */
export async function createPost(
  _config: LinkedInConfig,
  options: CreatePostOptions,
): Promise<LinkedInPost> {
  if (!options.text || !options.text.trim()) {
    throw new Error('createPost requires non-empty text');
  }

  mockState.postCounter += 1;
  const id = `urn:li:share:mock_${Date.now()}_${mockState.postCounter}`;
  const post: LinkedInPost = {
    id,
    activity: `urn:li:activity:mock_${mockState.postCounter}`,
    commentary: options.text,
    visibility: options.visibility || 'PUBLIC',
    lifecycleState: 'PUBLISHED',
    permalink: mockPermalink(`urn:li:share:mock_${mockState.postCounter}`),
    asOrganization: !!options.asOrganization,
  };

  if (options.mediaAssets?.length) {
    post.mediaAssets = options.mediaAssets.map((a) => ({
      id: a.id,
      altText: a.title || '',
      description: a.description || '',
    }));
  }

  mockState.publishedPosts.unshift(post);
  return post;
}

// ---------------------------------------------------------------------------
// Public API -- Get Profile
// ---------------------------------------------------------------------------

/**
 * Get the authenticated user's profile info.
 */
export async function getProfile(
  _config: LinkedInConfig,
): Promise<LinkedInProfile> {
  return {
    sub: 'urn:li:person:mock_user',
    name: 'Mock User',
    localizedFirstName: 'Mock',
    localizedLastName: 'User',
    email: 'mock.user@example.com',
    picture: 'https://linkedin.com/dms/mock/profile.jpg',
  };
}
