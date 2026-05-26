/**
 * Ghost publisher: converts Markdown and publishes to Ghost.
 *
 * - Handles feature image upload
 * - Sets post status to 'draft' by default
 * - Returns post ID, URL, slug, and status
 */

import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import {
  type GhostConfig,
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
  /** Internal Ghost tag names; prefixed with # automatically */
  internalTags?: string[];
  /** Path to feature image file */
  featureImage?: string;
  /** Feature image URL (alternative to file upload) */
  featureImageUrl?: string;
  /** Override custom excerpt */
  customExcerpt?: string;
  /** Override title */
  title?: string;
  visibility?: 'public' | 'members' | 'paid' | 'tiers';
  slug?: string;
  featured?: boolean;
  publishedAt?: string;
  /** Ghost config (loaded from ~/.youmind/config.yaml when not provided) */
  config?: GhostConfig;
}

export interface PublishResult {
  id: string;
  url: string;
  adminUrl?: string | null;
  slug: string;
  status: string;
  title: string;
  excerpt: string;
}

// ---------------------------------------------------------------------------
// Publisher
// ---------------------------------------------------------------------------

export async function publish(options: PublishOptions): Promise<PublishResult> {
  const config = options.config ?? loadGhostConfig();

  if (!config.apiKey) {
    throw new Error('YouMind API key not set. Configure ~/.youmind/config.yaml.');
  }

  // Read Markdown content
  let markdown: string;
  const resolvedInputPath = resolve(options.input);
  const inputPath =
    options.isFile !== false && existsSync(resolvedInputPath) ? resolvedInputPath : undefined;
  const inputDir = inputPath ? dirname(inputPath) : process.cwd();

  if (inputPath) {
    markdown = readFileSync(inputPath, 'utf-8');
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
    internalTagNames: options.internalTags,
    featureImage: options.featureImage,
    featureImageUrl,
    customExcerpt: options.customExcerpt,
    status: options.status,
    visibility: options.visibility,
    slug: options.slug,
    featured: options.featured,
    publishedAt: options.publishedAt,
  });

  const adaptedFeatureImagePath = adapted.featureImagePath
    ? resolve(inputDir, adapted.featureImagePath)
    : undefined;

  if (!featureImageUrl && adaptedFeatureImagePath && existsSync(adaptedFeatureImagePath)) {
    try {
      const image = await uploadImage(config, adaptedFeatureImagePath);
      featureImageUrl = image.url;
      console.log(`Feature image uploaded: ${image.url}`);
    } catch (e) {
      console.error(`Failed to upload feature image: ${(e as Error).message}`);
      console.error('Continuing without feature image...');
    }
  }

  featureImageUrl = featureImageUrl ?? adapted.featureImageUrl;

  // Create the post
  const status = adapted.status || 'draft';
  const post = await createPost(config, {
    title: adapted.title,
    html: adapted.html,
    custom_excerpt: adapted.excerpt,
    status,
    tags: adapted.tags.length ? adapted.tags : undefined,
    feature_image: featureImageUrl,
    featured: adapted.featured,
    visibility: adapted.visibility,
    slug: adapted.slug,
    published_at: adapted.publishedAt,
  });

  return {
    id: post.id,
    url: post.url,
    adminUrl: post.adminUrl ?? null,
    slug: post.slug,
    status: post.status,
    title: adapted.title,
    excerpt: adapted.excerpt,
  };
}
