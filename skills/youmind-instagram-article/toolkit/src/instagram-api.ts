/**
 * instagram-api.ts — MOCK IMPLEMENTATION
 *
 * ⚠️ This file is a mock. The skill talks to Instagram exclusively through
 * YouMind's OpenAPI proxy, but YouMind has not yet shipped the Instagram
 * namespace on that OpenAPI. This mock lets the rest of the skill
 * (publisher, CLI) be built and smoke-tested end-to-end right now, without
 * a real backend.
 *
 * IMPORTANT: Instagram uses a TWO-STEP publish flow:
 *   1. Create a media container (createMediaContainer / createCarouselContainer)
 *   2. Wait for Instagram to process the media (getMediaStatus / waitForContainerReady)
 *   3. Publish the container (publishMedia)
 * This mock PRESERVES that flow in its function signatures and return shapes
 * so publisher.ts and the CLI can orchestrate the same way they will against
 * the real backend. The mock skips the async processing step (containers go
 * straight to FINISHED), but the polling/wait helper still exists with the
 * same signature so callers don't have to change.
 *
 * Swap-in plan when the real YouMind endpoints ship:
 *   1. YouMind will expose endpoints whose request/response shape mirrors
 *      Meta's Graph API (same field names like `image_url`, `caption`,
 *      `media_type`, `children`, `creation_id`, same /media and
 *      /media_publish endpoints, same `status_code` enum). The only auth
 *      difference is that YouMind accepts `x-api-key: <youmind_api_key>`
 *      instead of a Facebook page access token — YouMind holds the user's
 *      Instagram/Facebook token server-side and attaches it.
 *   2. Replace each mock function body below with a `fetch()` POST/GET to
 *      the corresponding `https://youmind.com/openapi/v1/instagram/<op>`
 *      using the `x-api-key` header (same helper pattern as youmind-api.ts).
 *      The proxy internally runs the real Graph API two-step flow.
 *   3. waitForContainerReady will likely need to become real polling again
 *      when swapping in, because the real backend WILL return IN_PROGRESS
 *      while Instagram processes the media. The signature stays the same.
 *   4. Keep the exported type signatures stable — they ARE the swap-in
 *      contract. Nothing in publisher.ts / cli.ts should need to change.
 *   5. Delete the `mockState`, `initMockState`, and the helper builders
 *      at that point.
 *
 * loadInstagramConfig is NOT mocked — it reads real config the same way as
 * youmind-api.ts, because users will set their YouMind API key through the
 * normal config flow even before the Instagram endpoints exist.
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

// ---------------------------------------------------------------------------
// Public types — stable contract (do NOT change signatures when swapping to
// real HTTP; only the function bodies below should change).
// ---------------------------------------------------------------------------

export interface InstagramConfig {
  apiKey: string;
  baseUrl: string;
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

export function loadInstagramConfig(): InstagramConfig {
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
  containerCounter: number;
  mediaCounter: number;
  containersById: Map<string, IGContainer>;
  publishedMedia: IGMedia[];
}

function initMockState(): MockState {
  return {
    containerCounter: 0,
    mediaCounter: 0,
    containersById: new Map<string, IGContainer>(),
    publishedMedia: [],
  };
}

const mockState: MockState = initMockState();

// ---------------------------------------------------------------------------
// Public API — Container Creation (Step 1 of two-step publish)
// ---------------------------------------------------------------------------

/**
 * Create a media container for a single image post.
 *
 * In the real backend the container starts as IN_PROGRESS while Instagram
 * downloads and processes the image. The mock skips that and marks the
 * container FINISHED immediately so the rest of the flow can proceed.
 */
export async function createMediaContainer(
  _config: InstagramConfig,
  options: CreateMediaOptions,
): Promise<IGContainer> {
  mockState.containerCounter += 1;
  const id = `mock_ig_container_${mockState.containerCounter}`;

  const container: IGContainer = {
    id,
    status_code: 'FINISHED',
    caption: options.caption,
    media_type: options.media_type ?? (options.is_carousel_item ? 'IMAGE' : 'IMAGE'),
    image_url: options.image_url,
    is_carousel_item: options.is_carousel_item ?? false,
    children: options.children,
  };
  mockState.containersById.set(id, container);
  return container;
}

/**
 * Create a carousel container from child container IDs.
 *
 * Each child must have been created with is_carousel_item: true.
 * Carousels support 2-10 images.
 */
export async function createCarouselContainer(
  _config: InstagramConfig,
  childrenIds: string[],
  caption?: string,
): Promise<IGContainer> {
  if (childrenIds.length < 2) {
    throw new Error('Carousels require at least 2 images.');
  }
  if (childrenIds.length > 10) {
    throw new Error('Carousels support a maximum of 10 images.');
  }

  mockState.containerCounter += 1;
  const id = `mock_ig_container_${mockState.containerCounter}`;

  const container: IGContainer = {
    id,
    status_code: 'FINISHED',
    media_type: 'CAROUSEL',
    children: childrenIds,
    caption,
  };
  mockState.containersById.set(id, container);
  return container;
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
 * - PUBLISHED: Already published
 * - ERROR: Processing failed
 * - EXPIRED: Container expired (24 hours)
 *
 * In the mock, containers are marked FINISHED at creation time, so this
 * just looks up the stored container. If the container is unknown the mock
 * fabricates a FINISHED entry so unfamiliar IDs don't crash callers.
 */
export async function getMediaStatus(
  _config: InstagramConfig,
  containerId: string,
): Promise<IGContainer> {
  const found = mockState.containersById.get(containerId);
  if (found) return found;
  const fallback: IGContainer = {
    id: containerId,
    status_code: 'FINISHED',
  };
  return fallback;
}

/**
 * Poll a container's status until it reaches FINISHED or fails.
 *
 * In the mock the container is already FINISHED at creation time, so this
 * resolves immediately without sleeping. The signature is preserved so the
 * real swap-in (which WILL need to poll Instagram's processing status) is a
 * drop-in replacement of just the function body.
 *
 * @param config - Instagram API config
 * @param containerId - The container ID to poll
 * @param maxWaitMs - Maximum wait time in ms (default: 60000)
 * @param intervalMs - Poll interval in ms (default: 3000)
 * @returns The container with FINISHED status
 * @throws If the container errored or expired
 */
export async function waitForContainerReady(
  config: InstagramConfig,
  containerId: string,
  _maxWaitMs: number = 60_000,
  _intervalMs: number = 3_000,
): Promise<IGContainer> {
  const status = await getMediaStatus(config, containerId);

  switch (status.status_code) {
    case 'FINISHED':
    case 'PUBLISHED':
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

    default:
      // In a real backend we'd loop here. The mock has nothing to wait for.
      return status;
  }
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
  _config: InstagramConfig,
  containerId: string,
): Promise<IGMedia> {
  const container = mockState.containersById.get(containerId);
  mockState.mediaCounter += 1;
  const n = mockState.mediaCounter;
  const id = `mock_ig_media_${Date.now()}_${n}`;

  const isCarousel = container?.media_type === 'CAROUSEL';
  const media: IGMedia = {
    id,
    caption: (container?.caption as string | undefined),
    media_type: isCarousel ? 'CAROUSEL_ALBUM' : 'IMAGE',
    media_url: (container?.image_url as string | undefined),
    permalink: `https://instagram.com/p/mock_${n}/`,
    timestamp: new Date().toISOString(),
  };
  mockState.publishedMedia.unshift(media);

  if (container) {
    container.status_code = 'PUBLISHED';
  }

  return media;
}

// ---------------------------------------------------------------------------
// Public API — Read
// ---------------------------------------------------------------------------

/**
 * Get Instagram Business Account information.
 */
export async function getAccountInfo(_config: InstagramConfig): Promise<IGAccount> {
  return {
    id: 'mock_ig_account',
    username: 'mock_user',
    media_count: mockState.publishedMedia.length,
  };
}

/**
 * List recent media from the Instagram account.
 */
export async function listMedia(
  _config: InstagramConfig,
  limit: number = 10,
): Promise<{ data: IGMedia[] }> {
  return { data: mockState.publishedMedia.slice(0, limit) };
}

/**
 * Get a specific media item by ID.
 */
export async function getMedia(
  _config: InstagramConfig,
  mediaId: string,
): Promise<IGMedia> {
  const found = mockState.publishedMedia.find((m) => m.id === mediaId);
  if (found) return found;
  return {
    id: mediaId,
    media_type: 'IMAGE',
    permalink: `https://instagram.com/p/mock_${mediaId}/`,
    timestamp: new Date().toISOString(),
  };
}
