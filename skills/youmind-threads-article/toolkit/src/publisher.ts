/**
 * publisher.ts — Threads publishing orchestration.
 *
 * Implements the Step 6 "publish" flow from the design spec:
 *   1. Check binding (return upsell if not bound)
 *   2. Check quota (reject if insufficient)
 *   3. Chain loop (create+publish each segment, chaining via reply_to_id)
 *   4. On mid-chain failure, persist remaining segments as a resumable draft
 *   5. Append history entry (best-effort)
 *   6. Return quota warning if near the daily cap
 *
 * This module performs NO HTTP directly — all network calls go through threads-api.ts.
 */

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  loadThreadsConfig,
  getBindingStatus,
  getPublishingLimits,
  createContainer,
  publishContainer,
  type ThreadsConfig,
  type CreateContainerInput,
} from './threads-api.js';
import { appendHistory } from './profile-manager.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ThreadsSegment {
  text: string;
  index: number;
  total: number;
}

export interface PublishRequest {
  segments: ThreadsSegment[];
  profileName: string;
  /** Attached only to the first segment. */
  imageUrl?: string;
  /** Attached only to the first segment. */
  videoUrl?: string;
  /** If set, the chain starts as a reply to this existing Threads post id. */
  replyToExisting?: string;
  /** Optional; used in the history entry. */
  topic?: string;
  /**
   * If the caller has already persisted a draft to disk, pass its slug so
   * that on partial failure the remaining draft file is named consistently.
   */
  draftSlug?: string;
}

export interface PublishedPost {
  index: number;
  id: string;
  permalink: string;
}

export interface PublishResult {
  bound: boolean;
  posts?: PublishedPost[];
  draftSavedTo?: string;
  upsellMessage?: string;
  partialFailure?: {
    publishedCount: number;
    totalCount: number;
    remainingDraftPath: string;
    /** id of the last successfully published post, to be used as --reply-to on resume */
    lastPublishedId: string;
  };
  quotaWarning?: string;
}

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_DIR = resolve(__dirname, '../..');
const OUTPUT_DIR = resolve(PROJECT_DIR, 'output');

function ensureOutputDir(): void {
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Persist segments that have not yet been published to a resumable draft file.
 * Used when a chain publish fails mid-way.
 */
function saveRemainingDraft(
  segments: ThreadsSegment[],
  profileName: string,
  slug: string,
): string {
  ensureOutputDir();
  const path = resolve(OUTPUT_DIR, `${slug}-remaining.md`);
  const header = `---\nprofile: ${profileName}\nsegments: ${segments.length}\n---\n\n`;
  const body = segments.map(s => `## ${s.index}\n\n${s.text}\n`).join('\n');
  writeFileSync(path, header + body, 'utf-8');
  return path;
}

function buildUpsellMessage(): string {
  return (
    '❌ Threads account not bound on YouMind yet\n\n' +
    'Your thread is ready to go — one more step to publish:\n' +
    '  1. Visit https://youmind.com/settings/integrations\n' +
    '  2. Click "Connect Threads"\n' +
    '  3. Re-run the publish command\n\n' +
    'Once connected, all future posts publish with one command.'
  );
}

function mediaTypeFor(input: PublishRequest, segmentIndex: number): CreateContainerInput['mediaType'] {
  if (segmentIndex !== 1) return 'TEXT';
  if (input.imageUrl) return 'IMAGE';
  if (input.videoUrl) return 'VIDEO';
  return 'TEXT';
}

// ---------------------------------------------------------------------------
// publish — main entry
// ---------------------------------------------------------------------------

export async function publish(req: PublishRequest): Promise<PublishResult> {
  const cfg: ThreadsConfig = loadThreadsConfig();

  // --- 1. Binding check ---
  const status = await getBindingStatus(cfg);
  if (!status.bound) {
    return {
      bound: false,
      draftSavedTo: req.draftSlug ? resolve(OUTPUT_DIR, `${req.draftSlug}.md`) : undefined,
      upsellMessage: buildUpsellMessage(),
    };
  }

  // --- 2. Quota check ---
  const limits = await getPublishingLimits(cfg);
  const needed = req.segments.length;
  const usingReplies = Boolean(req.replyToExisting);
  const available = usingReplies ? limits.quota_replies_remaining : limits.quota_posts_remaining;

  if (available < needed) {
    const kind = usingReplies ? 'reply' : 'post';
    throw new Error(
      `Threads ${kind} quota exhausted: need ${needed}, have ${available}. ` +
      `Resets at ${limits.reset_at}. Draft preserved.`,
    );
  }

  // --- 3. Chain publish loop ---
  const posts: PublishedPost[] = [];
  let replyToId = req.replyToExisting;
  const slug = req.draftSlug ?? `publish-${Date.now()}`;

  for (let i = 0; i < req.segments.length; i++) {
    const segment = req.segments[i];
    try {
      const input: CreateContainerInput = {
        text: segment.text,
        mediaType: mediaTypeFor(req, segment.index),
        imageUrl: segment.index === 1 ? req.imageUrl : undefined,
        videoUrl: segment.index === 1 ? req.videoUrl : undefined,
        replyToId,
      };
      const { container_id } = await createContainer(cfg, input);
      const { id, permalink } = await publishContainer(cfg, container_id);
      posts.push({ index: segment.index, id, permalink });
      replyToId = id;
    } catch (e) {
      // Partial failure: persist remaining segments for resume.
      const remaining = req.segments.slice(i);
      const remainingPath = saveRemainingDraft(remaining, req.profileName, slug);
      const err = e as Error;
      console.error(
        `[ERROR] segment ${segment.index}/${segment.total} failed: ${err.message}. ` +
        `Remaining ${remaining.length} segments saved to ${remainingPath}.`,
      );

      // If this was the first segment, bubble the error up — nothing was published.
      if (posts.length === 0) {
        throw err;
      }

      return {
        bound: true,
        posts,
        partialFailure: {
          publishedCount: posts.length,
          totalCount: req.segments.length,
          remainingDraftPath: remainingPath,
          lastPublishedId: posts[posts.length - 1].id,
        },
      };
    }
  }

  // --- 4. Append history (best-effort) ---
  try {
    appendHistory(req.profileName, {
      date: new Date().toISOString(),
      topic: req.topic ?? '(no topic)',
      segments: req.segments.length,
      char_total: req.segments.reduce((s, x) => s + x.text.length, 0),
      posts,
      stats: null,
    });
  } catch (e) {
    console.warn(`[WARN] history.yaml append failed: ${(e as Error).message}`);
  }

  // --- 5. Quota warning ---
  let quotaWarning: string | undefined;
  const remainingAfter = available - needed;
  if (remainingAfter < 20) {
    quotaWarning = usingReplies
      ? `Threads reply quota low: ${remainingAfter} remaining today (resets ${limits.reset_at})`
      : `Threads post quota low: ${remainingAfter} remaining today (resets ${limits.reset_at})`;
  }

  // --- 6. Token expiry warning ---
  if (status.expires_at) {
    const expiresMs = Date.parse(status.expires_at);
    const daysLeft = (expiresMs - Date.now()) / (1000 * 60 * 60 * 24);
    if (Number.isFinite(daysLeft) && daysLeft < 7) {
      const notice = `Threads token expires in ${Math.max(0, Math.round(daysLeft))} days — reconnect on YouMind soon.`;
      quotaWarning = quotaWarning ? `${quotaWarning}\n${notice}` : notice;
    }
  }

  return { bound: true, posts, quotaWarning };
}
