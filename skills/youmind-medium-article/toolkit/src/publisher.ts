/**
 * Medium article publisher — high-level wrapper around medium-api.
 *
 * Determines whether to publish to a user profile or a publication,
 * handles authentication, and returns a clean result.
 *
 * NOTE: Medium API is publish-only. Once created, articles cannot be
 * updated or deleted via API. Edits must be made through the Medium
 * web interface.
 */

import {
  getUser,
  createPost,
  createPublicationPost,
  loadConfig,
  type CreatePostOptions,
  type MediumPost,
} from './medium-api.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PublishOptions {
  /** Medium integration token (overrides config) */
  token?: string;
  /** Article title */
  title: string;
  /** Article content (markdown or HTML) */
  content: string;
  /** Content format: "markdown" (default) or "html" */
  contentFormat?: 'markdown' | 'html';
  /** Up to 5 tags */
  tags?: string[];
  /** Canonical URL for cross-posting */
  canonicalUrl?: string;
  /** Publish status: "draft" (default), "public", or "unlisted" */
  publishStatus?: 'public' | 'draft' | 'unlisted';
  /** Publication ID — if set, publishes to this publication instead of user profile */
  publicationId?: string;
}

export interface PublishResult {
  /** Medium post ID */
  id: string;
  /** Full URL to the article on Medium */
  url: string;
  /** Publish status */
  publishStatus: 'public' | 'draft' | 'unlisted';
  /** Author ID */
  authorId: string;
  /** Tags applied */
  tags: string[];
  /** Publication ID (if published to a publication) */
  publicationId?: string;
}

// ---------------------------------------------------------------------------
// Publish
// ---------------------------------------------------------------------------

/**
 * Publish an article to Medium.
 *
 * By default publishes as a draft (publishStatus: "draft").
 * If publicationId is provided (via options or config), publishes to that publication.
 * Otherwise, publishes to the authenticated user's profile.
 */
export async function publish(options: PublishOptions): Promise<PublishResult> {
  const cfg = loadConfig();
  const token = options.token || cfg.medium.token;

  if (!token) {
    throw new Error(
      'Medium integration token is required. Set medium.token in config.yaml or pass --token.',
    );
  }

  if (!options.title?.trim()) {
    throw new Error('Article title is required.');
  }

  if (!options.content?.trim()) {
    throw new Error('Article content is required.');
  }

  // Get the authenticated user to obtain the author ID
  const user = await getUser(token);
  const authorId = user.id;

  // Determine publication ID
  const publicationId = options.publicationId || cfg.medium.publicationId || '';

  // Build post options
  const postOptions: CreatePostOptions = {
    title: options.title.trim(),
    contentFormat: options.contentFormat ?? 'markdown',
    content: options.content,
    tags: (options.tags ?? []).slice(0, 5),
    canonicalUrl: options.canonicalUrl,
    publishStatus: options.publishStatus ?? 'draft',
  };

  let post: MediumPost;

  if (publicationId) {
    // Publish to publication
    post = await createPublicationPost(token, publicationId, postOptions);
  } else {
    // Publish to user profile
    post = await createPost(token, authorId, postOptions);
  }

  return {
    id: post.id,
    url: post.url,
    publishStatus: post.publishStatus,
    authorId: post.authorId,
    tags: post.tags ?? [],
    publicationId: post.publicationId,
  };
}
