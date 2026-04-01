/**
 * Reddit content adaptation module.
 *
 * Transforms content for Reddit:
 * - Reddit-flavored Markdown
 * - Descriptive title, NO clickbait
 * - TL;DR at top or bottom
 * - Subreddit tone matching
 * - Flair selection hint based on content
 * - Question at end for discussion
 * - Max 40,000 chars
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SELF_POST_CHAR_LIMIT = 40_000;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AdaptOptions {
  /** Target subreddit (influences tone) */
  subreddit?: string;
  /** Maximum character count (default: 40000) */
  maxChars?: number;
  /** Whether to add TL;DR section */
  addTldr?: boolean;
  /** Custom TL;DR text */
  tldrText?: string;
  /** Discussion question to add at end */
  discussionQuestion?: string;
  /** Position of TL;DR: 'top' or 'bottom' (default: 'bottom') */
  tldrPosition?: 'top' | 'bottom';
}

export interface AdaptResult {
  /** Adapted title */
  title: string;
  /** Adapted body text */
  body: string;
  /** Original character count */
  originalLength: number;
  /** Final character count */
  finalLength: number;
  /** Whether content was truncated */
  wasTruncated: boolean;
  /** Suggested flair based on content analysis */
  suggestedFlair: string | null;
  /** Warnings about the adaptation */
  warnings: string[];
}

export interface TitleAnalysis {
  isClickbait: boolean;
  isTooShort: boolean;
  isTooLong: boolean;
  suggestions: string[];
}

// ---------------------------------------------------------------------------
// Title analysis
// ---------------------------------------------------------------------------

const CLICKBAIT_PATTERNS = [
  /you won't believe/i,
  /shocking/i,
  /mind[ -]?blow/i,
  /this one trick/i,
  /what happened next/i,
  /number \d+ will/i,
  /literally/i,
  /insane/i,
  /game[ -]?changer/i,
  /^why you (should|need|must)/i,
  /\?\?\?+/,
  /!!!+/,
  /🔥|💯|😱|🤯/,
];

/**
 * Analyze a post title for Reddit best practices.
 */
export function analyzeTitle(title: string): TitleAnalysis {
  const suggestions: string[] = [];
  let isClickbait = false;

  // Check for clickbait patterns
  for (const pattern of CLICKBAIT_PATTERNS) {
    if (pattern.test(title)) {
      isClickbait = true;
      break;
    }
  }

  if (isClickbait) {
    suggestions.push('Title appears clickbaity. Reddit users prefer descriptive, honest titles.');
  }

  const isTooShort = title.length < 15;
  const isTooLong = title.length > 300;

  if (isTooShort) {
    suggestions.push('Title is too short. Add more context about what the post discusses.');
  }

  if (isTooLong) {
    suggestions.push('Title is too long (>300 chars). Reddit truncates long titles.');
  }

  // Check for all caps
  if (title === title.toUpperCase() && title.length > 5) {
    suggestions.push('Avoid ALL CAPS in titles. It comes across as shouting.');
  }

  return { isClickbait, isTooShort, isTooLong, suggestions };
}

// ---------------------------------------------------------------------------
// Content adaptation
// ---------------------------------------------------------------------------

/**
 * Adapt content for a Reddit self-post.
 */
export function adaptForReddit(
  title: string,
  content: string,
  options: AdaptOptions = {},
): AdaptResult {
  const maxChars = options.maxChars ?? SELF_POST_CHAR_LIMIT;
  const warnings: string[] = [];

  // Analyze title
  const titleAnalysis = analyzeTitle(title);
  if (titleAnalysis.suggestions.length > 0) {
    warnings.push(...titleAnalysis.suggestions);
  }

  // Clean up the content
  let body = content.trim();
  const originalLength = body.length;

  // Ensure Reddit-flavored Markdown compatibility
  body = ensureRedditMarkdown(body);

  // Generate TL;DR if requested
  if (options.addTldr !== false) {
    const tldr = options.tldrText || generateTldr(body);
    if (tldr) {
      const tldrBlock = `**TL;DR:** ${tldr}`;
      if (options.tldrPosition === 'top') {
        body = tldrBlock + '\n\n---\n\n' + body;
      } else {
        body = body + '\n\n---\n\n' + tldrBlock;
      }
    }
  }

  // Add discussion question
  if (options.discussionQuestion) {
    body = body + '\n\n---\n\n' + options.discussionQuestion;
  }

  // Enforce character limit
  let wasTruncated = false;
  if (body.length > maxChars) {
    wasTruncated = true;
    body = truncateRedditPost(body, maxChars);
    warnings.push(`Post truncated from ${originalLength} to ${body.length} chars (limit: ${maxChars}).`);
  }

  // Suggest flair based on content
  const suggestedFlair = suggestFlair(title, body, options.subreddit);

  return {
    title: cleanTitle(title),
    body,
    originalLength,
    finalLength: body.length,
    wasTruncated,
    suggestedFlair,
    warnings,
  };
}

// ---------------------------------------------------------------------------
// Reddit Markdown compatibility
// ---------------------------------------------------------------------------

/**
 * Ensure Markdown is compatible with Reddit's Markdown flavor.
 */
function ensureRedditMarkdown(text: string): string {
  let result = text;

  // Reddit uses two newlines for paragraph breaks
  // Ensure consistent paragraph spacing
  result = result.replace(/\n{3,}/g, '\n\n');

  // Reddit supports standard Markdown tables -- keep as-is

  // Reddit supports >! spoiler tags -- keep as-is

  // Ensure code blocks use 4-space indent or triple backtick
  // (Reddit supports both)

  // Ensure lists have blank lines before them for proper rendering
  result = result.replace(/([^\n])\n([-*+] )/g, '$1\n\n$2');
  result = result.replace(/([^\n])\n(\d+\. )/g, '$1\n\n$2');

  return result;
}

// ---------------------------------------------------------------------------
// TL;DR generation
// ---------------------------------------------------------------------------

/**
 * Generate a simple TL;DR from the content.
 * Extracts the first 1-2 sentences as a summary.
 */
function generateTldr(content: string): string {
  // Strip Markdown formatting for summary
  let plain = content
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/\n+/g, ' ')
    .trim();

  // Get first 2 sentences
  const sentences = plain.split(/(?<=[.!?])\s+/).slice(0, 2);
  const summary = sentences.join(' ');

  // Limit to ~200 chars
  if (summary.length > 200) {
    return summary.slice(0, 197) + '...';
  }

  return summary;
}

// ---------------------------------------------------------------------------
// Flair suggestion
// ---------------------------------------------------------------------------

/** Common flair categories across subreddits. */
const FLAIR_PATTERNS: Array<{ pattern: RegExp; flair: string }> = [
  { pattern: /\b(question|ask|how do|how to|can anyone|help)\b/i, flair: 'Question' },
  { pattern: /\b(discuss|thought|opinion|debate|what do you think)\b/i, flair: 'Discussion' },
  { pattern: /\b(tutorial|guide|how-to|walkthrough|step by step)\b/i, flair: 'Tutorial' },
  { pattern: /\b(project|built|made|created|showcase|show off)\b/i, flair: 'Project' },
  { pattern: /\b(news|announcement|release|update|launched)\b/i, flair: 'News' },
  { pattern: /\b(article|blog|read|wrote|published)\b/i, flair: 'Article' },
  { pattern: /\b(resource|tool|library|framework|package)\b/i, flair: 'Resource' },
  { pattern: /\b(tip|trick|pro tip|TIL|today I learned)\b/i, flair: 'Tip' },
  { pattern: /\b(rant|vent|frustrated|complaint)\b/i, flair: 'Rant' },
  { pattern: /\b(humor|meme|funny|joke|lol)\b/i, flair: 'Humor' },
];

function suggestFlair(title: string, body: string, _subreddit?: string): string | null {
  const combined = `${title} ${body.slice(0, 500)}`;

  for (const { pattern, flair } of FLAIR_PATTERNS) {
    if (pattern.test(combined)) {
      return flair;
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Title cleaning
// ---------------------------------------------------------------------------

function cleanTitle(title: string): string {
  let clean = title.trim();

  // Remove Markdown formatting from title
  clean = clean.replace(/\*\*(.+?)\*\*/g, '$1');
  clean = clean.replace(/\*(.+?)\*/g, '$1');
  clean = clean.replace(/`([^`]+)`/g, '$1');
  clean = clean.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  // Reddit title limit: 300 chars
  if (clean.length > 300) {
    clean = clean.slice(0, 297) + '...';
  }

  return clean;
}

// ---------------------------------------------------------------------------
// Truncation
// ---------------------------------------------------------------------------

function truncateRedditPost(text: string, limit: number): string {
  if (text.length <= limit) return text;

  const truncated = text.slice(0, limit);

  // Try to truncate at a paragraph boundary
  const lastParagraphBreak = truncated.lastIndexOf('\n\n');
  if (lastParagraphBreak > limit * 0.5) {
    return truncated.slice(0, lastParagraphBreak) + '\n\n*[Post truncated due to length]*';
  }

  // Truncate at sentence boundary
  const lastSentenceEnd = truncated.search(/[.!?]\s[^.!?]*$/);
  if (lastSentenceEnd > limit * 0.5) {
    return truncated.slice(0, lastSentenceEnd + 1) + '\n\n*[Post truncated due to length]*';
  }

  return truncated.slice(0, limit - 40) + '\n\n*[Post truncated due to length]*';
}

// ---------------------------------------------------------------------------
// Subreddit tone hints
// ---------------------------------------------------------------------------

export interface SubredditTone {
  formality: 'formal' | 'casual' | 'mixed';
  technicalLevel: 'high' | 'medium' | 'low';
  humorAccepted: boolean;
  tips: string[];
}

const KNOWN_SUBREDDIT_TONES: Record<string, SubredditTone> = {
  science: {
    formality: 'formal',
    technicalLevel: 'high',
    humorAccepted: false,
    tips: ['Cite sources', 'No speculation without evidence', 'Use proper terminology'],
  },
  programming: {
    formality: 'mixed',
    technicalLevel: 'high',
    humorAccepted: true,
    tips: ['Include code examples', 'Be specific about languages/tools', 'Link to repos'],
  },
  learnprogramming: {
    formality: 'casual',
    technicalLevel: 'medium',
    humorAccepted: true,
    tips: ['Be encouraging', 'Explain concepts simply', 'Suggest resources'],
  },
  technology: {
    formality: 'mixed',
    technicalLevel: 'medium',
    humorAccepted: true,
    tips: ['Focus on implications', 'Avoid pure marketing', 'Add context'],
  },
  askreddit: {
    formality: 'casual',
    technicalLevel: 'low',
    humorAccepted: true,
    tips: ['Open-ended questions', 'Relatable topics', 'No yes/no questions'],
  },
  explainlikeimfive: {
    formality: 'casual',
    technicalLevel: 'low',
    humorAccepted: true,
    tips: ['Use simple analogies', 'Avoid jargon', 'Build from basics'],
  },
};

/**
 * Get tone guidance for a subreddit.
 */
export function getSubredditTone(subreddit: string): SubredditTone | null {
  const normalized = subreddit.toLowerCase().replace(/^r\//, '');
  return KNOWN_SUBREDDIT_TONES[normalized] ?? null;
}
