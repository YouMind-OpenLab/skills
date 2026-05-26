/**
 * X (Twitter) publishing orchestrator via YouMind OpenAPI.
 *
 * Content adaptation (280-char clamp + thread splitting) lives here. The
 * actual HTTP call is `createXPost` from `./x-api.js`. Threads are built
 * natively by chaining each tweet as a reply to the previous one (via
 * `replyToPostId`), so X renders the sequence as a proper thread.
 */

import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  adaptSingleTweet,
  splitIntoThread,
  type AdaptOptions,
} from './content-adapter.js';
import {
  createXPost,
  loadXConfig,
  uploadXMedia,
  type XConfig,
  type XPost,
} from './x-api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_DIR = resolve(__dirname, '../..');

export interface PublishTweetOptions {
  /** Raw text or Markdown content */
  content: string;
  /** Optional local image paths or cdn.gooo.ai URLs. Max 4. */
  mediaUrls?: string[];
  /** Custom hashtags (1-2 recommended) */
  hashtags?: string[];
  /** X config override */
  config?: XConfig;
}

export interface PublishThreadOptions {
  /** Raw text or Markdown content to split into a thread */
  content: string;
  /** Optional local image paths or cdn.gooo.ai URLs attached to the first tweet only. Max 4. */
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

const MIME_BY_EXTENSION = new Map<string, string>([
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.png', 'image/png'],
  ['.gif', 'image/gif'],
  ['.webp', 'image/webp'],
]);

async function prepareMedia(
  inputs: string[] | undefined,
  config: XConfig,
): Promise<{ mediaUrls?: string[]; mediaIds?: string[] }> {
  if (!inputs?.length) {
    return {};
  }

  const mediaUrls: string[] = [];
  const mediaIds: string[] = [];

  for (const input of inputs) {
    const remoteUrl = parseAnyRemoteUrl(input);
    if (remoteUrl) {
      if (remoteUrl.hostname === 'cdn.gooo.ai') {
        mediaUrls.push(input);
      }
      continue;
    }

    const localPath = resolve(input);
    if (!existsSync(localPath)) {
      throw new Error(`Local image not found: ${localPath}`);
    }
    if (!statSync(localPath).isFile()) {
      throw new Error(`Local image is not a file: ${localPath}`);
    }

    const filename = basename(localPath);
    const contentType = inferMimeType(filename);
    if (!contentType) {
      throw new Error(
        `Unsupported local image type for X upload: ${filename} (allowed: jpg, jpeg, png, gif, webp)`,
      );
    }

    const uploaded = await uploadXMedia(config, {
      filename,
      contentBase64: readFileSync(localPath).toString('base64'),
      contentType,
    });
    mediaIds.push(uploaded.mediaId);
  }

  return {
    mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
    mediaIds: mediaIds.length > 0 ? mediaIds : undefined,
  };
}

function parseAnyRemoteUrl(input: string): URL | null {
  try {
    return new URL(input);
  } catch {
    return null;
  }
}

function collectRemoteWarnings(inputs: string[] | undefined, warnings: string[]): void {
  if (!inputs?.length) return;
  for (const input of inputs) {
    try {
      const parsed = new URL(input);
      if (parsed.hostname !== 'cdn.gooo.ai') {
        warnings.push(
          `Skipped media URL not under cdn.gooo.ai: ${input} (use a local file path or upload to YouMind CDN first)`,
        );
      }
    } catch {
      // 本地路径由 prepareMedia 继续处理，不在这里报 warning
    }
  }
}

function inferMimeType(filename: string): string | undefined {
  return MIME_BY_EXTENSION.get(extname(filename).toLowerCase());
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
      error: 'youmind.api_key not set. Configure ~/.youmind/config.yaml.',
    };
  }

  const adapted = adaptSingleTweet(options.content, { hashtags: options.hashtags });
  collectRemoteWarnings(options.mediaUrls, adapted.warnings);

  try {
    const media = await prepareMedia(options.mediaUrls, config);
    const post = await createXPost(config, {
      text: adapted.text,
      mediaUrls: media.mediaUrls,
      mediaIds: media.mediaIds,
    });
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
      error: 'youmind.api_key not set. Configure ~/.youmind/config.yaml.',
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
  collectRemoteWarnings(options.mediaUrls, warnings);
  const posts: XPost[] = [];

  try {
    const firstTweetMedia = await prepareMedia(options.mediaUrls, config);

    // Chain each tweet to the previous one so X renders the sequence as a
    // native thread instead of independent standalone tweets.
    let previousPostId: string | undefined;
    for (let i = 0; i < thread.tweets.length; i++) {
      try {
        const post = await createXPost(config, {
          text: thread.tweets[i],
          mediaUrls: i === 0 ? firstTweetMedia.mediaUrls : undefined,
          mediaIds: i === 0 ? firstTweetMedia.mediaIds : undefined,
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
  } catch (err) {
    return {
      success: false,
      type: 'thread',
      posts,
      content: thread.tweets,
      warnings,
      error: (err as Error).message,
    };
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
