/**
 * Content adapter — transforms article/markdown content into Instagram-optimized format.
 *
 * Instagram is a VISUAL-FIRST platform. This adapter:
 * - Converts articles into carousel slide descriptions
 * - Creates engaging captions with hook lines
 * - Generates strategic hashtag sets (20-30 tags)
 * - Provides image prompts for AI image generation
 *
 * NOTE: This adapter outputs slide DESCRIPTIONS and image prompts.
 * Actual image generation requires an external tool (e.g., DALL-E, Midjourney,
 * or YouMind's chatGenerateImage).
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface InstagramContent {
  /** Full caption text for the post (max 2,200 chars) */
  caption: string;
  /** Strategic hashtag set */
  hashtags: string[];
  /** Slide descriptions for carousel (each slide = 1 key point) */
  slideDescriptions: string[];
  /** Prompt for generating the cover/main image */
  coverImagePrompt: string;
}

export interface AdaptOptions {
  /** Raw content (markdown or plain text) */
  content: string;
  /** Topic or title */
  topic?: string;
  /** Optional hashtags to include */
  hashtags?: string[];
  /** Maximum number of carousel slides (default: 10, Instagram max) */
  maxSlides?: number;
  /** Optional niche/industry for hashtag generation */
  niche?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Instagram caption maximum length */
const IG_CAPTION_MAX = 2200;

/** Characters visible before "more" button */
const IG_VISIBLE_CHARS = 125;

/** Maximum carousel slides */
const IG_MAX_CAROUSEL = 10;

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

  // Remove images, keep alt text
  result = result.replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1');

  // Remove link syntax, keep text
  result = result.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  // Remove blockquotes
  result = result.replace(/^>\s*/gm, '');

  // Remove horizontal rules
  result = result.replace(/^[-*_]{3,}\s*$/gm, '');

  // Remove list markers
  result = result.replace(/^\s*[-*+]\s+/gm, '');
  result = result.replace(/^\s*\d+\.\s+/gm, '');

  // Collapse multiple blank lines
  result = result.replace(/\n{3,}/g, '\n\n');

  return result.trim();
}

// ---------------------------------------------------------------------------
// Key point extraction
// ---------------------------------------------------------------------------

function extractKeyPoints(content: string, maxPoints: number): string[] {
  const plainText = stripMarkdown(content);
  const paragraphs = plainText
    .split('\n\n')
    .map(p => p.trim())
    .filter(p => p.length > 20); // Skip very short fragments

  if (paragraphs.length <= maxPoints) {
    return paragraphs;
  }

  // Select evenly distributed paragraphs
  const points: string[] = [];
  const step = Math.max(1, Math.floor(paragraphs.length / maxPoints));

  for (let i = 0; i < paragraphs.length && points.length < maxPoints; i += step) {
    // Truncate long paragraphs for slide descriptions
    const para = paragraphs[i]!;
    if (para.length > 200) {
      points.push(para.slice(0, 197) + '...');
    } else {
      points.push(para);
    }
  }

  return points;
}

// ---------------------------------------------------------------------------
// Caption building
// ---------------------------------------------------------------------------

function buildCaption(
  hook: string,
  body: string,
  cta: string,
  hashtags: string[],
): string {
  const parts: string[] = [];

  // Hook line (visible before fold)
  parts.push(hook);
  parts.push('');

  // Body content
  if (body) {
    parts.push(body);
    parts.push('');
  }

  // CTA
  parts.push(cta);
  parts.push('');

  // Hashtags
  if (hashtags.length) {
    parts.push('.');
    parts.push('.');
    parts.push('.');
    parts.push(hashtags.map(h => h.startsWith('#') ? h : `#${h}`).join(' '));
  }

  let caption = parts.join('\n');

  // Enforce max length
  if (caption.length > IG_CAPTION_MAX) {
    // Trim body to fit, keeping hook, CTA, and hashtags
    const hashtagStr = hashtags.length
      ? '\n.\n.\n.\n' + hashtags.map(h => h.startsWith('#') ? h : `#${h}`).join(' ')
      : '';
    const overhead = hook.length + 2 + cta.length + 2 + hashtagStr.length + 10;
    const maxBody = IG_CAPTION_MAX - overhead;

    const trimmedBody = body.slice(0, Math.max(0, maxBody - 3)) + '...';
    caption = [hook, '', trimmedBody, '', cta, hashtagStr].join('\n');
  }

  return caption;
}

function extractHook(content: string, topic?: string): string {
  const firstLine = content.split('\n').find(l => l.trim().length > 10);
  if (firstLine && firstLine.trim().length <= IG_VISIBLE_CHARS) {
    return firstLine.trim();
  }
  if (topic) {
    return topic.length <= IG_VISIBLE_CHARS
      ? topic
      : topic.slice(0, IG_VISIBLE_CHARS - 3) + '...';
  }
  const first = content.split('\n\n')[0] ?? '';
  return first.slice(0, IG_VISIBLE_CHARS - 3).trim() + '...';
}

function buildCoverImagePrompt(topic: string, keyPoints: string[]): string {
  const context = keyPoints.slice(0, 3).join('; ');
  return (
    `Create a visually stunning, Instagram-worthy image for a post about: "${topic}". ` +
    `Key themes: ${context}. ` +
    `Style: clean, modern, high contrast, suitable for 1080x1080px square format. ` +
    `No text overlay — the image should work as a standalone visual.`
  );
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Adapt article content for Instagram post/carousel format.
 *
 * Returns caption, hashtags, slide descriptions (for carousels), and
 * a cover image generation prompt.
 */
export function adaptContent(options: AdaptOptions): InstagramContent {
  const maxSlides = Math.min(options.maxSlides ?? IG_MAX_CAROUSEL, IG_MAX_CAROUSEL);
  const plainText = stripMarkdown(options.content);

  // Extract key points for carousel slides
  const slideDescriptions = extractKeyPoints(plainText, maxSlides);

  // Build hook
  const hook = extractHook(plainText, options.topic);

  // Build body from key points (condensed for caption)
  const bodyPoints = slideDescriptions.slice(0, 5).map((point, i) => {
    const emojis = ['\u2728', '\ud83d\udca1', '\ud83d\ude80', '\ud83c\udfaf', '\ud83d\udd25'];
    const emoji = emojis[i % emojis.length];
    // Truncate each point for caption readability
    const short = point.length > 100 ? point.slice(0, 97) + '...' : point;
    return `${emoji} ${short}`;
  });
  const body = bodyPoints.join('\n');

  // CTA
  const cta = 'Save this for later and share with someone who needs it!';

  // Hashtags
  const hashtags = options.hashtags?.length
    ? options.hashtags
    : generateDefaultHashtags(options.topic ?? '', options.niche);

  // Build caption
  const caption = buildCaption(hook, body, cta, hashtags);

  // Cover image prompt
  const coverImagePrompt = buildCoverImagePrompt(
    options.topic ?? hook,
    slideDescriptions,
  );

  return {
    caption,
    hashtags,
    slideDescriptions,
    coverImagePrompt,
  };
}

/**
 * Generate default hashtags for a topic.
 * Returns 20-30 hashtags combining niche, topic, and general engagement tags.
 */
function generateDefaultHashtags(topic: string, niche?: string): string[] {
  // General engagement hashtags
  const general = [
    'instagood', 'instadaily', 'explore', 'explorepage',
    'trending', 'viral', 'sharethis', 'saveforlater',
    'education', 'knowledge', 'learnontiktok', 'didyouknow',
  ];

  // Topic-derived hashtags (split topic into words)
  const topicWords = topic
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2);

  const topicTags = topicWords.slice(0, 5);

  // Combine topic words into compound tags
  if (topicWords.length >= 2) {
    topicTags.push(topicWords.slice(0, 2).join(''));
    topicTags.push(topicWords.slice(0, 3).join(''));
  }

  // Niche tags
  const nicheTags: string[] = [];
  if (niche) {
    nicheTags.push(
      niche.toLowerCase().replace(/\s+/g, ''),
      `${niche.toLowerCase().replace(/\s+/g, '')}tips`,
      `${niche.toLowerCase().replace(/\s+/g, '')}life`,
    );
  }

  // Combine and deduplicate
  const allTags = [...new Set([...topicTags, ...nicheTags, ...general])];

  // Return 20-30 hashtags
  return allTags.slice(0, 30);
}

/**
 * Create a carousel plan from an article.
 *
 * Returns structured data for each slide including:
 * - Slide number and title
 * - Key content for that slide
 * - Image description/prompt
 */
export function createCarouselPlan(options: {
  topic: string;
  keyPoints: string[];
  style?: string;
}): Array<{ slideNumber: number; title: string; content: string; imagePrompt: string }> {
  const style = options.style ?? 'clean, modern, minimalist';

  return options.keyPoints.map((point, i) => {
    const slideNum = i + 1;
    const isFirst = i === 0;
    const isLast = i === options.keyPoints.length - 1;

    let title: string;
    if (isFirst) {
      title = options.topic;
    } else if (isLast) {
      title = 'Key Takeaway';
    } else {
      title = `Point ${slideNum - 1}`;
    }

    const imagePrompt = isFirst
      ? `Cover slide for an Instagram carousel about "${options.topic}". Style: ${style}. Bold title text overlay: "${options.topic}". 1080x1350px portrait format.`
      : isLast
        ? `Final slide for Instagram carousel about "${options.topic}". Style: ${style}. CTA: "Follow for more". 1080x1350px portrait format.`
        : `Slide ${slideNum} for Instagram carousel. Visual representation of: "${point.slice(0, 100)}". Style: ${style}. 1080x1350px portrait format.`;

    return {
      slideNumber: slideNum,
      title,
      content: point,
      imagePrompt,
    };
  });
}
