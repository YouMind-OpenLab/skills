/**
 * Ghost Admin API wrapper.
 *
 * Uses JWT authentication (generated via jwt-helper.ts).
 * Base URL: {site_url}/ghost/api/admin/
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';
import { generateToken } from './jwt-helper.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

export interface GhostTag {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  feature_image: string | null;
  visibility: string;
  [key: string]: unknown;
}

export interface GhostImage {
  url: string;
  ref: string | null;
}

export interface GhostConfig {
  siteUrl: string;
  adminApiKey: string;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_DIR = resolve(__dirname, '../..');

function loadCentralCredentials(): Record<string, unknown> {
  const home = process.env.HOME || process.env.USERPROFILE || '';
  const p = resolve(home, '.youmind-skill', 'credentials.yaml');
  if (existsSync(p)) {
    return parseYaml(readFileSync(p, 'utf-8')) ?? {};
  }
  return {};
}

export function loadGhostConfig(): GhostConfig {
  const central = loadCentralCredentials();
  let local: Record<string, unknown> = {};
  for (const name of ['config.yaml', 'config.example.yaml']) {
    const p = resolve(PROJECT_DIR, name);
    if (existsSync(p)) {
      local = parseYaml(readFileSync(p, 'utf-8')) ?? {};
      break;
    }
  }
  const ghost = { ...(central.ghost as Record<string, unknown> ?? {}), ...(local.ghost as Record<string, unknown> ?? {}) };
  return {
    siteUrl: ((ghost.site_url as string) || '').replace(/\/+$/, ''),
    adminApiKey: (ghost.admin_api_key as string) || '',
  };
}

// ---------------------------------------------------------------------------
// HTTP helper
// ---------------------------------------------------------------------------

function getBaseUrl(config: GhostConfig): string {
  return `${config.siteUrl}/ghost/api/admin`;
}

async function ghostFetch<T = unknown>(
  config: GhostConfig,
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  if (!config.siteUrl) {
    throw new Error('Ghost site_url not configured. Set ghost.site_url in config.yaml.');
  }
  if (!config.adminApiKey) {
    throw new Error('Ghost admin_api_key not configured. Set ghost.admin_api_key in config.yaml.');
  }

  // Generate JWT token (cached for 4 minutes)
  const token = generateToken(config.adminApiKey);

  const url = `${getBaseUrl(config)}${endpoint}`;
  const headers: Record<string, string> = {
    'Authorization': `Ghost ${token}`,
    ...(options.headers as Record<string, string> || {}),
  };

  // Only set Content-Type for non-FormData bodies
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const resp = await fetch(url, {
    ...options,
    headers,
    signal: AbortSignal.timeout(30_000),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`Ghost API ${endpoint} failed (${resp.status}): ${text.slice(0, 500)}`);
  }

  return resp.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Posts
// ---------------------------------------------------------------------------

interface PostsResponse {
  posts: GhostPost[];
  meta?: { pagination?: { page: number; limit: number; pages: number; total: number } };
}

export async function createPost(
  config: GhostConfig,
  options: CreatePostOptions,
): Promise<GhostPost> {
  const resp = await ghostFetch<PostsResponse>(config, '/posts/?source=html', {
    method: 'POST',
    body: JSON.stringify({ posts: [options] }),
  });
  return resp.posts[0];
}

export async function updatePost(
  config: GhostConfig,
  postId: string,
  options: Partial<CreatePostOptions> & { updated_at: string },
): Promise<GhostPost> {
  const resp = await ghostFetch<PostsResponse>(config, `/posts/${postId}/?source=html`, {
    method: 'PUT',
    body: JSON.stringify({ posts: [options] }),
  });
  return resp.posts[0];
}

export async function getPost(
  config: GhostConfig,
  postId: string,
): Promise<GhostPost> {
  const resp = await ghostFetch<PostsResponse>(config, `/posts/${postId}/`, {
    method: 'GET',
  });
  return resp.posts[0];
}

export async function listPosts(
  config: GhostConfig,
  page = 1,
  limit = 15,
): Promise<{ posts: GhostPost[]; total: number }> {
  const resp = await ghostFetch<PostsResponse>(
    config,
    `/posts/?page=${page}&limit=${limit}&order=published_at%20desc&include=tags`,
    { method: 'GET' },
  );
  return {
    posts: resp.posts,
    total: resp.meta?.pagination?.total ?? resp.posts.length,
  };
}

// ---------------------------------------------------------------------------
// Images
// ---------------------------------------------------------------------------

export async function uploadImage(
  config: GhostConfig,
  filePath: string,
): Promise<GhostImage> {
  if (!config.siteUrl) {
    throw new Error('Ghost site_url not configured. Set ghost.site_url in config.yaml.');
  }
  if (!config.adminApiKey) {
    throw new Error('Ghost admin_api_key not configured. Set ghost.admin_api_key in config.yaml.');
  }

  const token = generateToken(config.adminApiKey);
  const buffer = readFileSync(filePath);
  const name = basename(filePath);
  const ext = name.split('.').pop()?.toLowerCase() || 'jpg';

  const mimeMap: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
  };

  const blob = new Blob([buffer], { type: mimeMap[ext] || 'image/jpeg' });
  const formData = new FormData();
  formData.append('file', blob, name);
  formData.append('purpose', 'image');

  const url = `${getBaseUrl(config)}/images/upload/`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Ghost ${token}`,
    },
    body: formData,
    signal: AbortSignal.timeout(60_000),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`Ghost image upload failed (${resp.status}): ${text.slice(0, 500)}`);
  }

  const data = await resp.json() as { images: GhostImage[] };
  return data.images[0];
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export async function validateConnection(config: GhostConfig): Promise<{ ok: boolean; message: string }> {
  try {
    const result = await listPosts(config, 1, 1);
    return {
      ok: true,
      message: `Connected to ${config.siteUrl}. Found ${result.total} total post(s). API is working.`,
    };
  } catch (e) {
    return {
      ok: false,
      message: `Connection failed: ${(e as Error).message}`,
    };
  }
}
