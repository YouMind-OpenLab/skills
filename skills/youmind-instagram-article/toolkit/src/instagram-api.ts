/**
 * Instagram Graph API wrapper for media publishing.
 *
 * Instagram publishing is done through the Facebook Graph API and uses a
 * TWO-STEP publish flow:
 *   1. Create a media container (POST /{ig_user_id}/media)
 *   2. Publish the container (POST /{ig_user_id}/media_publish)
 *
 * For carousels:
 *   1. Create child containers for each image (is_carousel_item: true)
 *   2. Create a carousel container referencing the children
 *   3. Publish the carousel container
 *
 * IMPORTANT: Instagram REQUIRES images for every post. Text-only posting
 * is NOT possible. All image URLs must be publicly accessible.
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';
import fetch from 'node-fetch';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface InstagramConfig {
  businessAccountId: string;
  accessToken: string;
}

export interface IGMedia {
  id: string;
  caption?: string;
  media_type?: string;
  media_url?: string;
  permalink?: string;
  timestamp?: string;
  [key: string]: unknown;
}

export interface IGContainer {
  id: string;
  status_code?: 'EXPIRED' | 'ERROR' | 'FINISHED' | 'IN_PROGRESS' | 'PUBLISHED';
  [key: string]: unknown;
}

export interface IGAccount {
  id: string;
  username?: string;
  media_count?: number;
  [key: string]: unknown;
}

export interface CreateMediaOptions {
  /** Publicly accessible image URL (REQUIRED for single image) */
  image_url?: string;
  /** Post caption (max 2,200 characters) */
  caption?: string;
  /** Set true when creating a child item for a carousel */
  is_carousel_item?: boolean;
  /** Media type for carousel container */
  media_type?: 'CAROUSEL';
  /** Array of child container IDs for carousel */
  children?: string[];
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_DIR = resolve(__dirname, '../..');

const GRAPH_API_BASE = 'https://graph.facebook.com/v19.0';

function loadCentralCredentials(): Record<string, unknown> {
  const home = process.env.HOME || process.env.USERPROFILE || '';
  const p = resolve(home, '.youmind-skill', 'credentials.yaml');
  if (existsSync(p)) {
    return parseYaml(readFileSync(p, 'utf-8')) ?? {};
  }
  return {};
}

export function loadInstagramConfig(): InstagramConfig {
  const central = loadCentralCredentials();
  let local: Record<string, unknown> = {};
  for (const name of ['config.yaml', 'config.example.yaml']) {
    const p = resolve(PROJECT_DIR, name);
    if (existsSync(p)) {
      local = parseYaml(readFileSync(p, 'utf-8')) ?? {};
      break;
    }
  }
  const ig = { ...(central.instagram as Record<string, unknown> ?? {}), ...(local.instagram as Record<string, unknown> ?? {}) };
  for (const [k, v] of Object.entries(ig)) {
    if (v === '' && (central.instagram as Record<string, unknown>)?.[k]) {
      ig[k] = (central.instagram as Record<string, unknown>)[k];
    }
  }
  return {
    businessAccountId: (ig.business_account_id as string) || '',
    accessToken: (ig.access_token as string) || '',
  };
}

function validateConfig(config: InstagramConfig): void {
  if (!config.businessAccountId) {
    throw new Error(
      'Instagram Business Account ID not configured. Set instagram.business_account_id in config.yaml.',
    );
  }
  if (!config.accessToken) {
    throw new Error(
      'Instagram Access Token not configured. Set instagram.access_token in config.yaml.',
    );
  }
}

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

async function graphGet<T = unknown>(
  path: string,
  params: Record<string, string> = {},
  config: InstagramConfig,
): Promise<T> {
  validateConfig(config);

  const url = new URL(`${GRAPH_API_BASE}${path}`);
  url.searchParams.set('access_token', config.accessToken);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const resp = await fetch(url.toString(), {
    method: 'GET',
    signal: AbortSignal.timeout(15_000),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`Instagram Graph API GET ${path} failed (${resp.status}): ${text.slice(0, 500)}`);
  }

  return resp.json() as Promise<T>;
}

async function graphPost<T = unknown>(
  path: string,
  params: Record<string, string>,
  config: InstagramConfig,
): Promise<T> {
  validateConfig(config);

  // Instagram Graph API uses query parameters for POST requests, not JSON body
  const url = new URL(`${GRAPH_API_BASE}${path}`);
  url.searchParams.set('access_token', config.accessToken);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const resp = await fetch(url.toString(), {
    method: 'POST',
    signal: AbortSignal.timeout(30_000),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`Instagram Graph API POST ${path} failed (${resp.status}): ${text.slice(0, 500)}`);
  }

  return resp.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Public API — Container Creation (Step 1 of two-step publish)
// ---------------------------------------------------------------------------

/**
 * Create a media container for a single image post.
 *
 * The image_url must be publicly accessible. Instagram will download it
 * during processing.
 */
export async function createMediaContainer(
  config: InstagramConfig,
  options: CreateMediaOptions,
): Promise<IGContainer> {
  const params: Record<string, string> = {};

  if (options.image_url) {
    params.image_url = options.image_url;
  }
  if (options.caption) {
    params.caption = options.caption;
  }
  if (options.is_carousel_item) {
    params.is_carousel_item = 'true';
  }
  if (options.media_type === 'CAROUSEL') {
    params.media_type = 'CAROUSEL';
  }
  if (options.children?.length) {
    params.children = options.children.join(',');
  }

  return graphPost<IGContainer>(
    `/${config.businessAccountId}/media`,
    params,
    config,
  );
}

/**
 * Create a carousel container from child container IDs.
 *
 * Each child must have been created with is_carousel_item: true.
 * Carousels support 2-10 images.
 */
export async function createCarouselContainer(
  config: InstagramConfig,
  childrenIds: string[],
  caption?: string,
): Promise<IGContainer> {
  if (childrenIds.length < 2) {
    throw new Error('Carousels require at least 2 images.');
  }
  if (childrenIds.length > 10) {
    throw new Error('Carousels support a maximum of 10 images.');
  }

  const params: Record<string, string> = {
    media_type: 'CAROUSEL',
    children: childrenIds.join(','),
  };

  if (caption) {
    params.caption = caption;
  }

  return graphPost<IGContainer>(
    `/${config.businessAccountId}/media`,
    params,
    config,
  );
}

// ---------------------------------------------------------------------------
// Public API — Status Polling
// ---------------------------------------------------------------------------

/**
 * Check the processing status of a media container.
 *
 * Returns status_code which can be:
 * - IN_PROGRESS: Still processing
 * - FINISHED: Ready to publish
 * - ERROR: Processing failed
 * - EXPIRED: Container expired (24 hours)
 */
export async function getMediaStatus(
  config: InstagramConfig,
  containerId: string,
): Promise<IGContainer> {
  return graphGet<IGContainer>(
    `/${containerId}`,
    { fields: 'id,status_code' },
    config,
  );
}

/**
 * Poll a container's status until it reaches FINISHED or fails.
 *
 * @param config - Instagram API config
 * @param containerId - The container ID to poll
 * @param maxWaitMs - Maximum wait time in ms (default: 60000)
 * @param intervalMs - Poll interval in ms (default: 3000)
 * @returns The container with FINISHED status
 * @throws If the container errors, expires, or times out
 */
export async function waitForContainerReady(
  config: InstagramConfig,
  containerId: string,
  maxWaitMs: number = 60_000,
  intervalMs: number = 3_000,
): Promise<IGContainer> {
  const start = Date.now();

  while (Date.now() - start < maxWaitMs) {
    const status = await getMediaStatus(config, containerId);

    switch (status.status_code) {
      case 'FINISHED':
        return status;

      case 'ERROR':
        throw new Error(
          `Instagram media container ${containerId} failed processing. ` +
          `Check that the image URL is publicly accessible and meets Instagram requirements.`,
        );

      case 'EXPIRED':
        throw new Error(
          `Instagram media container ${containerId} expired. ` +
          `Containers must be published within 24 hours of creation.`,
        );

      case 'IN_PROGRESS':
      default:
        // Still processing, wait and retry
        await new Promise(r => setTimeout(r, intervalMs));
        break;
    }
  }

  throw new Error(
    `Instagram media container ${containerId} processing timed out after ${maxWaitMs / 1000}s. ` +
    `You can check status later with: npx tsx src/cli.ts status ${containerId}`,
  );
}

// ---------------------------------------------------------------------------
// Public API — Publishing (Step 2 of two-step publish)
// ---------------------------------------------------------------------------

/**
 * Publish a processed media container to Instagram.
 *
 * The container must have status_code FINISHED before publishing.
 */
export async function publishMedia(
  config: InstagramConfig,
  containerId: string,
): Promise<IGMedia> {
  return graphPost<IGMedia>(
    `/${config.businessAccountId}/media_publish`,
    { creation_id: containerId },
    config,
  );
}

// ---------------------------------------------------------------------------
// Public API — Read
// ---------------------------------------------------------------------------

/**
 * Get Instagram Business Account information.
 */
export async function getAccountInfo(config: InstagramConfig): Promise<IGAccount> {
  return graphGet<IGAccount>(
    `/${config.businessAccountId}`,
    { fields: 'id,username,media_count' },
    config,
  );
}

/**
 * List recent media from the Instagram account.
 */
export async function listMedia(
  config: InstagramConfig,
  limit: number = 10,
): Promise<{ data: IGMedia[] }> {
  return graphGet<{ data: IGMedia[] }>(
    `/${config.businessAccountId}/media`,
    {
      fields: 'id,caption,media_type,media_url,permalink,timestamp',
      limit: String(limit),
    },
    config,
  );
}

/**
 * Get a specific media item by ID.
 */
export async function getMedia(
  config: InstagramConfig,
  mediaId: string,
): Promise<IGMedia> {
  return graphGet<IGMedia>(
    `/${mediaId}`,
    { fields: 'id,caption,media_type,media_url,permalink,timestamp' },
    config,
  );
}
