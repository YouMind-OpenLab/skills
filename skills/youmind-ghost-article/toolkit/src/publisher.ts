/**
 * Ghost publisher: converts Markdown and publishes to Ghost.
 *
 * - Handles feature image upload
 * - Sets post status to 'draft' by default
 * - Returns post ID, URL, slug, and status
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  type GhostConfig,
  type GhostPost,
  loadGhostConfig,
  createPost,
  uploadImage,
} from './ghost-api.js';
import { adaptForGhost } from './content-adapter.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PublishOptions {
  /** Path to Markdown file, or raw Markdown string */
  input: string;
  /** Whether input is a file path (true) or raw Markdown (false) */
  isFile?: boolean;
  /** Post status: 'draft' (default), 'published', 'scheduled' */
  status?: 'published' | 'draft' | 'scheduled';
  /** Tag names to assign (first is primary tag) */
  tags?: string[];
  /** Path to feature image file */
  featureImage?: string;
  /** Feature image URL (alternative to file upload) */
  featureImageUrl?: string;
  /** Override title */
  title?: string;
  /** Ghost config (loaded from config.yaml if not provided) */
  config?: GhostConfig;
}

export interface PublishResult {
  id: string;
  url: string;
  slug: string;
  status: string;
  title: string;
  excerpt: string;
}

// ---------------------------------------------------------------------------
// Publisher
// ---------------------------------------------------------------------------

export async function publish(options: PublishOptions): Promise<PublishResult> {
  const config = options.config || loadGhostConfig();

  // Read Markdown content
  let markdown: string;
  if (options.isFile !== false && existsSync(resolve(options.input))) {
    markdown = readFileSync(resolve(options.input), 'utf-8');
  } else {
    markdown = options.input;
  }

  // Determine feature image URL
  let featureImageUrl = options.featureImageUrl;

  // Upload feature image file if provided
  if (!featureImageUrl && options.featureImage && existsSync(resolve(options.featureImage))) {
    try {
      const image = await uploadImage(config, resolve(options.featureImage));
      featureImageUrl = image.url;
      console.log(`Feature image uploaded: ${image.url}`);
    } catch (e) {
      console.error(`Failed to upload feature image: ${(e as Error).message}`);
      console.error('Continuing without feature image...');
    }
  }

  // Adapt content for Ghost
  const adapted = await adaptForGhost({
    markdown,
    title: options.title,
    tagNames: options.tags,
    featureImage: featureImageUrl,
  });

  // Create the post
  const status = options.status || 'draft';
  const post = await createPost(config, {
    title: adapted.title,
    html: adapted.html,
    custom_excerpt: adapted.excerpt,
    status,
    tags: adapted.tags.length ? adapted.tags : undefined,
    feature_image: adapted.featureImage,
  });

  return {
    id: post.id,
    url: post.url,
    slug: post.slug,
    status: post.status,
    title: adapted.title,
    excerpt: adapted.excerpt,
  };
}
