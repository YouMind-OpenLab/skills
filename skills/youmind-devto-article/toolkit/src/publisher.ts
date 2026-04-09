/**
 * Dev.to article publisher — high-level wrapper around devto-api.
 */

import {
  createArticle,
  loadDevtoConfig,
  type DevtoArticle,
  type DevtoConfig,
} from './devto-api.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PublishOptions {
  title: string;
  markdown: string;
  tags?: string[];
  description?: string;
  coverImageUrl?: string;
  canonicalUrl?: string;
  series?: string;
  published?: boolean;
  /** Optional pre-loaded config */
  config?: DevtoConfig;
}

export interface PublishResult {
  id: number;
  url: string;
  slug: string;
  published: boolean;
}

// ---------------------------------------------------------------------------
// Publish
// ---------------------------------------------------------------------------

/**
 * Publish an article to Dev.to.
 *
 * By default publishes as a draft (published: false).
 * Pass `published: true` to publish immediately.
 */
export async function publish(options: PublishOptions): Promise<PublishResult> {
  const {
    title,
    markdown,
    tags,
    description,
    coverImageUrl,
    canonicalUrl,
    series,
    published = false,
  } = options;

  const config = options.config ?? loadDevtoConfig();

  if (!config.apiKey) {
    throw new Error('youmind.api_key not set in config.yaml');
  }

  if (!title || !title.trim()) {
    throw new Error('Article title is required.');
  }

  if (!markdown || !markdown.trim()) {
    throw new Error('Article markdown content is required.');
  }

  // Validate tags: max 4, lowercase, alphanumeric + hyphens
  const validatedTags = (tags ?? [])
    .slice(0, 4)
    .map(t => t.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 30))
    .filter(t => t.length > 0);

  const article: DevtoArticle = await createArticle(config, {
    title: title.trim(),
    body_markdown: markdown,
    published,
    tags: validatedTags.length > 0 ? validatedTags : undefined,
    description: description?.slice(0, 170),
    cover_image: coverImageUrl,
    canonical_url: canonicalUrl,
    series,
  });

  return {
    id: article.id,
    url: article.url,
    slug: article.slug,
    published: article.published,
  };
}
