/**
 * X (Twitter) publishing orchestrator via YouMind OpenAPI.
 *
 * Content adaptation (280-char clamp + thread splitting) lives here. The
 * actual HTTP call is `createXPost` from `./x-api.js`. Threads are built
 * natively by chaining each tweet as a reply to the previous one (via
 * `replyToPostId`), so X renders the sequence as a proper thread.
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  adaptSingleTweet,
  splitIntoThread,
  type AdaptOptions,
} from './content-adapter.js';
import { createXPost, loadXConfig, type XConfig, type XPost } from './x-api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_DIR = resolve(__dirname, '../..');

export interface PublishTweetOptions {
  /** Raw text or Markdown content */
  content: string;
  /** Optional image URLs — must be https URLs under cdn.gooo.ai. Max 4. */
  mediaUrls?: string[];
  /** Custom hashtags (1-2 recommended) */
  hashtags?: string[];
  /** X config override */
  config?: XConfig;
}

export interface PublishThreadOptions {
  /** Raw text or Markdown content to split into a thread */
  content: string;
  /** Optional image URLs attached to the first tweet only. Max 4, cdn.gooo.ai only. */
  mediaUrls?: string[];
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
  posts: XPost[];
  content: string | string[];
  warnings: string[];
  error?: string;
}

function assertCdnMediaUrls(urls: string[] | undefined, warnings: string[]): string[] | undefined {
  if (!urls?.length) return undefined;
  const valid: string[] = [];
  for (const url of urls) {
    try {
      const parsed = new URL(url);
      if (parsed.hostname === 'cdn.gooo.ai') {
        valid.push(url);
      } else {
        warnings.push(
          `Skipped media URL not under cdn.gooo.ai: ${url} (YouMind backend rejects non-CDN hosts)`,
        );
      }
    } catch {
      warnings.push(`Skipped invalid media URL: ${url}`);
    }
  }
  return valid.length ? valid : undefined;
}

export async function publishTweet(
  options: PublishTweetOptions,
): Promise<PublishResult> {
  const config = options.config ?? loadXConfig();

  if (!config.apiKey) {
    return {
      success: false,
      type: 'tweet',
      posts: [],
      content: options.content,
      warnings: [],
      error: 'youmind.api_key not set in config.yaml',
    };
  }

  const adapted = adaptSingleTweet(options.content, { hashtags: options.hashtags });
  const mediaUrls = assertCdnMediaUrls(options.mediaUrls, adapted.warnings);

  try {
    const post = await createXPost(config, { text: adapted.text, mediaUrls });
    saveOutput('tweet', { postId: post.postId, text: adapted.text, url: post.url });
    return {
      success: true,
      type: 'tweet',
      posts: [post],
      content: adapted.text,
      warnings: adapted.warnings,
    };
  } catch (err) {
    return {
      success: false,
      type: 'tweet',
      posts: [],
      content: adapted.text,
      warnings: adapted.warnings,
      error: (err as Error).message,
    };
  }
}

export async function publishThread(
  options: PublishThreadOptions,
): Promise<PublishResult> {
  const config = options.config ?? loadXConfig();

  if (!config.apiKey) {
    return {
      success: false,
      type: 'thread',
      posts: [],
      content: [],
      warnings: [],
      error: 'youmind.api_key not set in config.yaml',
    };
  }

  const thread = splitIntoThread(options.content, {
    hashtags: options.hashtags,
    addNumbering: options.addNumbering,
  });

  if (thread.tweets.length === 0) {
    return {
      success: false,
      type: 'thread',
      posts: [],
      content: [],
      warnings: ['No content to post.'],
      error: 'Empty content',
    };
  }

  if (thread.tweets.length === 1) {
    const result = await publishTweet({
      content: thread.tweets[0],
      mediaUrls: options.mediaUrls,
      config,
    });
    return {
      ...result,
      type: 'thread',
      content: [typeof result.content === 'string' ? result.content : thread.tweets[0]],
    };
  }

  const warnings = [...thread.warnings];
  const firstMediaUrls = assertCdnMediaUrls(options.mediaUrls, warnings);
  const posts: XPost[] = [];

  // Chain each tweet to the previous one so X renders the sequence as a
  // native thread instead of independent standalone tweets.
  let previousPostId: string | undefined;
  for (let i = 0; i < thread.tweets.length; i++) {
    try {
      const post = await createXPost(config, {
        text: thread.tweets[i],
        mediaUrls: i === 0 ? firstMediaUrls : undefined,
        replyToPostId: previousPostId,
      });
      posts.push(post);
      previousPostId = post.postId;
      console.log(`Thread ${i + 1}/${thread.tweets.length}: ${post.postId}`);
    } catch (err) {
      return {
        success: false,
        type: 'thread',
        posts,
        content: thread.tweets,
        warnings,
        error: `Tweet ${i + 1}/${thread.tweets.length} failed: ${(err as Error).message}`,
      };
    }
  }

  saveOutput('thread', {
    postIds: posts.map((p) => p.postId),
    tweets: thread.tweets,
    urls: posts.map((p) => p.url),
    warnings,
  });

  return {
    success: true,
    type: 'thread',
    posts,
    content: thread.tweets,
    warnings,
  };
}

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

function saveOutput(type: string, data: Record<string, unknown>): void {
  try {
    const outputDir = resolve(PROJECT_DIR, 'output');
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputPath = resolve(outputDir, `x-${type}-${timestamp}.json`);
    writeFileSync(
      outputPath,
      JSON.stringify({ ...data, timestamp: new Date().toISOString() }, null, 2),
    );
  } catch {
    // Non-critical, ignore
  }
}
