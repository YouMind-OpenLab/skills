/**
 * X (Twitter) content adaptation module.
 *
 * Handles:
 * - Single tweet: 280 character limit (URLs = 23 chars)
 * - Thread splitting algorithm with smart paragraph boundaries
 * - Tweet numbering (1/N format)
 * - Hashtag management (1-2 max)
 * - Long-form article support (25K chars, X Premium)
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TWEET_CHAR_LIMIT = 280;
const URL_CHAR_COUNT = 23; // X counts all URLs as 23 chars
const THREAD_NUMBER_OVERHEAD = 6; // " (1/N)" at the end, max 6 chars for small threads
const LONG_FORM_LIMIT = 25_000;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SingleTweetResult {
  text: string;
  charCount: number;
  wasTruncated: boolean;
  warnings: string[];
}

export interface ThreadResult {
  tweets: string[];
  totalTweets: number;
  totalChars: number;
  warnings: string[];
}

export interface AdaptOptions {
  /** Maximum chars per tweet (default: 280) */
  maxChars?: number;
  /** Hashtags to include (1-2 recommended) */
  hashtags?: string[];
  /** Whether to add thread numbering */
  addNumbering?: boolean;
  /** Force long-form article mode (X Premium, 25K chars) */
  longForm?: boolean;
}

// ---------------------------------------------------------------------------
// URL handling
// ---------------------------------------------------------------------------

const URL_REGEX = /https?:\/\/[^\s)]+/g;

/**
 * Calculate the "weighted" character count where URLs count as 23 chars.
 */
export function weightedCharCount(text: string): number {
  const urls = text.match(URL_REGEX) || [];
  let count = text.length;
  for (const url of urls) {
    // Each URL is counted as 23 chars regardless of length
    count = count - url.length + URL_CHAR_COUNT;
  }
  return count;
}

// ---------------------------------------------------------------------------
// Single tweet adaptation
// ---------------------------------------------------------------------------

/**
 * Adapt content for a single tweet (280 chars).
 */
export function adaptSingleTweet(
  content: string,
  options: AdaptOptions = {},
): SingleTweetResult {
  const maxChars = options.maxChars ?? TWEET_CHAR_LIMIT;
  const warnings: string[] = [];

  // Strip Markdown formatting
  let text = stripMarkdown(content).trim();

  // Add hashtags
  if (options.hashtags?.length) {
    const hashtagStr = options.hashtags
      .slice(0, 2) // Max 2 hashtags on X
      .map((h) => (h.startsWith('#') ? h : `#${h}`))
      .join(' ');
    text = text + '\n\n' + hashtagStr;
  }

  // Check length
  let wasTruncated = false;
  const weighted = weightedCharCount(text);

  if (weighted > maxChars) {
    wasTruncated = true;
    text = truncateToLimit(text, maxChars);
    warnings.push(
      `Tweet truncated from ${weighted} to ${weightedCharCount(text)} chars (limit: ${maxChars}).`,
    );
  }

  return {
    text,
    charCount: weightedCharCount(text),
    wasTruncated,
    warnings,
  };
}

// ---------------------------------------------------------------------------
// Thread splitting
// ---------------------------------------------------------------------------

/**
 * Split long-form content into a thread of tweets.
 *
 * Algorithm:
 * 1. Split on paragraph boundaries
 * 2. Each tweet <= 280 chars (including numbering)
 * 3. First tweet = hook, last = CTA/summary
 * 4. Each tweet should make sense standalone
 */
export function splitIntoThread(
  content: string,
  options: AdaptOptions = {},
): ThreadResult {
  const maxChars = options.maxChars ?? TWEET_CHAR_LIMIT;
  const addNumbering = options.addNumbering !== false;
  const warnings: string[] = [];

  // Strip Markdown
  let text = stripMarkdown(content).trim();

  // Split into paragraphs
  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim().length > 0);

  if (paragraphs.length === 0) {
    return { tweets: [], totalTweets: 0, totalChars: 0, warnings: ['Empty content.'] };
  }

  // Estimate total tweets for numbering overhead
  const estimatedTweets = Math.max(
    Math.ceil(text.length / (maxChars - THREAD_NUMBER_OVERHEAD - 2)),
    paragraphs.length,
  );
  const numberingLen = addNumbering
    ? ` (${estimatedTweets}/${estimatedTweets})`.length
    : 0;
  const effectiveMax = maxChars - numberingLen;

  // Build tweets by fitting paragraphs
  const tweets: string[] = [];
  let currentTweet = '';

  for (const para of paragraphs) {
    const trimmedPara = para.trim();

    if (weightedCharCount(trimmedPara) > effectiveMax) {
      // Paragraph too long -- split by sentences
      if (currentTweet) {
        tweets.push(currentTweet.trim());
        currentTweet = '';
      }

      const sentences = splitSentences(trimmedPara);
      for (const sentence of sentences) {
        const candidate = currentTweet
          ? currentTweet + ' ' + sentence
          : sentence;

        if (weightedCharCount(candidate) <= effectiveMax) {
          currentTweet = candidate;
        } else {
          if (currentTweet) {
            tweets.push(currentTweet.trim());
          }
          // If a single sentence exceeds limit, force-truncate
          if (weightedCharCount(sentence) > effectiveMax) {
            tweets.push(truncateToLimit(sentence, effectiveMax));
            currentTweet = '';
            warnings.push('A sentence exceeded the character limit and was truncated.');
          } else {
            currentTweet = sentence;
          }
        }
      }
    } else {
      // Try to fit paragraph into current tweet
      const candidate = currentTweet
        ? currentTweet + '\n\n' + trimmedPara
        : trimmedPara;

      if (weightedCharCount(candidate) <= effectiveMax) {
        currentTweet = candidate;
      } else {
        // Current tweet is full, start new one
        if (currentTweet) {
          tweets.push(currentTweet.trim());
        }
        currentTweet = trimmedPara;
      }
    }
  }

  // Don't forget the last tweet
  if (currentTweet.trim()) {
    tweets.push(currentTweet.trim());
  }

  // Add hashtags to the last tweet if they fit
  if (options.hashtags?.length && tweets.length > 0) {
    const hashtagStr = options.hashtags
      .slice(0, 2)
      .map((h) => (h.startsWith('#') ? h : `#${h}`))
      .join(' ');
    const lastIdx = tweets.length - 1;
    const candidate = tweets[lastIdx] + '\n\n' + hashtagStr;
    if (weightedCharCount(candidate) + numberingLen <= maxChars) {
      tweets[lastIdx] = candidate;
    } else {
      // Add as separate final tweet
      tweets.push(hashtagStr);
    }
  }

  // Add numbering
  const total = tweets.length;
  if (addNumbering && total > 1) {
    for (let i = 0; i < total; i++) {
      tweets[i] = `${tweets[i]}\n\n${i + 1}/${total}`;
    }
  }

  // Validate all tweets are within limit
  for (let i = 0; i < tweets.length; i++) {
    const wc = weightedCharCount(tweets[i]);
    if (wc > maxChars) {
      warnings.push(`Tweet ${i + 1} is ${wc} chars (limit: ${maxChars}). May need manual editing.`);
    }
  }

  const totalChars = tweets.reduce((sum, t) => sum + weightedCharCount(t), 0);

  return {
    tweets,
    totalTweets: tweets.length,
    totalChars,
    warnings,
  };
}

// ---------------------------------------------------------------------------
// Long-form article (X Premium)
// ---------------------------------------------------------------------------

/**
 * Adapt for X long-form article (Premium feature, 25K chars).
 */
export function adaptLongForm(
  content: string,
  options: AdaptOptions = {},
): { text: string; charCount: number; wasTruncated: boolean; warnings: string[] } {
  const maxChars = LONG_FORM_LIMIT;
  const warnings: string[] = [];

  // Long-form supports Markdown, so keep it
  let text = content.trim();

  // Add hashtags
  if (options.hashtags?.length) {
    const hashtagStr = options.hashtags
      .map((h) => (h.startsWith('#') ? h : `#${h}`))
      .join(' ');
    text = text + '\n\n' + hashtagStr;
  }

  let wasTruncated = false;
  if (text.length > maxChars) {
    wasTruncated = true;
    text = text.slice(0, maxChars - 3) + '...';
    warnings.push(`Content truncated to ${maxChars} characters (X Premium long-form limit).`);
  }

  return {
    text,
    charCount: text.length,
    wasTruncated,
    warnings,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Strip Markdown syntax to plain text. */
function stripMarkdown(md: string): string {
  let text = md;

  // Remove headers
  text = text.replace(/^#{1,6}\s+/gm, '');

  // Bold/italic -> plain
  text = text.replace(/\*\*(.+?)\*\*/g, '$1');
  text = text.replace(/__(.+?)__/g, '$1');
  text = text.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '$1');
  text = text.replace(/(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/g, '$1');

  // Inline code
  text = text.replace(/`([^`]+)`/g, '$1');

  // Code blocks
  text = text.replace(/```[\s\S]*?```/g, '');

  // Links: [text](url) -> text url
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 $2');

  // Images
  text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, '');

  // Horizontal rules
  text = text.replace(/^[-*_]{3,}$/gm, '');

  // Blockquotes
  text = text.replace(/^>\s?/gm, '');

  // List markers
  text = text.replace(/^[\s]*[-*]\s+/gm, '- ');
  text = text.replace(/^[\s]*(\d+)\.\s+/gm, '$1. ');

  // Collapse extra whitespace
  text = text.replace(/\n{3,}/g, '\n\n');

  return text.trim();
}

/** Split text into sentences. */
function splitSentences(text: string): string[] {
  // Split on sentence-ending punctuation followed by space
  const parts = text.split(/(?<=[.!?])\s+/);
  return parts.filter((s) => s.trim().length > 0);
}

/** Truncate text to fit within a character limit (weighted). */
function truncateToLimit(text: string, limit: number): string {
  if (weightedCharCount(text) <= limit) return text;

  // Try truncating at sentence boundary
  const sentences = splitSentences(text);
  let result = '';
  for (const sentence of sentences) {
    const candidate = result ? result + ' ' + sentence : sentence;
    if (weightedCharCount(candidate) <= limit - 1) {
      result = candidate;
    } else {
      break;
    }
  }

  if (result) return result;

  // Hard truncate
  let truncated = text;
  while (weightedCharCount(truncated + '...') > limit && truncated.length > 0) {
    // Remove last word
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > 0) {
      truncated = truncated.slice(0, lastSpace);
    } else {
      truncated = truncated.slice(0, truncated.length - 1);
    }
  }

  return truncated + '...';
}
