/**
 * WordPress REST API wrapper.
 *
 * Uses Basic Auth with Application Passwords (WordPress 5.6+).
 * Base URL: {site_url}/wp-json/wp/v2/
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

export interface WordPressConfig {
  siteUrl: string;
  username: string;
  appPassword: string;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_DIR = resolve(__dirname, '../..');

export function loadWordPressConfig(): WordPressConfig {
  for (const name of ['config.yaml', 'config.example.yaml']) {
    const p = resolve(PROJECT_DIR, name);
    if (existsSync(p)) {
      const raw = parseYaml(readFileSync(p, 'utf-8')) ?? {};
      const wp = raw.wordpress ?? {};
      return {
        siteUrl: (wp.site_url || '').replace(/\/+$/, ''),
        username: wp.username || '',
        appPassword: wp.app_password || '',
      };
    }
  }
  return { siteUrl: '', username: '', appPassword: '' };
}

// ---------------------------------------------------------------------------
// HTTP helper
// ---------------------------------------------------------------------------

function getAuthHeader(config: WordPressConfig): string {
  const credentials = `${config.username}:${config.appPassword}`;
  const encoded = Buffer.from(credentials).toString('base64');
  return `Basic ${encoded}`;
}

function getBaseUrl(config: WordPressConfig): string {
  return `${config.siteUrl}/wp-json/wp/v2`;
}

async function wpFetch<T = unknown>(
  config: WordPressConfig,
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  if (!config.siteUrl) {
    throw new Error('WordPress site_url not configured. Set wordpress.site_url in config.yaml.');
  }
  if (!config.username || !config.appPassword) {
    throw new Error('WordPress credentials not configured. Set wordpress.username and wordpress.app_password in config.yaml.');
  }

  const url = `${getBaseUrl(config)}${endpoint}`;
  const headers: Record<string, string> = {
    'Authorization': getAuthHeader(config),
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
    throw new Error(`WordPress API ${endpoint} failed (${resp.status}): ${text.slice(0, 500)}`);
  }

  return resp.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Posts
// ---------------------------------------------------------------------------

export async function createPost(
  config: WordPressConfig,
  options: CreatePostOptions,
): Promise<WPPost> {
  return wpFetch<WPPost>(config, '/posts', {
    method: 'POST',
    body: JSON.stringify(options),
  });
}

export async function updatePost(
  config: WordPressConfig,
  postId: number,
  options: Partial<CreatePostOptions>,
): Promise<WPPost> {
  return wpFetch<WPPost>(config, `/posts/${postId}`, {
    method: 'PUT',
    body: JSON.stringify(options),
  });
}

export async function getPost(
  config: WordPressConfig,
  postId: number,
): Promise<WPPost> {
  return wpFetch<WPPost>(config, `/posts/${postId}`, {
    method: 'GET',
  });
}

export async function listPosts(
  config: WordPressConfig,
  page = 1,
  perPage = 10,
): Promise<WPPost[]> {
  return wpFetch<WPPost[]>(config, `/posts?page=${page}&per_page=${perPage}&orderby=date&order=desc`, {
    method: 'GET',
  });
}

// ---------------------------------------------------------------------------
// Media
// ---------------------------------------------------------------------------

export async function uploadMedia(
  config: WordPressConfig,
  filePath: string,
  filename?: string,
): Promise<WPMedia> {
  const buffer = readFileSync(filePath);
  const name = filename || basename(filePath);
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

  const blob = new Blob([buffer], { type: mimeMap[ext] || 'application/octet-stream' });
  const formData = new FormData();
  formData.append('file', blob, name);

  if (!config.siteUrl) {
    throw new Error('WordPress site_url not configured. Set wordpress.site_url in config.yaml.');
  }

  const url = `${getBaseUrl(config)}/media`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': getAuthHeader(config),
    },
    body: formData,
    signal: AbortSignal.timeout(60_000),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`WordPress media upload failed (${resp.status}): ${text.slice(0, 500)}`);
  }

  return resp.json() as Promise<WPMedia>;
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export async function listCategories(
  config: WordPressConfig,
): Promise<WPCategory[]> {
  return wpFetch<WPCategory[]>(config, '/categories?per_page=100', {
    method: 'GET',
  });
}

// ---------------------------------------------------------------------------
// Tags
// ---------------------------------------------------------------------------

export async function listTags(
  config: WordPressConfig,
): Promise<WPTag[]> {
  return wpFetch<WPTag[]>(config, '/tags?per_page=100', {
    method: 'GET',
  });
}

export async function createTag(
  config: WordPressConfig,
  name: string,
): Promise<WPTag> {
  return wpFetch<WPTag>(config, '/tags', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export async function validateConnection(config: WordPressConfig): Promise<{ ok: boolean; message: string }> {
  try {
    const posts = await listPosts(config, 1, 1);
    return {
      ok: true,
      message: `Connected to ${config.siteUrl}. Found ${Array.isArray(posts) ? posts.length : 0} post(s). API is working.`,
    };
  } catch (e) {
    return {
      ok: false,
      message: `Connection failed: ${(e as Error).message}`,
    };
  }
}
