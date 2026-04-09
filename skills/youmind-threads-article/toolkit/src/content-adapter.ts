/**
 * Content adapter — text cleaning, segment validation, hashtag application, media URL validation.
 *
 * Pure utilities. The agent uses these at write-time to ensure segments are valid
 * before passing them to the publisher. Only validateImageUrl / validateVideoUrl
 * touch the network (HEAD requests to check Content-Type and Content-Length).
 *
 * Threads constraints (from Meta official docs):
 *   Text:  ≤ 500 chars per post, ≤ 5 URLs per post
 *   Image: JPEG/PNG, ≤ 8 MB
 *   Video: MP4/MOV, ≤ 1 GB
 */

// ---------------------------------------------------------------------------
// Constants — Meta Threads hard limits
// ---------------------------------------------------------------------------

const MAX_CHARS_PER_POST = 500;
const MAX_URLS_PER_POST = 5;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;          // 8 MB
const MAX_VIDEO_BYTES = 1024 * 1024 * 1024;       // 1 GB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime']; // quicktime = .mov

// URL extraction pattern (simple but covers http/https)
const URL_REGEX = /https?:\/\/\S+/gi;

// ---------------------------------------------------------------------------
// cleanText — strip markdown/HTML, collapse whitespace
// ---------------------------------------------------------------------------

/**
 * Strip markdown/HTML markup and collapse whitespace.
 * Does NOT split — returns a single cleaned string.
 */
export function cleanText(raw: string): string {
  let result = raw;

  // HTML tags
  result = result.replace(/<[^>]+>/g, '');

  // Headings (keep text)
  result = result.replace(/^#{1,6}\s+/gm, '');

  // Bold / italic
  result = result.replace(/\*\*\*(.*?)\*\*\*/g, '$1');
  result = result.replace(/\*\*(.*?)\*\*/g, '$1');
  result = result.replace(/\*(.*?)\*/g, '$1');
  result = result.replace(/___(.*?)___/g, '$1');
  result = result.replace(/__(.*?)__/g, '$1');
  result = result.replace(/_(.*?)_/g, '$1');

  // Inline code
  result = result.replace(/`([^`]+)`/g, '$1');

  // Fenced code blocks
  result = result.replace(/```[\s\S]*?```/g, '');

  // Images — keep alt text
  result = result.replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1');

  // Links — "text (url)"
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)');

  // Blockquotes
  result = result.replace(/^>\s*/gm, '');

  // Horizontal rules
  result = result.replace(/^[-*_]{3,}\s*$/gm, '');

  // List markers
  result = result.replace(/^\s*[-*+]\s+/gm, '');
  result = result.replace(/^\s*\d+\.\s+/gm, '');

  // Collapse 3+ blank lines to 2
  result = result.replace(/\n{3,}/g, '\n\n');

  // Collapse runs of spaces/tabs (but keep newlines)
  result = result.replace(/[ \t]+/g, ' ');

  return result.trim();
}

// ---------------------------------------------------------------------------
// validateSegment — check ≤500 chars, ≤5 URLs
// ---------------------------------------------------------------------------

export interface SegmentValidation {
  ok: boolean;
  error?: string;
}

/**
 * Check a single segment against Threads per-post limits.
 * Meta counts characters by code units (UTF-16), which matches
 * JavaScript's String.prototype.length for most content including emoji pairs.
 * For grapheme-perfect counting we'd need Intl.Segmenter — out of scope for v1.
 */
export function validateSegment(text: string): SegmentValidation {
  const len = text.length;
  if (len === 0) {
    return { ok: false, error: 'Segment is empty' };
  }
  if (len > MAX_CHARS_PER_POST) {
    return { ok: false, error: `Segment is ${len} chars, max is ${MAX_CHARS_PER_POST}` };
  }

  const urlMatches = text.match(URL_REGEX);
  const urlCount = urlMatches?.length ?? 0;
  if (urlCount > MAX_URLS_PER_POST) {
    return { ok: false, error: `Segment has ${urlCount} URLs, max is ${MAX_URLS_PER_POST}` };
  }

  return { ok: true };
}

// ---------------------------------------------------------------------------
// appendHashtags — inline / trailing / none
// ---------------------------------------------------------------------------

export type HashtagStrategy = 'inline' | 'trailing' | 'none';

/**
 * Append hashtags to a final segment according to the profile's strategy.
 *
 * - 'none':     return text unchanged, ignore hashtags
 * - 'trailing': append hashtags on a new line at the end
 * - 'inline':   weave the first hashtag into the end of the last sentence,
 *               append the rest trailing
 */
export function appendHashtags(
  text: string,
  hashtags: string[],
  strategy: HashtagStrategy,
): string {
  if (strategy === 'none' || hashtags.length === 0) {
    return text;
  }

  const normalized = hashtags.map(h => (h.startsWith('#') ? h : `#${h}`));

  if (strategy === 'trailing') {
    return `${text}\n\n${normalized.join(' ')}`;
  }

  // inline: first tag at end of last sentence, rest trailing
  const [first, ...rest] = normalized;
  const inlined = `${text} ${first}`;
  if (rest.length === 0) {
    return inlined;
  }
  return `${inlined}\n\n${rest.join(' ')}`;
}

// ---------------------------------------------------------------------------
// validateImageUrl / validateVideoUrl — HEAD request checks
// ---------------------------------------------------------------------------

export interface MediaValidation {
  ok: boolean;
  error?: string;
}

async function headRequest(url: string): Promise<{ contentType: string; contentLength: number }> {
  const resp = await fetch(url, {
    method: 'HEAD',
    signal: AbortSignal.timeout(10_000),
  });
  if (!resp.ok) {
    throw new Error(`HEAD ${url} failed with status ${resp.status}`);
  }
  const contentType = (resp.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
  const contentLengthRaw = resp.headers.get('content-length');
  const contentLength = contentLengthRaw ? parseInt(contentLengthRaw, 10) : NaN;
  return { contentType, contentLength };
}

/**
 * Validate an image URL against Meta Threads client-detectable constraints:
 * format (JPEG/PNG) and file size (≤ 8 MB). Cannot check pixel dimensions
 * or aspect ratio client-side — those are enforced server-side by Meta.
 */
export async function validateImageUrl(url: string): Promise<MediaValidation> {
  try {
    const { contentType, contentLength } = await headRequest(url);

    if (!contentType) {
      return { ok: false, error: 'Image URL did not return a Content-Type header' };
    }
    if (!ALLOWED_IMAGE_TYPES.includes(contentType)) {
      return {
        ok: false,
        error: `Image format ${contentType} not supported. Threads requires JPEG or PNG.`,
      };
    }
    if (Number.isFinite(contentLength) && contentLength > MAX_IMAGE_BYTES) {
      return {
        ok: false,
        error: `Image is ${Math.round(contentLength / 1024 / 1024)} MB, max is 8 MB.`,
      };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: `Image URL check failed: ${(e as Error).message}` };
  }
}

/**
 * Validate a video URL against client-detectable constraints: container
 * (MP4/MOV) and file size (≤ 1 GB). Duration, frame rate, and resolution
 * are enforced server-side by Meta.
 */
export async function validateVideoUrl(url: string): Promise<MediaValidation> {
  try {
    const { contentType, contentLength } = await headRequest(url);

    if (!contentType) {
      return { ok: false, error: 'Video URL did not return a Content-Type header' };
    }
    if (!ALLOWED_VIDEO_TYPES.includes(contentType)) {
      return {
        ok: false,
        error: `Video format ${contentType} not supported. Threads requires MP4 or MOV.`,
      };
    }
    if (Number.isFinite(contentLength) && contentLength > MAX_VIDEO_BYTES) {
      return {
        ok: false,
        error: `Video is ${Math.round(contentLength / 1024 / 1024)} MB, max is 1 GB.`,
      };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: `Video URL check failed: ${(e as Error).message}` };
  }
}
