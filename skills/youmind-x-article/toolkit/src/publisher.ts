/**
 * X (Twitter) publishing orchestrator.
 *
 * Coordinates content adaptation, media upload, and tweet/thread creation.
 */

import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  createTweet,
  createThread,
  uploadMedia,
  getMe,
  loadXConfig,
  getAuthMode,
  type XConfig,
} from './x-api.js';
import {
  browserPostTweet,
  browserPostThread,
} from './x-browser.js';
import {
  adaptSingleTweet,
  splitIntoThread,
  adaptLongForm,
  weightedCharCount,
  type AdaptOptions,
} from './content-adapter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_DIR = resolve(__dirname, '../..');

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PublishTweetOptions {
  /** Raw text or Markdown content */
  content: string;
  /** Optional image/media file paths or URLs */
  media?: string[];
  /** Reply to an existing tweet ID */
  replyTo?: string;
  /** Quote tweet ID */
  quoteTweetId?: string;
  /** Custom hashtags */
  hashtags?: string[];
  /** X config override */
  config?: XConfig;
}

export interface PublishThreadOptions {
  /** Raw text or Markdown content to split into a thread */
  content: string;
  /** Optional image for the first tweet */
  media?: string[];
  /** Custom hashtags (added to last tweet) */
  hashtags?: string[];
  /** Add numbering (default: true) */
  addNumbering?: boolean;
  /** X config override */
  config?: XConfig;
}

export interface PublishResult {
  success: boolean;
  type: 'tweet' | 'thread';
  tweetIds: string[];
  content: string | string[];
  warnings: string[];
  error?: string;
}

// ---------------------------------------------------------------------------
// Publish single tweet
// ---------------------------------------------------------------------------

export async function publishTweet(
  options: PublishTweetOptions,
): Promise<PublishResult> {
  const config = options.config ?? loadXConfig();

  // Adapt content
  const adapted = adaptSingleTweet(options.content, {
    hashtags: options.hashtags,
  });

  // Upload media if provided
  const mediaIds: string[] = [];
  if (options.media?.length) {
    for (const mediaSource of options.media) {
      try {
        const result = await uploadMedia(config, mediaSource);
        mediaIds.push(result.media_id_string);
        console.log(`Media uploaded: ${mediaSource} -> ${result.media_id_string}`);
      } catch (err) {
        adapted.warnings.push(
          `Failed to upload media ${mediaSource}: ${(err as Error).message}`,
        );
      }
    }
  }

  // Create tweet
  try {
    const authMode = getAuthMode(config);
    const result = authMode === 'browser'
      ? await browserPostTweet(adapted.text, { replyTo: options.replyTo })
      : await createTweet(config, adapted.text, {
          reply_to: options.replyTo,
          quote_tweet_id: options.quoteTweetId,
          media_ids: mediaIds.length > 0 ? mediaIds : undefined,
        });

    // Save output
    saveOutput('tweet', {
      tweetId: result.data.id,
      text: adapted.text,
      warnings: adapted.warnings,
    });

    return {
      success: true,
      type: 'tweet',
      tweetIds: [result.data.id],
      content: adapted.text,
      warnings: adapted.warnings,
    };
  } catch (err) {
    return {
      success: false,
      type: 'tweet',
      tweetIds: [],
      content: adapted.text,
      warnings: adapted.warnings,
      error: (err as Error).message,
    };
  }
}

// ---------------------------------------------------------------------------
// Publish thread
// ---------------------------------------------------------------------------

export async function publishThread(
  options: PublishThreadOptions,
): Promise<PublishResult> {
  const config = options.config ?? loadXConfig();

  // Split content into thread
  const thread = splitIntoThread(options.content, {
    hashtags: options.hashtags,
    addNumbering: options.addNumbering,
  });

  if (thread.tweets.length === 0) {
    return {
      success: false,
      type: 'thread',
      tweetIds: [],
      content: [],
      warnings: ['No content to post.'],
      error: 'Empty content',
    };
  }

  // If only one tweet, just post as single
  if (thread.tweets.length === 1) {
    return publishTweet({
      content: thread.tweets[0],
      media: options.media,
      config,
    });
  }

  try {
    const authMode = getAuthMode(config);
    const results = authMode === 'browser'
      ? await browserPostThread(thread.tweets)
      : await createThread(config, thread.tweets);
    const tweetIds = results.map((r) => r.data.id);

    saveOutput('thread', {
      tweetIds,
      tweets: thread.tweets,
      warnings: thread.warnings,
    });

    return {
      success: true,
      type: 'thread',
      tweetIds,
      content: thread.tweets,
      warnings: thread.warnings,
    };
  } catch (err) {
    return {
      success: false,
      type: 'thread',
      tweetIds: [],
      content: thread.tweets,
      warnings: thread.warnings,
      error: (err as Error).message,
    };
  }
}

// ---------------------------------------------------------------------------
// Preview
// ---------------------------------------------------------------------------

/**
 * Preview how content will be formatted without publishing.
 */
export function previewTweet(
  content: string,
  options: AdaptOptions = {},
): { text: string; charCount: number; warnings: string[] } {
  const adapted = adaptSingleTweet(content, options);
  return {
    text: adapted.text,
    charCount: adapted.charCount,
    warnings: adapted.warnings,
  };
}

export function previewThread(
  content: string,
  options: AdaptOptions = {},
): { tweets: string[]; totalTweets: number; warnings: string[] } {
  const thread = splitIntoThread(content, options);
  return {
    tweets: thread.tweets,
    totalTweets: thread.totalTweets,
    warnings: thread.warnings,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function saveOutput(type: string, data: Record<string, unknown>): void {
  try {
    const outputDir = resolve(PROJECT_DIR, 'output');
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputPath = resolve(outputDir, `x-${type}-${timestamp}.json`);
    writeFileSync(outputPath, JSON.stringify({ ...data, timestamp: new Date().toISOString() }, null, 2));
  } catch {
    // Non-critical, ignore
  }
}
