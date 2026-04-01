/**
 * Reddit publishing orchestrator.
 *
 * Coordinates content adaptation, subreddit analysis, and post submission.
 */

import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  submitSelfPost,
  submitLink,
  getSubredditRules,
  getFlairs,
  getMe,
  loadRedditConfig,
  type RedditConfig,
  type SubmitOptions,
  type SubredditFlair,
  type SubredditRule,
} from './reddit-api.js';
import {
  adaptForReddit,
  getSubredditTone,
  analyzeTitle,
  type AdaptOptions,
} from './content-adapter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_DIR = resolve(__dirname, '../..');

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PublishSelfPostOptions {
  /** Target subreddit (without r/ prefix) */
  subreddit: string;
  /** Post title */
  title: string;
  /** Post body (Markdown) */
  content: string;
  /** Flair ID or text */
  flairId?: string;
  flairText?: string;
  /** Custom TL;DR */
  tldr?: string;
  /** Discussion question to append */
  discussionQuestion?: string;
  /** Reddit config override */
  config?: RedditConfig;
}

export interface PublishLinkOptions {
  /** Target subreddit */
  subreddit: string;
  /** Post title */
  title: string;
  /** Link URL */
  url: string;
  /** Flair */
  flairId?: string;
  flairText?: string;
  /** Reddit config override */
  config?: RedditConfig;
}

export interface PublishResult {
  success: boolean;
  postId?: string;
  postUrl?: string;
  title: string;
  subreddit: string;
  suggestedFlair: string | null;
  warnings: string[];
  error?: string;
}

export interface SubredditAnalysis {
  rules: SubredditRule[];
  flairs: SubredditFlair[];
  tone: ReturnType<typeof getSubredditTone>;
}

// ---------------------------------------------------------------------------
// Subreddit analysis
// ---------------------------------------------------------------------------

/**
 * Analyze a subreddit: fetch rules, flairs, and get tone guidance.
 */
export async function analyzeSubreddit(
  subreddit: string,
  config?: RedditConfig,
): Promise<SubredditAnalysis> {
  const cfg = config ?? loadRedditConfig();

  const [rules, flairs] = await Promise.all([
    getSubredditRules(cfg, subreddit).catch(() => [] as SubredditRule[]),
    getFlairs(cfg, subreddit).catch(() => [] as SubredditFlair[]),
  ]);

  const tone = getSubredditTone(subreddit);

  return { rules, flairs, tone };
}

// ---------------------------------------------------------------------------
// Publish self post
// ---------------------------------------------------------------------------

/**
 * Full publishing pipeline for a self-post.
 */
export async function publishSelfPost(
  options: PublishSelfPostOptions,
): Promise<PublishResult> {
  const config = options.config ?? loadRedditConfig();

  // Step 1: Adapt content
  const adaptOptions: AdaptOptions = {
    subreddit: options.subreddit,
    addTldr: true,
    tldrText: options.tldr,
    discussionQuestion: options.discussionQuestion,
  };

  const adapted = adaptForReddit(options.title, options.content, adaptOptions);

  // Step 2: Submit
  try {
    const submitOptions: SubmitOptions = {
      flairId: options.flairId,
      flairText: options.flairText,
      sendReplies: true,
    };

    const post = await submitSelfPost(
      config,
      options.subreddit,
      adapted.title,
      adapted.body,
      submitOptions,
    );

    // Step 3: Save output
    saveOutput(options.subreddit, {
      postId: post.id,
      postUrl: post.permalink,
      title: adapted.title,
      suggestedFlair: adapted.suggestedFlair,
      warnings: adapted.warnings,
    });

    return {
      success: true,
      postId: post.id,
      postUrl: post.permalink,
      title: adapted.title,
      subreddit: options.subreddit,
      suggestedFlair: adapted.suggestedFlair,
      warnings: adapted.warnings,
    };
  } catch (err) {
    return {
      success: false,
      title: adapted.title,
      subreddit: options.subreddit,
      suggestedFlair: adapted.suggestedFlair,
      warnings: adapted.warnings,
      error: (err as Error).message,
    };
  }
}

// ---------------------------------------------------------------------------
// Publish link post
// ---------------------------------------------------------------------------

/**
 * Publish a link post.
 */
export async function publishLinkPost(
  options: PublishLinkOptions,
): Promise<PublishResult> {
  const config = options.config ?? loadRedditConfig();

  // Analyze title
  const titleAnalysis = analyzeTitle(options.title);
  const warnings = titleAnalysis.suggestions;

  try {
    const post = await submitLink(
      config,
      options.subreddit,
      options.title,
      options.url,
      {
        flairId: options.flairId,
        flairText: options.flairText,
        sendReplies: true,
      },
    );

    saveOutput(options.subreddit, {
      postId: post.id,
      postUrl: post.permalink,
      title: options.title,
      linkUrl: options.url,
      warnings,
    });

    return {
      success: true,
      postId: post.id,
      postUrl: post.permalink,
      title: options.title,
      subreddit: options.subreddit,
      suggestedFlair: null,
      warnings,
    };
  } catch (err) {
    return {
      success: false,
      title: options.title,
      subreddit: options.subreddit,
      suggestedFlair: null,
      warnings,
      error: (err as Error).message,
    };
  }
}

// ---------------------------------------------------------------------------
// Preview
// ---------------------------------------------------------------------------

/**
 * Preview adapted content without publishing.
 */
export function preview(
  title: string,
  content: string,
  options: AdaptOptions = {},
): {
  title: string;
  body: string;
  charCount: number;
  suggestedFlair: string | null;
  warnings: string[];
} {
  const adapted = adaptForReddit(title, content, options);
  return {
    title: adapted.title,
    body: adapted.body,
    charCount: adapted.finalLength,
    suggestedFlair: adapted.suggestedFlair,
    warnings: adapted.warnings,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function saveOutput(subreddit: string, data: Record<string, unknown>): void {
  try {
    const outputDir = resolve(PROJECT_DIR, 'output');
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputPath = resolve(outputDir, `reddit-${subreddit}-${timestamp}.json`);
    writeFileSync(outputPath, JSON.stringify({ ...data, timestamp: new Date().toISOString() }, null, 2));
  } catch {
    // Non-critical, ignore
  }
}
