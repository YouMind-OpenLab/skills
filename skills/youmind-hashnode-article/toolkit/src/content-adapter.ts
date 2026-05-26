/**
 * Content adapter for Hashnode — transforms markdown for Hashnode publishing.
 *
 * Responsibilities:
 * - Validate and optimize title for SEO (50-70 chars)
 * - Generate subtitle (hook/teaser)
 * - Validate tags (max 5)
 * - Cover image URL validation (1600x840 recommended)
 * - Canonical URL for cross-posting
 * - Series support
 * - Meta description for SEO (max 160 chars)
 * - Validate code blocks have language tags
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AdaptOptions {
  /** Raw markdown content */
  markdown: string;
  /** Article title (50-70 chars recommended for SEO) */
  title: string;
  /** Subtitle / hook / teaser */
  subtitle?: string;
  /** Meta description for SEO (max 160 chars) */
  metaDescription?: string;
  /** Up to 5 tags */
  tags?: string[];
  /** Cover image URL (1600x840 recommended) */
  coverImageUrl?: string;
  /** Canonical URL for cross-posting */
  canonicalUrl?: string;
  /** Series ID */
  seriesId?: string;
}

export interface AdaptResult {
  /** Validated markdown body */
  bodyMarkdown: string;
  /** Validated title */
  title: string;
  /** Subtitle (generated if not provided) */
  subtitle: string;
  /** Validated meta description (max 160 chars) */
  metaDescription: string;
  /** Validated tags (max 5, normalized) */
  tags: string[];
  /** Cover image URL */
  coverImageUrl?: string;
  /** Canonical URL */
  canonicalUrl?: string;
  /** Series ID */
  seriesId?: string;
  /** Warnings from validation */
  warnings: string[];
}

// ---------------------------------------------------------------------------
// Tag validation
// ---------------------------------------------------------------------------

/**
 * Validate and normalize Hashnode tags.
 * Rules: max 5 tags, lowercase, alphanumeric + hyphens.
 */
function validateTags(tags: string[]): { valid: string[]; warnings: string[] } {
  const warnings: string[] = [];
  const normalized: string[] = [];

  for (const raw of tags) {
    const tag = raw.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 50);
    if (tag.length === 0) {
      warnings.push(`Tag "${raw}" was removed -- contains no valid characters.`);
      continue;
    }
    if (tag !== raw.toLowerCase()) {
      warnings.push(`Tag "${raw}" was normalized to "${tag}".`);
    }
    if (normalized.length < 5) {
      normalized.push(tag);
    }
  }

  if (tags.length > 5) {
    warnings.push(`Only 5 tags allowed on Hashnode. Dropped: ${tags.slice(5).join(', ')}`);
  }

  return { valid: normalized, warnings };
}

// ---------------------------------------------------------------------------
// Code block validation
// ---------------------------------------------------------------------------

/**
 * Check that all fenced code blocks have language tags.
 */
function validateCodeBlocks(markdown: string): string[] {
  const warnings: string[] = [];
  const codeBlockRegex = /^```(\w*)\s*$/gm;
  let match: RegExpExecArray | null;
  let blockIndex = 0;

  while ((match = codeBlockRegex.exec(markdown)) !== null) {
    blockIndex++;
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
// Subtitle generation
// ---------------------------------------------------------------------------

/**
 * Generate a subtitle from the first paragraph if not provided.
 */
function generateSubtitle(markdown: string, title: string): string {
  // Find the first non-heading, non-empty paragraph
  const paragraphs = markdown.split('\n\n');
  for (const p of paragraphs) {
    const trimmed = p.trim();
    if (
      trimmed.length > 20 &&
      !trimmed.startsWith('#') &&
      !trimmed.startsWith('```') &&
      !trimmed.startsWith('![') &&
      !trimmed.startsWith('---')
    ) {
      // Clean markdown formatting
      const clean = trimmed
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/`(.*?)`/g, '$1')
        .replace(/\[(.*?)\]\(.*?\)/g, '$1')
        .replace(/\n/g, ' ')
        .trim();
      return clean.slice(0, 150);
    }
  }
  return `A deep dive into ${title}`;
}

// ---------------------------------------------------------------------------
// Main adapter
// ---------------------------------------------------------------------------

/**
 * Transform markdown content for Hashnode publishing.
 */
export function adaptForHashnode(options: AdaptOptions): AdaptResult {
  const warnings: string[] = [];

  // Validate title
  let title = options.title.trim();
  if (title.length < 10) {
    warnings.push(`Title is very short (${title.length} chars). Aim for 50-70 characters for SEO.`);
  }
  if (title.length > 100) {
    warnings.push(`Title is too long (${title.length} chars). Recommended: 50-70 characters.`);
    title = title.slice(0, 100);
  }
  if (title.length > 70) {
    warnings.push(`Title is ${title.length} chars. For optimal SEO, aim for 50-70 characters.`);
  }

  // Subtitle
  let subtitle = (options.subtitle ?? '').trim();
  if (!subtitle) {
    subtitle = generateSubtitle(options.markdown, title);
    warnings.push('Subtitle was empty -- auto-generated from first paragraph.');
  }
  if (subtitle.length > 150) {
    subtitle = subtitle.slice(0, 150);
    warnings.push('Subtitle truncated to 150 characters.');
  }

  // Meta description
  let metaDescription = (options.metaDescription ?? '').trim();
  if (metaDescription.length > 160) {
    warnings.push(`Meta description truncated from ${metaDescription.length} to 160 characters.`);
    metaDescription = metaDescription.slice(0, 160);
  }
  if (metaDescription.length === 0) {
    // Auto-generate from subtitle or first paragraph
    metaDescription = subtitle.slice(0, 160);
    warnings.push('Meta description was empty -- auto-generated from subtitle.');
  }

  // Validate tags
  const tagResult = validateTags(options.tags ?? []);
  warnings.push(...tagResult.warnings);

  // Validate code blocks
  const codeWarnings = validateCodeBlocks(options.markdown);
  warnings.push(...codeWarnings);

  // Cover image check
  if (options.coverImageUrl) {
    if (!options.coverImageUrl.startsWith('http://') && !options.coverImageUrl.startsWith('https://')) {
      warnings.push('Cover image URL should be an absolute URL (https://...).');
    }
  } else {
    warnings.push('No cover image provided. Hashnode recommends a 1600x840 cover image.');
  }

  // Canonical URL check
  if (options.canonicalUrl) {
    if (!options.canonicalUrl.startsWith('http://') && !options.canonicalUrl.startsWith('https://')) {
      warnings.push('Canonical URL should be an absolute URL (https://...).');
    }
  }

  // Word count check
  const wordCount = options.markdown.split(/\s+/).length;
  if (wordCount < 300) {
    warnings.push(`Article is only ~${wordCount} words. Aim for 800-3000 for SEO value.`);
  }

  return {
    bodyMarkdown: options.markdown,
    title,
    subtitle,
    metaDescription,
    tags: tagResult.valid,
    coverImageUrl: options.coverImageUrl,
    canonicalUrl: options.canonicalUrl,
    seriesId: options.seriesId,
    warnings,
  };
}
