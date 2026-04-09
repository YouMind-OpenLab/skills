/**
 * facebook-api.ts — MOCK IMPLEMENTATION
 *
 * ⚠️ This file is a mock. The skill talks to Facebook exclusively through
 * YouMind's OpenAPI proxy, but YouMind has not yet shipped the Facebook
 * namespace on that OpenAPI. This mock lets the rest of the skill
 * (publisher, CLI) be built and smoke-tested end-to-end right now, without
 * a real backend.
 *
 * Swap-in plan when the real YouMind endpoints ship:
 *   1. YouMind will expose endpoints whose request/response shape mirrors
 *      Meta's Graph API (same field names like `message`, `link`, `url`,
 *      `caption`, same feed/photos endpoints). The only auth difference is
 *      that YouMind accepts `x-api-key: <youmind_api_key>` instead of a
 *      Facebook page access token — YouMind holds the user's Facebook token
 *      server-side and attaches it.
 *   2. Replace each mock function body below with a `fetch()` POST/GET to
 *      the corresponding `https://youmind.com/openapi/v1/facebook/<op>`
 *      using the `x-api-key` header (same helper pattern as youmind-api.ts).
 *   3. Keep the exported type signatures stable — they ARE the swap-in
 *      contract. Nothing in publisher.ts / cli.ts should need to change.
 *   4. Delete the `mockState`, `initMockState`, and the env-var switches
 *      at that point.
 *
 * loadFacebookConfig is NOT mocked — it reads real config the same way as
 * youmind-api.ts, because users will set their YouMind API key through the
 * normal config flow even before the Facebook endpoints exist.
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

// ---------------------------------------------------------------------------
// Public types — stable contract (do NOT change signatures when swapping to
// real HTTP; only the function bodies below should change).
// ---------------------------------------------------------------------------

export interface FacebookConfig {
  apiKey: string;
  baseUrl: string;
}

export interface FBPost {
  id: string;
  message?: string;
  created_time?: string;
  permalink_url?: string;
  full_picture?: string;
  type?: string;
  [key: string]: unknown;
}

export interface FBPage {
  id: string;
  name: string;
  fan_count?: number;
  [key: string]: unknown;
}

export interface FBPhoto {
  id: string;
  post_id?: string;
  link?: string;
  [key: string]: unknown;
}

export interface CreatePostOptions {
  link?: string;
  published?: boolean;
  scheduled_publish_time?: number;
}

export interface CreatePostResult {
  id: string;
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

export function loadFacebookConfig(): FacebookConfig {
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
  photoCounter: number;
  publishedPosts: FBPost[];
  photosById: Map<string, FBPhoto>;
}

function initMockState(): MockState {
  return {
    postCounter: 0,
    photoCounter: 0,
    publishedPosts: [],
    photosById: new Map<string, FBPhoto>(),
  };
}

const mockState: MockState = initMockState();

function mockPermalink(postId: string): string {
  return `https://facebook.com/mock_page/posts/${postId}`;
}

// ---------------------------------------------------------------------------
// Exported mock functions — Posts
// ---------------------------------------------------------------------------

/**
 * Create a text or link post on a Facebook Page.
 */
export async function createPost(
  _config: FacebookConfig,
  message: string,
  options?: CreatePostOptions,
): Promise<CreatePostResult> {
  mockState.postCounter += 1;
  const id = `mock_fb_post_${Date.now()}_${mockState.postCounter}`;
  const post: FBPost = {
    id,
    message,
    created_time: new Date().toISOString(),
    permalink_url: mockPermalink(id),
    type: options?.link ? 'link' : 'status',
  };
  mockState.publishedPosts.unshift(post);
  return { id };
}

/**
 * Create a photo post on a Facebook Page using a hosted image URL.
 */
export async function createPhotoPost(
  _config: FacebookConfig,
  photoUrl: string,
  caption?: string,
): Promise<FBPhoto> {
  mockState.photoCounter += 1;
  mockState.postCounter += 1;
  const photoId = `mock_fb_photo_${Date.now()}_${mockState.photoCounter}`;
  const postId = `mock_fb_post_${Date.now()}_${mockState.postCounter}`;
  const photo: FBPhoto = {
    id: photoId,
    post_id: postId,
    link: mockPermalink(postId),
  };
  mockState.photosById.set(photoId, photo);

  const post: FBPost = {
    id: postId,
    message: caption,
    created_time: new Date().toISOString(),
    permalink_url: mockPermalink(postId),
    full_picture: photoUrl,
    type: 'photo',
  };
  mockState.publishedPosts.unshift(post);

  return photo;
}

/**
 * Upload a photo to Facebook (unpublished, for staging).
 * Returns a photo ID that can be attached to a post.
 */
export async function uploadPhoto(
  _config: FacebookConfig,
  _imageBuffer: Buffer,
  _filename: string,
): Promise<FBPhoto> {
  mockState.photoCounter += 1;
  const photoId = `mock_fb_unpublished_${Date.now()}_${mockState.photoCounter}`;
  const photo: FBPhoto = { id: photoId };
  mockState.photosById.set(photoId, photo);
  return photo;
}

// ---------------------------------------------------------------------------
// Exported mock functions — Read
// ---------------------------------------------------------------------------

/**
 * Get information about the Facebook Page.
 */
export async function getPageInfo(_config: FacebookConfig): Promise<FBPage> {
  return {
    id: 'mock_page_id',
    name: 'Mock Facebook Page',
    fan_count: 0,
  };
}

/**
 * Get a specific post by ID.
 */
export async function getPost(_config: FacebookConfig, postId: string): Promise<FBPost> {
  const found = mockState.publishedPosts.find((p) => p.id === postId);
  if (found) return found;
  return {
    id: postId,
    created_time: new Date().toISOString(),
    permalink_url: mockPermalink(postId),
  };
}

/**
 * List recent posts from the Page feed.
 */
export async function listPosts(
  _config: FacebookConfig,
  limit: number = 10,
): Promise<{ data: FBPost[] }> {
  return { data: mockState.publishedPosts.slice(0, limit) };
}
