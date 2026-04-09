/**
 * Hashnode article publisher — high-level wrapper around hashnode-api.
 */

import {
  publishPost,
  loadHashnodeConfig,
  type HashnodePost,
  type HashnodeConfig,
} from './hashnode-api.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PublishOptions {
  title: string;
  markdown: string;
  subtitle?: string;
  tags?: string[];
  coverImageUrl?: string;
  canonicalUrl?: string;
  seriesId?: string;
  metaTitle?: string;
  metaDescription?: string;
  /** Optional pre-loaded config */
  config?: HashnodeConfig;
}

export interface PublishResult {
  id: string;
  url: string;
  slug: string;
  published: boolean;
  readTimeInMinutes: number;
}

// ---------------------------------------------------------------------------
// Publish
// ---------------------------------------------------------------------------

/**
 * Publish an article to a Hashnode publication via the YouMind proxy.
 *
 * Hashnode publishes posts immediately (no draft API in the public GraphQL
 * API). Articles are always published to the user's publication, which is
 * bound server-side by YouMind to the API key.
 */
export async function publish(options: PublishOptions): Promise<PublishResult> {
  const {
    title,
    markdown,
    subtitle,
    tags,
    coverImageUrl,
    canonicalUrl,
    seriesId,
    metaTitle,
    metaDescription,
  } = options;

  const config = options.config ?? loadHashnodeConfig();

  if (!config.apiKey) {
    throw new Error('youmind.api_key not set in config.yaml');
  }

  if (!title || !title.trim()) {
    throw new Error('Article title is required.');
  }

  if (!markdown || !markdown.trim()) {
    throw new Error('Article markdown content is required.');
  }

  // Build tag slugs (max 5)
  const tagSlugs = (tags ?? [])
    .slice(0, 5)
    .map(t => t.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 50))
    .filter(t => t.length > 0);

  // Build meta tags
  const metaTags = (metaTitle || metaDescription)
    ? {
        title: metaTitle ?? title,
        description: metaDescription?.slice(0, 160),
      }
    : undefined;

  const post: HashnodePost = await publishPost(config, {
    title: title.trim(),
    contentMarkdown: markdown,
    subtitle: subtitle?.trim(),
    tagSlugs: tagSlugs.length > 0 ? tagSlugs : undefined,
    coverImageOptions: coverImageUrl ? { coverImageURL: coverImageUrl } : undefined,
    canonicalUrl,
    seriesId,
    metaTags,
  });

  return {
    id: post.id,
    url: post.url,
    slug: post.slug,
    published: !!post.publishedAt,
    readTimeInMinutes: post.readTimeInMinutes,
  };
}
