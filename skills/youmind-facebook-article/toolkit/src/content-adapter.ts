/**
 * Content adapter — transforms article/markdown content into Facebook-optimized post format.
 *
 * Facebook posts are PLAIN TEXT (no markdown rendering). This adapter:
 * - Strips markdown syntax
 * - Adds emoji-enhanced structure
 * - Creates scroll-stopping hook lines
 * - Formats for maximum engagement
 * - Keeps within Facebook's character limits
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FacebookContent {
  /** The full post text, ready to publish */
  text: string;
  /** Extracted or generated title/hook */
  title: string;
  /** Hashtags for the post */
  hashtags: string[];
}

export interface AdaptOptions {
  /** Raw content (markdown or plain text) */
  content: string;
  /** Topic or title for the post */
  topic?: string;
  /** Optional hashtags to include */
  hashtags?: string[];
  /** Optional link to include */
  link?: string;
  /** Maximum character count (default: 500 for optimal engagement) */
  maxChars?: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Facebook's absolute maximum post length */
const FB_MAX_CHARS = 63206;

/** Optimal length for engagement (40-80 words, roughly 250-500 chars) */
const FB_OPTIMAL_MAX = 500;

// ---------------------------------------------------------------------------
// Markdown stripping
// ---------------------------------------------------------------------------

function stripMarkdown(text: string): string {
  let result = text;

  // Remove HTML tags
  result = result.replace(/<[^>]+>/g, '');

  // Remove headings markup (keep text)
  result = result.replace(/^#{1,6}\s+/gm, '');

  // Remove bold/italic
  result = result.replace(/\*\*\*(.*?)\*\*\*/g, '$1');
  result = result.replace(/\*\*(.*?)\*\*/g, '$1');
  result = result.replace(/\*(.*?)\*/g, '$1');
  result = result.replace(/___(.*?)___/g, '$1');
  result = result.replace(/__(.*?)__/g, '$1');
  result = result.replace(/_(.*?)_/g, '$1');

  // Remove inline code
  result = result.replace(/`([^`]+)`/g, '$1');

  // Remove code blocks
  result = result.replace(/```[\s\S]*?```/g, '');

  // Remove images
  result = result.replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1');

  // Convert links to text + URL
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)');

  // Remove blockquotes
  result = result.replace(/^>\s*/gm, '');

  // Remove horizontal rules
  result = result.replace(/^[-*_]{3,}\s*$/gm, '');

  // Remove list markers, replace with emoji bullets
  result = result.replace(/^\s*[-*+]\s+/gm, '\u2022 ');
  result = result.replace(/^\s*\d+\.\s+/gm, '\u2022 ');

  // Collapse multiple blank lines
  result = result.replace(/\n{3,}/g, '\n\n');

  return result.trim();
}

// ---------------------------------------------------------------------------
// Content structuring
// ---------------------------------------------------------------------------

function extractHook(content: string, topic?: string): string {
  // Try to use the first sentence as a hook
  const firstLine = content.split('\n').find(l => l.trim().length > 10);
  if (firstLine && firstLine.trim().length <= 150) {
    return firstLine.trim();
  }

  // Generate a hook from the topic
  if (topic) {
    return topic;
  }

  // Fallback: truncate first paragraph
  const firstPara = content.split('\n\n')[0] ?? '';
  return firstPara.slice(0, 120).trim() + (firstPara.length > 120 ? '...' : '');
}

function formatForFacebook(text: string, maxChars: number): string {
  // Split into paragraphs
  const paragraphs = text.split('\n\n').filter(p => p.trim());

  // Keep paragraphs short — Facebook rewards scannable content
  const formatted: string[] = [];
  let charCount = 0;

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (charCount + trimmed.length + 2 > maxChars) {
      // If we haven't added anything yet, at least add a truncated first paragraph
      if (formatted.length === 0) {
        formatted.push(trimmed.slice(0, maxChars - 3) + '...');
      }
      break;
    }
    formatted.push(trimmed);
    charCount += trimmed.length + 2; // +2 for \n\n
  }

  return formatted.join('\n\n');
}

function buildHashtagString(hashtags: string[]): string {
  if (!hashtags.length) return '';
  return hashtags.map(h => h.startsWith('#') ? h : `#${h}`).join(' ');
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Adapt content for Facebook post format.
 *
 * Transforms markdown/article content into a plain-text, engagement-optimized
 * Facebook post with hook line, short paragraphs, emoji bullets, and CTA.
 */
export function adaptContent(options: AdaptOptions): FacebookContent {
  const maxChars = Math.min(options.maxChars ?? FB_OPTIMAL_MAX, FB_MAX_CHARS);
  const hashtags = options.hashtags ?? [];

  // Step 1: Strip markdown
  const plainText = stripMarkdown(options.content);

  // Step 2: Extract hook
  const title = extractHook(plainText, options.topic);

  // Step 3: Format for Facebook
  let postText = formatForFacebook(plainText, maxChars);

  // Step 4: Append link if provided (creates preview card)
  if (options.link) {
    postText += `\n\n${options.link}`;
  }

  // Step 5: Append hashtags
  const hashtagStr = buildHashtagString(hashtags);
  if (hashtagStr) {
    postText += `\n\n${hashtagStr}`;
  }

  return {
    text: postText,
    title,
    hashtags,
  };
}

/**
 * Create a Facebook post from scratch given a topic and key points.
 */
export function createPostContent(options: {
  topic: string;
  hook: string;
  keyPoints: string[];
  cta?: string;
  link?: string;
  hashtags?: string[];
}): FacebookContent {
  const lines: string[] = [];

  // Hook line — stops the scroll
  lines.push(options.hook);
  lines.push('');

  // Key points as emoji bullets
  const emojis = ['\u2728', '\ud83d\udca1', '\ud83d\ude80', '\ud83c\udfaf', '\ud83d\udd25', '\u2705', '\ud83d\udcca', '\ud83c\udf1f'];
  for (let i = 0; i < options.keyPoints.length; i++) {
    const emoji = emojis[i % emojis.length];
    lines.push(`${emoji} ${options.keyPoints[i]}`);
  }

  // CTA
  if (options.cta) {
    lines.push('');
    lines.push(options.cta);
  } else {
    lines.push('');
    lines.push('What do you think? Drop your thoughts in the comments!');
  }

  // Link
  if (options.link) {
    lines.push('');
    lines.push(options.link);
  }

  // Hashtags
  const hashtags = options.hashtags ?? [];
  if (hashtags.length) {
    lines.push('');
    lines.push(buildHashtagString(hashtags));
  }

  const text = lines.join('\n');

  return {
    text,
    title: options.hook,
    hashtags,
  };
}
