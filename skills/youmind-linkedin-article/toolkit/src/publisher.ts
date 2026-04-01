/**
 * LinkedIn publishing orchestrator.
 *
 * Coordinates content adaptation, image upload, and post creation.
 */

import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  createPost,
  uploadImage,
  getProfile,
  loadLinkedInConfig,
  type LinkedInConfig,
  type CreatePostOptions,
} from './linkedin-api.js';
import {
  adaptForLinkedIn,
  suggestHashtags,
  type AdaptOptions,
} from './content-adapter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_DIR = resolve(__dirname, '../..');

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PublishOptions {
  /** Raw text or Markdown content to publish */
  content: string;
  /** Optional image file paths or URLs */
  images?: string[];
  /** Post visibility */
  visibility?: 'PUBLIC' | 'CONNECTIONS';
  /** Post as organization page */
  asOrganization?: boolean;
  /** Custom hashtags (auto-generated if not provided) */
  hashtags?: string[];
  /** CTA question for engagement */
  ctaQuestion?: string;
  /** LinkedIn config override */
  config?: LinkedInConfig;
}

export interface PublishResult {
  success: boolean;
  postId?: string;
  postText: string;
  extractedLinks: string[];
  warnings: string[];
  error?: string;
}

// ---------------------------------------------------------------------------
// Publish
// ---------------------------------------------------------------------------

/**
 * Full publishing pipeline: adapt content -> upload images -> create post.
 */
export async function publish(options: PublishOptions): Promise<PublishResult> {
  const config = options.config ?? loadLinkedInConfig();

  // Step 1: Generate hashtags if not provided
  const hashtags = options.hashtags ?? suggestHashtags(options.content);

  // Step 2: Adapt content for LinkedIn
  const adaptOptions: AdaptOptions = {
    hashtags,
    ctaQuestion: options.ctaQuestion,
    extractLinks: true,
  };

  const adapted = adaptForLinkedIn(options.content, adaptOptions);

  // Step 3: Upload images if provided
  const mediaAssets: CreatePostOptions['mediaAssets'] = [];
  if (options.images?.length) {
    for (const imgSource of options.images) {
      try {
        const result = await uploadImage(config, imgSource);
        mediaAssets.push({
          id: result.asset,
          title: 'Post image',
        });
        console.log(`Image uploaded: ${imgSource} -> ${result.asset}`);
      } catch (err) {
        adapted.warnings.push(
          `Failed to upload image ${imgSource}: ${(err as Error).message}`,
        );
      }
    }
  }

  // Step 4: Create the post
  try {
    const postOptions: CreatePostOptions = {
      text: adapted.text,
      visibility: options.visibility ?? 'PUBLIC',
      asOrganization: options.asOrganization,
      mediaAssets: mediaAssets.length > 0 ? mediaAssets : undefined,
    };

    const post = await createPost(config, postOptions);

    // Step 5: Save output for reference
    const outputDir = resolve(PROJECT_DIR, 'output');
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputPath = resolve(outputDir, `linkedin-post-${timestamp}.json`);
    writeFileSync(
      outputPath,
      JSON.stringify(
        {
          postId: post.id,
          text: adapted.text,
          hashtags,
          extractedLinks: adapted.extractedLinks,
          warnings: adapted.warnings,
          timestamp: new Date().toISOString(),
        },
        null,
        2,
      ),
    );

    return {
      success: true,
      postId: post.id,
      postText: adapted.text,
      extractedLinks: adapted.extractedLinks,
      warnings: adapted.warnings,
    };
  } catch (err) {
    return {
      success: false,
      postText: adapted.text,
      extractedLinks: adapted.extractedLinks,
      warnings: adapted.warnings,
      error: (err as Error).message,
    };
  }
}

/**
 * Preview adapted content without publishing.
 */
export function preview(
  content: string,
  options: AdaptOptions = {},
): {
  text: string;
  charCount: number;
  extractedLinks: string[];
  warnings: string[];
} {
  const hashtags = options.hashtags ?? suggestHashtags(content);
  const adapted = adaptForLinkedIn(content, { ...options, hashtags });
  return {
    text: adapted.text,
    charCount: adapted.finalLength,
    extractedLinks: adapted.extractedLinks,
    warnings: adapted.warnings,
  };
}
