/**
 * Medium Publishing API wrapper.
 *
 * NOTE: Medium's Publishing API is officially deprecated but still functional.
 * It only supports:
 *   - GET /me (authenticated user info)
 *   - GET /users/{userId}/publications
 *   - POST /users/{authorId}/posts (create post on user profile)
 *   - POST /publications/{publicationId}/posts (create post on publication)
 *
 * There are NO endpoints for updating, deleting, or listing posts.
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_DIR = resolve(__dirname, '../..');

export interface MediumConfig {
  token: string;
  publicationId?: string;
}

interface FullConfig {
  medium: MediumConfig;
  youmind: { api_key?: string; base_url?: string };
}

function loadCentralCredentials(): Record<string, unknown> {
  const home = process.env.HOME || process.env.USERPROFILE || '';
  const p = resolve(home, '.youmind-skill', 'credentials.yaml');
  if (existsSync(p)) {
    return parseYaml(readFileSync(p, 'utf-8')) ?? {};
  }
  return {};
}

export function loadConfig(): FullConfig {
  const central = loadCentralCredentials();
  let local: Record<string, unknown> = {};
  for (const name of ['config.yaml', 'config.example.yaml']) {
    const p = resolve(PROJECT_DIR, name);
    if (existsSync(p)) {
      local = parseYaml(readFileSync(p, 'utf-8')) ?? {};
      break;
    }
  }
  const medium = { ...(central.medium as Record<string, unknown> ?? {}), ...(local.medium as Record<string, unknown> ?? {}) };
  const youmind = { ...(central.youmind as Record<string, unknown> ?? {}), ...(local.youmind as Record<string, unknown> ?? {}) };
  return {
    medium: {
      token: (medium.token as string) || process.env.MEDIUM_TOKEN || '',
      publicationId: (medium.publication_id as string) || '',
    },
    youmind: youmind as FullConfig['youmind'],
  };
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MediumUser {
  id: string;
  username: string;
  name: string;
  url: string;
  imageUrl: string;
}

export interface MediumPublication {
  id: string;
  name: string;
  description: string;
  url: string;
  imageUrl: string;
}

export interface MediumPost {
  id: string;
  title: string;
  authorId: string;
  tags: string[];
  url: string;
  canonicalUrl: string;
  publishStatus: 'public' | 'draft' | 'unlisted';
  publishedAt: number;
  license: string;
  licenseUrl: string;
  publicationId?: string;
}

export interface CreatePostOptions {
  /** Article title */
  title: string;
  /** Content format: "html" or "markdown" */
  contentFormat: 'html' | 'markdown';
  /** Article body in the specified format */
  content: string;
  /** Up to 5 tags */
  tags?: string[];
  /** Original URL if cross-posting */
  canonicalUrl?: string;
  /** Publish status: "public", "draft", or "unlisted" */
  publishStatus?: 'public' | 'draft' | 'unlisted';
}

// ---------------------------------------------------------------------------
// API base URL
// ---------------------------------------------------------------------------

const MEDIUM_API_BASE = 'https://api.medium.com/v1';

// ---------------------------------------------------------------------------
// HTTP helper
// ---------------------------------------------------------------------------

interface MediumApiResponse<T> {
  data: T;
}

interface MediumApiError {
  errors: Array<{ message: string; code: number }>;
}

async function mediumFetch<T>(
  token: string,
  method: 'GET' | 'POST',
  path: string,
  body?: Record<string, unknown>,
): Promise<T> {
  if (!token) {
    throw new Error(
      'Medium integration token is required. Set medium.token in config.yaml or MEDIUM_TOKEN env var.',
    );
  }

  const url = `${MEDIUM_API_BASE}${path}`;
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json',
  };

  const init: RequestInit = {
    method,
    headers,
    signal: AbortSignal.timeout(30_000),
  };

  if (body && method === 'POST') {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }

  const resp = await fetch(url, init);

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    let errorMessage = `Medium API ${method} ${path} failed (${resp.status})`;

    try {
      const errorBody = JSON.parse(text) as MediumApiError;
      if (errorBody.errors?.length) {
        errorMessage += `: ${errorBody.errors.map(e => e.message).join(', ')}`;
      }
    } catch {
      if (text) {
        errorMessage += `: ${text.slice(0, 300)}`;
      }
    }

    throw new Error(errorMessage);
  }

  const json = (await resp.json()) as MediumApiResponse<T>;
  return json.data;
}

// ---------------------------------------------------------------------------
// Public API — Get Authenticated User
// ---------------------------------------------------------------------------

/**
 * Get the authenticated user's profile.
 * GET /v1/me
 */
export async function getUser(token: string): Promise<MediumUser> {
  return mediumFetch<MediumUser>(token, 'GET', '/me');
}

// ---------------------------------------------------------------------------
// Public API — Get User's Publications
// ---------------------------------------------------------------------------

/**
 * Get publications the user is a member of.
 * GET /v1/users/{userId}/publications
 */
export async function getUserPublications(
  token: string,
  userId: string,
): Promise<MediumPublication[]> {
  return mediumFetch<MediumPublication[]>(token, 'GET', `/users/${userId}/publications`);
}

// ---------------------------------------------------------------------------
// Public API — Create Post (User Profile)
// ---------------------------------------------------------------------------

/**
 * Create a new post on the user's profile.
 * POST /v1/users/{authorId}/posts
 *
 * NOTE: This is a one-way operation. Once created, the post cannot be
 * updated or deleted via the API. Edits must be made through the
 * Medium web interface.
 */
export async function createPost(
  token: string,
  authorId: string,
  options: CreatePostOptions,
): Promise<MediumPost> {
  const body: Record<string, unknown> = {
    title: options.title,
    contentFormat: options.contentFormat,
    content: options.content,
  };

  if (options.tags?.length) {
    body.tags = options.tags.slice(0, 5);
  }
  if (options.canonicalUrl) {
    body.canonicalUrl = options.canonicalUrl;
  }
  if (options.publishStatus) {
    body.publishStatus = options.publishStatus;
  }

  return mediumFetch<MediumPost>(token, 'POST', `/users/${authorId}/posts`, body);
}

// ---------------------------------------------------------------------------
// Public API — Create Post (Publication)
// ---------------------------------------------------------------------------

/**
 * Create a new post under a publication.
 * POST /v1/publications/{publicationId}/posts
 *
 * The authenticated user must be a writer for the publication.
 *
 * NOTE: Same as createPost — one-way operation, no updates/deletes via API.
 */
export async function createPublicationPost(
  token: string,
  publicationId: string,
  options: CreatePostOptions,
): Promise<MediumPost> {
  const body: Record<string, unknown> = {
    title: options.title,
    contentFormat: options.contentFormat,
    content: options.content,
  };

  if (options.tags?.length) {
    body.tags = options.tags.slice(0, 5);
  }
  if (options.canonicalUrl) {
    body.canonicalUrl = options.canonicalUrl;
  }
  if (options.publishStatus) {
    body.publishStatus = options.publishStatus;
  }

  return mediumFetch<MediumPost>(
    token,
    'POST',
    `/publications/${publicationId}/posts`,
    body,
  );
}
