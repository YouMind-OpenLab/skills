/**
 * Facebook publisher — high-level publishing orchestration.
 *
 * Handles the decision logic between text posts, link posts, and photo posts,
 * then delegates to the facebook-api module.
 */

import {
  createPost,
  createPhotoPost,
  getPost,
  loadFacebookConfig,
  type FacebookConfig,
  type CreatePostOptions,
} from './facebook-api.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PublishOptions {
  /** The post message text */
  message: string;
  /** Optional link URL (creates a link preview card) */
  link?: string;
  /** Optional image URL for a photo post */
  imageUrl?: string;
  /** Set to false to create an unpublished/draft post */
  published?: boolean;
  /** Unix timestamp for scheduled publishing */
  scheduledTime?: number;
  /** Optional pre-loaded config */
  config?: FacebookConfig;
}

export interface PublishResult {
  /** The post ID returned by Facebook */
  id: string;
  /** The permalink URL to the published post */
  url?: string;
  /** Whether the post was published immediately */
  published: boolean;
  /** Post type: text, link, or photo */
  type: 'text' | 'link' | 'photo';
}

// ---------------------------------------------------------------------------
// Publisher
// ---------------------------------------------------------------------------

/**
 * Publish a post to a Facebook Page.
 *
 * Automatically selects the right posting method based on provided options:
 * - imageUrl provided → photo post via /photos endpoint
 * - link provided → link post (URL in message body creates preview card)
 * - otherwise → text post via /feed endpoint
 */
export async function publish(options: PublishOptions): Promise<PublishResult> {
  const config = options.config ?? loadFacebookConfig();
  const isPublished = options.published !== false;

  // Photo post — uses the photos endpoint
  if (options.imageUrl) {
    const result = await createPhotoPost(
      config,
      options.imageUrl,
      options.message,
    );

    // Try to get the permalink
    let url: string | undefined;
    if (result.post_id) {
      try {
        const postData = await getPost(config, result.post_id);
        url = postData.permalink_url;
      } catch {
        // Non-critical — we still have the ID
      }
    }

    return {
      id: result.id,
      url,
      published: isPublished,
      type: 'photo',
    };
  }

  // Text or link post — uses the feed endpoint
  const postOptions: CreatePostOptions = {};

  if (options.link) {
    postOptions.link = options.link;
  }
  if (options.published === false) {
    postOptions.published = false;
  }
  if (options.scheduledTime) {
    postOptions.scheduled_publish_time = options.scheduledTime;
  }

  const result = await createPost(config, options.message, postOptions);

  // Try to get the permalink
  let url: string | undefined;
  try {
    const postData = await getPost(config, result.id);
    url = postData.permalink_url;
  } catch {
    // Non-critical
  }

  return {
    id: result.id,
    url,
    published: isPublished,
    type: options.link ? 'link' : 'text',
  };
}
