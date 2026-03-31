/**
 * LinkedIn publisher — publish posts and articles with auto content-type detection.
 */

import {
  createTextPost, createImagePost, createArticle, uploadImage,
  type LinkedInConfig, type PostResult, type ArticleResult,
} from './linkedin-api.js';

// ---------------------------------------------------------------------------
// Content type recommendation
// ---------------------------------------------------------------------------

/**
 * Recommend content type based on content length.
 * - Post: ≤1500 chars (optimal for engagement)
 * - Article: >1500 chars (long-form thought leadership)
 */
export function recommendContentType(charCount: number): 'post' | 'article' {
  return charCount <= 1500 ? 'post' : 'article';
}

// ---------------------------------------------------------------------------
// Post publishing
// ---------------------------------------------------------------------------

export interface PublishPostOptions {
  text: string;
  imagePath?: string;
  hashtags?: string[];
  visibility?: 'PUBLIC' | 'CONNECTIONS';
  config?: LinkedInConfig;
}

export interface PublishPostResult {
  postUrn: string;
  postUrl: string;
  type: 'post';
}

export async function publishLinkedInPost(options: PublishPostOptions): Promise<PublishPostResult> {
  const { text, imagePath, hashtags, visibility, config } = options;

  let fullText = text;
  if (hashtags?.length) {
    const tags = hashtags.map(t => t.startsWith('#') ? t : `#${t}`).join(' ');
    fullText = `${text}\n\n${tags}`;
  }

  if (fullText.length > 3000) {
    console.error(`[WARN] Post text exceeds 3000 chars (${fullText.length}), will be truncated by LinkedIn`);
  }

  let result: PostResult;

  if (imagePath) {
    console.error(`[INFO] Uploading image: ${imagePath}`);
    const { imageUrn } = await uploadImage(imagePath, config);
    console.error(`[INFO] Image uploaded: ${imageUrn}`);
    result = await createImagePost(fullText, imageUrn, visibility, config);
  } else {
    result = await createTextPost(fullText, visibility, config);
  }

  console.error(`[INFO] Post published: ${result.postUrl}`);

  return {
    postUrn: result.postUrn,
    postUrl: result.postUrl,
    type: 'post',
  };
}

// ---------------------------------------------------------------------------
// Article publishing
// ---------------------------------------------------------------------------

export interface PublishArticleOptions {
  title: string;
  htmlBody: string;
  description?: string;
  coverImagePath?: string;
  visibility?: 'PUBLIC' | 'CONNECTIONS';
  config?: LinkedInConfig;
}

export interface PublishArticleResult {
  articleUrn: string;
  articleUrl: string;
  type: 'article';
}

export async function publishLinkedInArticle(options: PublishArticleOptions): Promise<PublishArticleResult> {
  const { title, htmlBody, description, coverImagePath, visibility, config } = options;

  let thumbnailUrn: string | undefined;
  if (coverImagePath) {
    console.error(`[INFO] Uploading cover image: ${coverImagePath}`);
    const { imageUrn } = await uploadImage(coverImagePath, config);
    thumbnailUrn = imageUrn;
    console.error(`[INFO] Cover uploaded: ${imageUrn}`);
  }

  const result = await createArticle(title, htmlBody, description, thumbnailUrn, visibility, config);
  console.error(`[INFO] Article published: ${result.articleUrl}`);

  return {
    articleUrn: result.articleUrn,
    articleUrl: result.articleUrl,
    type: 'article',
  };
}
