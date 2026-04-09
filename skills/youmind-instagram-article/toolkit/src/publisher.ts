/**
 * Instagram publisher — high-level publishing orchestration.
 *
 * Implements Instagram's TWO-STEP publish flow with status polling:
 *   1. Create media container(s)
 *   2. Wait for processing (poll status until FINISHED)
 *   3. Publish the container
 *
 * For carousels, each child image is uploaded as a separate container,
 * then combined into a carousel container before publishing.
 *
 * IMPORTANT: Instagram REQUIRES images for every post. Text-only posting
 * is NOT possible.
 */

import {
  createMediaContainer,
  createCarouselContainer,
  waitForContainerReady,
  publishMedia,
  getMedia,
  loadInstagramConfig,
  type InstagramConfig,
} from './instagram-api.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PublishSingleOptions {
  /** Publicly accessible image URL (REQUIRED) */
  imageUrl: string;
  /** Post caption */
  caption?: string;
  /** Optional pre-loaded config */
  config?: InstagramConfig;
  /** Max wait time for processing in ms (default: 60000) */
  maxWaitMs?: number;
}

export interface PublishCarouselOptions {
  /** Array of publicly accessible image URLs (2-10 images, REQUIRED) */
  imageUrls: string[];
  /** Post caption */
  caption?: string;
  /** Optional pre-loaded config */
  config?: InstagramConfig;
  /** Max wait time per container in ms (default: 60000) */
  maxWaitMs?: number;
}

export interface PublishResult {
  /** The published media ID */
  id: string;
  /** Permalink to the published post */
  permalink?: string;
  /** Media type */
  mediaType: 'IMAGE' | 'CAROUSEL_ALBUM';
}

// ---------------------------------------------------------------------------
// Single image publishing
// ---------------------------------------------------------------------------

/**
 * Publish a single image post to Instagram.
 *
 * Flow:
 * 1. Create media container with image_url and caption
 * 2. Poll status until FINISHED
 * 3. Publish the container
 * 4. Retrieve permalink
 */
export async function publishSingleImage(options: PublishSingleOptions): Promise<PublishResult> {
  const config = options.config ?? loadInstagramConfig();
  if (!config.apiKey) {
    throw new Error('youmind.api_key not set in config.yaml');
  }
  const maxWaitMs = options.maxWaitMs ?? 60_000;

  if (!options.imageUrl) {
    throw new Error(
      'Instagram requires an image for every post. Provide a publicly accessible image URL.',
    );
  }

  console.log('[INFO] Step 1/3: Creating media container...');
  const container = await createMediaContainer(config, {
    image_url: options.imageUrl,
    caption: options.caption,
  });
  console.log(`[INFO] Container created: ${container.id}`);

  console.log('[INFO] Step 2/3: Waiting for processing...');
  await waitForContainerReady(config, container.id, maxWaitMs);
  console.log('[INFO] Container ready.');

  console.log('[INFO] Step 3/3: Publishing...');
  const published = await publishMedia(config, container.id);
  console.log(`[INFO] Published! Media ID: ${published.id}`);

  // Retrieve permalink
  let permalink: string | undefined;
  try {
    const media = await getMedia(config, published.id);
    permalink = media.permalink;
  } catch {
    // Non-critical — we still have the ID
  }

  return {
    id: published.id,
    permalink,
    mediaType: 'IMAGE',
  };
}

// ---------------------------------------------------------------------------
// Carousel publishing
// ---------------------------------------------------------------------------

/**
 * Publish a carousel post to Instagram.
 *
 * Flow:
 * 1. Create child containers for each image (is_carousel_item: true)
 * 2. Wait for each child to finish processing
 * 3. Create carousel container referencing all children
 * 4. Wait for carousel container to finish processing
 * 5. Publish the carousel container
 * 6. Retrieve permalink
 */
export async function publishCarousel(options: PublishCarouselOptions): Promise<PublishResult> {
  const config = options.config ?? loadInstagramConfig();
  if (!config.apiKey) {
    throw new Error('youmind.api_key not set in config.yaml');
  }
  const maxWaitMs = options.maxWaitMs ?? 60_000;

  if (!options.imageUrls?.length) {
    throw new Error(
      'Instagram carousels require image URLs. Provide an array of publicly accessible image URLs.',
    );
  }
  if (options.imageUrls.length < 2) {
    throw new Error('Instagram carousels require at least 2 images.');
  }
  if (options.imageUrls.length > 10) {
    throw new Error('Instagram carousels support a maximum of 10 images.');
  }

  // Step 1: Create child containers
  console.log(`[INFO] Step 1/4: Creating ${options.imageUrls.length} child containers...`);
  const childContainers: string[] = [];

  for (let i = 0; i < options.imageUrls.length; i++) {
    const imageUrl = options.imageUrls[i]!;
    console.log(`[INFO]   Child ${i + 1}/${options.imageUrls.length}: ${imageUrl.slice(0, 60)}...`);

    const child = await createMediaContainer(config, {
      image_url: imageUrl,
      is_carousel_item: true,
    });
    childContainers.push(child.id);
  }

  // Step 2: Wait for all children to process
  console.log('[INFO] Step 2/4: Waiting for child containers to process...');
  for (let i = 0; i < childContainers.length; i++) {
    const childId = childContainers[i]!;
    console.log(`[INFO]   Polling child ${i + 1}/${childContainers.length}: ${childId}`);
    await waitForContainerReady(config, childId, maxWaitMs);
  }
  console.log('[INFO] All children ready.');

  // Step 3: Create carousel container
  console.log('[INFO] Step 3/4: Creating carousel container...');
  const carouselContainer = await createCarouselContainer(
    config,
    childContainers,
    options.caption,
  );
  console.log(`[INFO] Carousel container created: ${carouselContainer.id}`);

  // Step 4: Wait for carousel container to process
  console.log('[INFO] Waiting for carousel processing...');
  await waitForContainerReady(config, carouselContainer.id, maxWaitMs);
  console.log('[INFO] Carousel ready.');

  // Step 5: Publish
  console.log('[INFO] Step 4/4: Publishing carousel...');
  const published = await publishMedia(config, carouselContainer.id);
  console.log(`[INFO] Published! Media ID: ${published.id}`);

  // Retrieve permalink
  let permalink: string | undefined;
  try {
    const media = await getMedia(config, published.id);
    permalink = media.permalink;
  } catch {
    // Non-critical
  }

  return {
    id: published.id,
    permalink,
    mediaType: 'CAROUSEL_ALBUM',
  };
}
