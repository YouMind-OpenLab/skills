/**
 * Facebook Graph API wrapper for Page post management.
 *
 * Handles text posts, link posts, photo posts, and page info retrieval
 * via the Facebook Graph API v19.0.
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';
import fetch from 'node-fetch';
import FormData from 'form-data';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FacebookConfig {
  pageId: string;
  pageAccessToken: string;
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
// Config
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_DIR = resolve(__dirname, '../..');

const GRAPH_API_BASE = 'https://graph.facebook.com/v19.0';

export function loadFacebookConfig(): FacebookConfig {
  for (const name of ['config.yaml', 'config.example.yaml']) {
    const p = resolve(PROJECT_DIR, name);
    if (existsSync(p)) {
      const raw = parseYaml(readFileSync(p, 'utf-8')) ?? {};
      const fb = raw.facebook ?? {};
      return {
        pageId: fb.page_id || '',
        pageAccessToken: fb.page_access_token || '',
      };
    }
  }
  return { pageId: '', pageAccessToken: '' };
}

function validateConfig(config: FacebookConfig): void {
  if (!config.pageId) {
    throw new Error('Facebook Page ID not configured. Set facebook.page_id in config.yaml.');
  }
  if (!config.pageAccessToken) {
    throw new Error('Facebook Page Access Token not configured. Set facebook.page_access_token in config.yaml.');
  }
}

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

async function graphGet<T = unknown>(
  path: string,
  params: Record<string, string> = {},
  config: FacebookConfig,
): Promise<T> {
  validateConfig(config);

  const url = new URL(`${GRAPH_API_BASE}${path}`);
  url.searchParams.set('access_token', config.pageAccessToken);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const resp = await fetch(url.toString(), {
    method: 'GET',
    signal: AbortSignal.timeout(15_000),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`Facebook Graph API GET ${path} failed (${resp.status}): ${text.slice(0, 500)}`);
  }

  return resp.json() as Promise<T>;
}

async function graphPost<T = unknown>(
  path: string,
  body: Record<string, unknown>,
  config: FacebookConfig,
): Promise<T> {
  validateConfig(config);

  const url = new URL(`${GRAPH_API_BASE}${path}`);
  url.searchParams.set('access_token', config.pageAccessToken);

  const resp = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`Facebook Graph API POST ${path} failed (${resp.status}): ${text.slice(0, 500)}`);
  }

  return resp.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Public API — Posts
// ---------------------------------------------------------------------------

/**
 * Create a text or link post on a Facebook Page.
 */
export async function createPost(
  config: FacebookConfig,
  message: string,
  options?: CreatePostOptions,
): Promise<CreatePostResult> {
  const body: Record<string, unknown> = { message };

  if (options?.link) {
    body.link = options.link;
  }
  if (options?.published === false) {
    body.published = false;
  }
  if (options?.scheduled_publish_time) {
    body.published = false;
    body.scheduled_publish_time = options.scheduled_publish_time;
  }

  return graphPost<CreatePostResult>(`/${config.pageId}/feed`, body, config);
}

/**
 * Create a photo post on a Facebook Page using a hosted image URL.
 */
export async function createPhotoPost(
  config: FacebookConfig,
  photoUrl: string,
  caption?: string,
): Promise<FBPhoto> {
  const body: Record<string, unknown> = { url: photoUrl };
  if (caption) {
    body.caption = caption;
  }

  return graphPost<FBPhoto>(`/${config.pageId}/photos`, body, config);
}

/**
 * Upload a photo to Facebook (unpublished, for staging).
 * Returns a photo ID that can be attached to a post.
 */
export async function uploadPhoto(
  config: FacebookConfig,
  imageBuffer: Buffer,
  filename: string,
): Promise<FBPhoto> {
  validateConfig(config);

  const url = new URL(`${GRAPH_API_BASE}/${config.pageId}/photos`);
  url.searchParams.set('access_token', config.pageAccessToken);

  const form = new FormData();
  form.append('source', imageBuffer, { filename, contentType: 'image/jpeg' });
  form.append('published', 'false');

  const resp = await fetch(url.toString(), {
    method: 'POST',
    body: form,
    signal: AbortSignal.timeout(60_000),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`Facebook photo upload failed (${resp.status}): ${text.slice(0, 500)}`);
  }

  return resp.json() as Promise<FBPhoto>;
}

// ---------------------------------------------------------------------------
// Public API — Read
// ---------------------------------------------------------------------------

/**
 * Get information about the Facebook Page.
 */
export async function getPageInfo(config: FacebookConfig): Promise<FBPage> {
  return graphGet<FBPage>(
    `/${config.pageId}`,
    { fields: 'name,id,fan_count' },
    config,
  );
}

/**
 * Get a specific post by ID.
 */
export async function getPost(config: FacebookConfig, postId: string): Promise<FBPost> {
  return graphGet<FBPost>(
    `/${postId}`,
    { fields: 'message,created_time,permalink_url,full_picture,type' },
    config,
  );
}

/**
 * List recent posts from the Page feed.
 */
export async function listPosts(
  config: FacebookConfig,
  limit: number = 10,
): Promise<{ data: FBPost[] }> {
  return graphGet<{ data: FBPost[] }>(
    `/${config.pageId}/feed`,
    {
      fields: 'message,created_time,permalink_url,type',
      limit: String(limit),
    },
    config,
  );
}
