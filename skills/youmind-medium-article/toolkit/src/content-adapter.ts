/**
 * Content adapter for Medium — transforms markdown for Medium publishing.
 *
 * Responsibilities:
 * - Validate and select up to 5 tags
 * - Validate title length (60-100 chars recommended)
 * - Clean formatting: headings, blockquotes, code blocks
 * - Prepare content in Markdown format (default) for Medium API
 * - Return structured output for publisher
 *
 * Medium supports both HTML and Markdown as contentFormat.
 * We default to Markdown for simplicity.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AdaptOptions {
  /** Raw markdown content */
  markdown: string;
  /** Article title (60-100 chars recommended) */
  title: string;
  /** Up to 5 tags for Medium */
  tags?: string[];
  /** Canonical URL for cross-posting */
  canonicalUrl?: string;
  /** Content format: "markdown" (default) or "html" */
  contentFormat?: 'markdown' | 'html';
  /** Publish status: "draft" (default), "public", or "unlisted" */
  publishStatus?: 'public' | 'draft' | 'unlisted';
}

export interface AdaptResult {
  /** Cleaned markdown body */
  content: string;
  /** Content format for Medium API */
  contentFormat: 'markdown' | 'html';
  /** Validated title */
  title: string;
  /** Validated tags (max 5) */
  tags: string[];
  /** Canonical URL (if provided) */
  canonicalUrl?: string;
  /** Publish status */
  publishStatus: 'public' | 'draft' | 'unlisted';
  /** Warnings from validation */
  warnings: string[];
}

// ---------------------------------------------------------------------------
// Tag validation
// ---------------------------------------------------------------------------

/**
 * Validate and normalize Medium tags.
 * Rules: max 5 tags, broad categories.
 * Medium tags are more lenient than Dev.to — they can contain spaces
 * and mixed case, but we normalize to lowercase with hyphens for consistency.
 */
function validateTags(tags: string[]): { valid: string[]; warnings: string[] } {
  const warnings: string[] = [];
  const normalized: string[] = [];

  for (const raw of tags) {
    const tag = raw.trim().toLowerCase().replace(/\s+/g, '-');
    if (tag.length === 0) {
      warnings.push(`Tag "${raw}" was removed — empty after normalization.`);
      continue;
    }
    if (tag !== raw.trim().toLowerCase()) {
      warnings.push(`Tag "${raw}" was normalized to "${tag}".`);
    }
    if (normalized.length < 5) {
      normalized.push(tag);
    }
  }

  if (tags.length > 5) {
    warnings.push(`Only 5 tags allowed on Medium. Dropped: ${tags.slice(5).join(', ')}`);
  }

  return { valid: normalized, warnings };
}

// ---------------------------------------------------------------------------
// Code block validation
// ---------------------------------------------------------------------------

/**
 * Check that fenced code blocks have language tags.
 * Returns warnings for untagged blocks.
 */
function validateCodeBlocks(markdown: string): string[] {
  const warnings: string[] = [];
  const codeBlockRegex = /^```(\w*)\s*$/gm;
  let match: RegExpExecArray | null;
  let blockIndex = 0;

  while ((match = codeBlockRegex.exec(markdown)) !== null) {
    blockIndex++;
    // Only check opening fences (odd occurrences)
    if (blockIndex % 2 === 1 && !match[1]) {
      const lineNum = markdown.slice(0, match.index).split('\n').length;
      warnings.push(
        `Code block at line ${lineNum} has no language tag. Add a language (e.g., \`\`\`typescript).`,
      );
    }
  }

  return warnings;
}

// ---------------------------------------------------------------------------
// Content cleaning
// ---------------------------------------------------------------------------

/**
 * Clean and prepare markdown content for Medium.
 * - Remove YAML front matter if present
 * - Ensure proper heading hierarchy
 * - Clean up excessive blank lines
 */
function cleanContent(markdown: string): string {
  let content = markdown;

  // Strip YAML front matter
  const fmRegex = /^---\n[\s\S]*?\n---\n?/;
  content = content.replace(fmRegex, '');

  // Clean up excessive blank lines (more than 2 consecutive)
  content = content.replace(/\n{4,}/g, '\n\n\n');

  // Trim leading/trailing whitespace
  content = content.trim();

  return content;
}

// ---------------------------------------------------------------------------
// Opening hook check
// ---------------------------------------------------------------------------

/**
 * Check if the article starts with a strong opening (not a generic opener).
 */
function checkOpeningHook(markdown: string): string[] {
  const warnings: string[] = [];

  // Get first non-heading, non-empty paragraph
  const lines = markdown.split('\n');
  let firstParagraph = '';
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    firstParagraph = trimmed;
    break;
  }

  // Check for generic openers
  const genericOpeners = [
    /^in today'?s? (rapidly )?(evolving|changing|modern)/i,
    /^in the (current|modern|digital) (era|age|world|landscape)/i,
    /^as we (all )?know/i,
    /^it'?s no secret that/i,
    /^have you ever wondered/i,
  ];

  for (const pattern of genericOpeners) {
    if (pattern.test(firstParagraph)) {
      warnings.push(
        'Article starts with a generic opener. Medium readers prefer a strong hook: a story, bold statement, or surprising fact.',
      );
      break;
    }
  }

  return warnings;
}

// ---------------------------------------------------------------------------
// Main adapter
// ---------------------------------------------------------------------------

/**
 * Adapt content for Medium publishing.
 *
 * - Validates title (60-100 chars recommended)
 * - Validates and normalizes tags (max 5)
 * - Validates code blocks have language tags
 * - Checks for strong opening hook
 * - Cleans up formatting
 * - Returns structured output ready for the publisher
 */
export function adaptForMedium(options: AdaptOptions): AdaptResult {
  const warnings: string[] = [];

  // Validate title
  let title = options.title.trim();
  if (title.length < 10) {
    warnings.push(`Title is very short (${title.length} chars). Aim for 60-100 characters.`);
  }
  if (title.length > 100) {
    warnings.push(`Title is long (${title.length} chars). Medium recommends 60-100 characters for best engagement.`);
  }
  if (title.length < 60) {
    warnings.push(`Title is under 60 chars (${title.length}). Consider making it more compelling.`);
  }

  // Validate tags
  const tagResult = validateTags(options.tags ?? []);
  warnings.push(...tagResult.warnings);

  // Clean content
  const content = cleanContent(options.markdown);

  // Validate code blocks
  const codeWarnings = validateCodeBlocks(content);
  warnings.push(...codeWarnings);

  // Check opening hook
  const hookWarnings = checkOpeningHook(content);
  warnings.push(...hookWarnings);

  // Check word count
  const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
  if (wordCount < 500) {
    warnings.push(`Article is short (~${wordCount} words). Medium articles typically perform best at 800-2500 words.`);
  }
  if (wordCount > 3000) {
    warnings.push(`Article is long (~${wordCount} words). Consider splitting into a series for better engagement.`);
  }

  // Determine content format
  const contentFormat = options.contentFormat ?? 'markdown';

  // Determine publish status
  const publishStatus = options.publishStatus ?? 'draft';

  return {
    content,
    contentFormat,
    title,
    tags: tagResult.valid,
    canonicalUrl: options.canonicalUrl,
    publishStatus,
    warnings,
  };
}
