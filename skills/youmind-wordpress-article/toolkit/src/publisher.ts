/**
 * WordPress publisher: converts Markdown and publishes to WordPress.
 *
 * - Handles media upload for featured image
 * - Sets post status to 'draft' by default
 * - Returns post ID, URL, slug, and status
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  type WordPressConfig,
  type WPPost,
  loadWordPressConfig,
  createPost,
  uploadMedia,
} from './wordpress-api.js';
import { adaptForWordPress } from './content-adapter.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PublishOptions {
  /** Path to Markdown file, or raw Markdown string */
  input: string;
  /** Whether input is a file path (true) or raw Markdown (false) */
  isFile?: boolean;
  /** Post status: 'draft' (default), 'publish', 'pending', 'private' */
  status?: 'publish' | 'draft' | 'pending' | 'private';
  /** Tag names to assign */
  tags?: string[];
  /** Category names to assign */
  categories?: string[];
  /** Path to featured image file */
  featuredImage?: string;
  /** Override title */
  title?: string;
  /** WordPress config (loaded from config.yaml if not provided) */
  config?: WordPressConfig;
}

export interface PublishResult {
  id: number;
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
  const config = options.config || loadWordPressConfig();

  // Read Markdown content
  let markdown: string;
  if (options.isFile !== false && existsSync(resolve(options.input))) {
    markdown = readFileSync(resolve(options.input), 'utf-8');
  } else {
    markdown = options.input;
  }

  // Adapt content for WordPress
  const adapted = await adaptForWordPress({
    markdown,
    title: options.title,
    tagNames: options.tags,
    categoryNames: options.categories,
    config,
  });

  // Upload featured image if provided
  let featuredMediaId: number | undefined;
  if (options.featuredImage && existsSync(resolve(options.featuredImage))) {
    try {
      const media = await uploadMedia(config, resolve(options.featuredImage));
      featuredMediaId = media.id;
      console.log(`Featured image uploaded: ID=${media.id}, URL=${media.source_url}`);
    } catch (e) {
      console.error(`Failed to upload featured image: ${(e as Error).message}`);
      console.error('Continuing without featured image...');
    }
  }

  // Create the post
  const status = options.status || 'draft';
  const post = await createPost(config, {
    title: adapted.title,
    content: adapted.html,
    excerpt: adapted.excerpt,
    status,
    tags: adapted.tags.length ? adapted.tags : undefined,
    categories: adapted.categories.length ? adapted.categories : undefined,
    featured_media: featuredMediaId,
  });

  return {
    id: post.id,
    url: post.link,
    slug: post.slug,
    status: post.status,
    title: adapted.title,
    excerpt: adapted.excerpt,
  };
}
