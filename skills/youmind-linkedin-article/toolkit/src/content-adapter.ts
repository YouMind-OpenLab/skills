/**
 * LinkedIn content adaptation module.
 *
 * Transforms Markdown/plain text into LinkedIn-optimized format:
 * - 3,000 character limit enforcement
 * - Unicode formatting (bold, italic, bullets) instead of Markdown
 * - Short paragraphs (1-3 sentences)
 * - Hook in first 2 lines (before "see more" fold)
 * - 3-5 hashtags at end
 * - No external links in body (suggest putting in first comment)
 * - CTA question to encourage comments
 */

// ---------------------------------------------------------------------------
// Unicode formatting maps
// ---------------------------------------------------------------------------

const BOLD_MAP: Record<string, string> = {};
const ITALIC_MAP: Record<string, string> = {};

// Build Unicode bold map (Mathematical Bold)
const boldUpperStart = 0x1d400;
const boldLowerStart = 0x1d41a;
const boldDigitStart = 0x1d7ce;

for (let i = 0; i < 26; i++) {
  BOLD_MAP[String.fromCharCode(65 + i)] = String.fromCodePoint(boldUpperStart + i);
  BOLD_MAP[String.fromCharCode(97 + i)] = String.fromCodePoint(boldLowerStart + i);
}
for (let i = 0; i < 10; i++) {
  BOLD_MAP[String.fromCharCode(48 + i)] = String.fromCodePoint(boldDigitStart + i);
}

// Build Unicode italic map (Mathematical Italic)
const italicUpperStart = 0x1d434;
const italicLowerStart = 0x1d44e;

for (let i = 0; i < 26; i++) {
  ITALIC_MAP[String.fromCharCode(65 + i)] = String.fromCodePoint(italicUpperStart + i);
  ITALIC_MAP[String.fromCharCode(97 + i)] = String.fromCodePoint(italicLowerStart + i);
}
// Special case: italic h is at a different code point
ITALIC_MAP['h'] = String.fromCodePoint(0x210e);

// ---------------------------------------------------------------------------
// Unicode formatting functions
// ---------------------------------------------------------------------------

/** Convert ASCII text to Unicode bold. */
export function unicodeBold(text: string): string {
  return [...text].map((ch) => BOLD_MAP[ch] || ch).join('');
}

/** Convert ASCII text to Unicode italic. */
export function unicodeItalic(text: string): string {
  return [...text].map((ch) => ITALIC_MAP[ch] || ch).join('');
}

// ---------------------------------------------------------------------------
// Markdown stripping and conversion
// ---------------------------------------------------------------------------

/** Strip Markdown syntax and convert to Unicode-formatted plain text. */
export function markdownToLinkedIn(markdown: string): string {
  let text = markdown;

  // Convert bold **text** or __text__ to Unicode bold
  text = text.replace(/\*\*(.+?)\*\*/g, (_match, p1: string) => unicodeBold(p1));
  text = text.replace(/__(.+?)__/g, (_match, p1: string) => unicodeBold(p1));

  // Convert italic *text* or _text_ to Unicode italic
  text = text.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, (_match, p1: string) => unicodeItalic(p1));
  text = text.replace(/(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/g, (_match, p1: string) => unicodeItalic(p1));

  // Convert headers to Unicode bold
  text = text.replace(/^#{1,6}\s+(.+)$/gm, (_match, p1: string) => unicodeBold(p1));

  // Convert bullet lists: - or * items to bullet character
  text = text.replace(/^[\s]*[-*]\s+/gm, '\u2022 ');

  // Convert numbered lists: keep numbers but clean up
  text = text.replace(/^[\s]*(\d+)\.\s+/gm, '$1. ');

  // Remove inline code backticks
  text = text.replace(/`([^`]+)`/g, '$1');

  // Remove code blocks
  text = text.replace(/```[\s\S]*?```/g, '');

  // Remove links but keep text: [text](url) -> text
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  // Remove images: ![alt](url)
  text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, '');

  // Remove horizontal rules
  text = text.replace(/^[-*_]{3,}$/gm, '');

  // Remove blockquotes marker
  text = text.replace(/^>\s?/gm, '');

  // Collapse multiple blank lines to max 2
  text = text.replace(/\n{3,}/g, '\n\n');

  return text.trim();
}

// ---------------------------------------------------------------------------
// Content adaptation
// ---------------------------------------------------------------------------

export interface AdaptOptions {
  /** Maximum character count (default: 3000) */
  maxChars?: number;
  /** Hashtags to append (3-5 recommended) */
  hashtags?: string[];
  /** CTA question to append at the end */
  ctaQuestion?: string;
  /** Extract links from body to suggest as first comment */
  extractLinks?: boolean;
}

export interface AdaptResult {
  /** The adapted post text, ready to publish */
  text: string;
  /** Original character count before adaptation */
  originalLength: number;
  /** Final character count */
  finalLength: number;
  /** Whether the content was truncated */
  wasTruncated: boolean;
  /** Links extracted from body (put these in first comment) */
  extractedLinks: string[];
  /** Warnings about the adaptation */
  warnings: string[];
}

/**
 * Adapt content for LinkedIn posting.
 *
 * Enforces character limits, converts formatting, adds hashtags and CTA.
 */
export function adaptForLinkedIn(
  content: string,
  options: AdaptOptions = {},
): AdaptResult {
  const maxChars = options.maxChars ?? 3000;
  const warnings: string[] = [];
  const extractedLinks: string[] = [];

  // Step 1: Convert Markdown to LinkedIn-friendly Unicode
  let text = markdownToLinkedIn(content);
  const originalLength = text.length;

  // Step 2: Extract external links if requested
  if (options.extractLinks !== false) {
    const urlRegex = /https?:\/\/[^\s)]+/g;
    const links = text.match(urlRegex) || [];
    for (const link of links) {
      if (!extractedLinks.includes(link)) {
        extractedLinks.push(link);
      }
    }
    if (extractedLinks.length > 0) {
      // Remove URLs from body text
      text = text.replace(urlRegex, '').replace(/\s{2,}/g, ' ').trim();
      warnings.push(
        `Extracted ${extractedLinks.length} link(s) from body. Post these in the first comment for better reach.`,
      );
    }
  }

  // Step 3: Ensure short paragraphs (split long ones)
  const paragraphs = text.split(/\n\n+/);
  const shortParagraphs: string[] = [];

  for (const para of paragraphs) {
    const sentences = para.split(/(?<=[.!?])\s+/);
    if (sentences.length > 3) {
      // Split into chunks of 2-3 sentences
      for (let i = 0; i < sentences.length; i += 3) {
        shortParagraphs.push(sentences.slice(i, i + 3).join(' '));
      }
    } else {
      shortParagraphs.push(para);
    }
  }

  text = shortParagraphs.join('\n\n');

  // Step 4: Add CTA question
  if (options.ctaQuestion) {
    text = text + '\n\n' + options.ctaQuestion;
  }

  // Step 5: Add hashtags
  if (options.hashtags?.length) {
    const hashtagStr = options.hashtags
      .map((h) => (h.startsWith('#') ? h : `#${h}`))
      .join(' ');
    text = text + '\n\n' + hashtagStr;
  }

  // Step 6: Enforce character limit
  let wasTruncated = false;
  if (text.length > maxChars) {
    wasTruncated = true;
    // Truncate at the last paragraph boundary before the limit
    const truncated = text.slice(0, maxChars);
    const lastParagraphBreak = truncated.lastIndexOf('\n\n');
    if (lastParagraphBreak > maxChars * 0.5) {
      text = truncated.slice(0, lastParagraphBreak) + '\n\n...';
    } else {
      // Truncate at last sentence boundary
      const lastSentenceEnd = truncated.search(/[.!?]\s[^.!?]*$/);
      if (lastSentenceEnd > maxChars * 0.5) {
        text = truncated.slice(0, lastSentenceEnd + 1) + '\n\n...';
      } else {
        text = truncated.slice(0, maxChars - 3) + '...';
      }
    }
    warnings.push(`Content truncated from ${originalLength} to ${text.length} characters (limit: ${maxChars}).`);
  }

  // Step 7: Validate hook (first 2 lines should be impactful)
  const firstLines = text.split('\n').slice(0, 2).join(' ');
  if (firstLines.length < 20) {
    warnings.push('Hook (first 2 lines) is very short. LinkedIn shows ~210 chars before "see more".');
  }

  return {
    text,
    originalLength,
    finalLength: text.length,
    wasTruncated,
    extractedLinks,
    warnings,
  };
}

/**
 * Generate suggested hashtags based on content.
 */
export function suggestHashtags(content: string, count: number = 5): string[] {
  // Common professional hashtags by topic area
  const topicHashtags: Record<string, string[]> = {
    ai: ['#AI', '#ArtificialIntelligence', '#MachineLearning', '#GenAI', '#AIStrategy'],
    leadership: ['#Leadership', '#Management', '#ExecutiveLeadership', '#TeamBuilding', '#LeadershipDevelopment'],
    startup: ['#Startup', '#Entrepreneurship', '#StartupLife', '#Founders', '#VentureCapital'],
    tech: ['#Technology', '#Innovation', '#DigitalTransformation', '#TechTrends', '#FutureTech'],
    career: ['#CareerDevelopment', '#ProfessionalGrowth', '#JobSearch', '#CareerAdvice', '#PersonalBranding'],
    marketing: ['#Marketing', '#DigitalMarketing', '#ContentMarketing', '#SocialMedia', '#MarketingStrategy'],
    product: ['#ProductManagement', '#ProductDevelopment', '#ProductStrategy', '#UX', '#CustomerExperience'],
    remote: ['#RemoteWork', '#HybridWork', '#FutureOfWork', '#WorkLifeBalance', '#DistributedTeams'],
  };

  const lowerContent = content.toLowerCase();
  const matched: string[] = [];

  for (const [topic, tags] of Object.entries(topicHashtags)) {
    if (lowerContent.includes(topic)) {
      matched.push(...tags);
    }
  }

  // Deduplicate and limit
  const unique = [...new Set(matched)];
  if (unique.length >= count) {
    return unique.slice(0, count);
  }

  // Fill with generic professional hashtags
  const generic = ['#Insights', '#ProfessionalDevelopment', '#ThoughtLeadership', '#Innovation', '#BusinessStrategy'];
  for (const tag of generic) {
    if (!unique.includes(tag) && unique.length < count) {
      unique.push(tag);
    }
  }

  return unique.slice(0, count);
}
