/**
 * publisher.ts — calls YouMind /wechat/createDraft proxy.
 *
 * Backwards-compatible signature: existing cli.ts callers pass
 * { accessToken, title, html, digest, thumbMediaId, author }. The
 * accessToken field is ignored (YouMind manages tokens server-side); the
 * rest is forwarded as the first article in a 1-article createDraft call.
 */

import { createDraftFull } from './wechat-api.js';

export interface DraftResult {
  mediaId: string;
  resultLinks?: Array<{
    label: string;
    kind: string;
    url: string;
  }>;
}

export interface CreateDraftOptions {
  /** Ignored — YouMind manages access_token. Kept for backwards compat. */
  accessToken?: string;
  title: string;
  html: string;
  digest: string;
  thumbMediaId?: string;
  author?: string;
  needOpenComment?: 0 | 1;
  onlyFansCanComment?: 0 | 1;
  contentSourceUrl?: string;
}

export async function createDraft(options: CreateDraftOptions): Promise<DraftResult> {
  if (!options.thumbMediaId) {
    throw new Error(
      'createDraft requires thumbMediaId. Call uploadThumb(_, coverImagePath) first to get a media_id.',
    );
  }
  const draft = await createDraftFull([
    {
      title: options.title,
      content: options.html,
      thumbMediaId: options.thumbMediaId,
      author: options.author,
      digest: options.digest,
      contentSourceUrl: options.contentSourceUrl,
      needOpenComment: options.needOpenComment,
      onlyFansCanComment: options.onlyFansCanComment,
    },
  ]);
  return { mediaId: draft.mediaId, resultLinks: draft.resultLinks };
}
