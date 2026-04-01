/**
 * Hashnode article publisher — high-level wrapper around hashnode-api.
 */

import { publishPost, type HashnodePost } from './hashnode-api.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PublishOptions {
  token: string;
  publicationId: string;
  title: string;
  markdown: string;
  subtitle?: string;
  tags?: string[];
  coverImageUrl?: string;
  canonicalUrl?: string;
  seriesId?: string;
  metaTitle?: string;
  metaDescription?: string;
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
 * Publish an article to a Hashnode publication.
 *
 * Hashnode publishes posts immediately (no draft API in the public GraphQL API).
 * Articles are always published to the specified publication.
 */
export async function publish(options: PublishOptions): Promise<PublishResult> {
  const {
    token,
    publicationId,
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

  if (!token) {
    throw new Error('Hashnode token is required. Set hashnode.token in config.yaml.');
  }

  if (!publicationId) {
    throw new Error('Hashnode publication_id is required. Set hashnode.publication_id in config.yaml.');
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

  const post: HashnodePost = await publishPost(token, publicationId, {
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
