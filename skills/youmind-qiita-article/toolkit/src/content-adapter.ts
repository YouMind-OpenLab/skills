/**
 * Content adapter for Qiita — transforms markdown for Qiita publishing.
 *
 * Responsibilities:
 * - Validate and normalize tags (free-form, array of {name, versions})
 * - Validate code blocks have language tags
 * - Check for Qiita-specific markdown extensions (note boxes, math blocks)
 * - Return structured output for publisher
 */

import type { QiitaTag } from './qiita-api.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AdaptOptions {
  /** Raw markdown content */
  markdown: string;
  /** Article title */
  title: string;
  /** Tags as string array (will be converted to QiitaTag format) */
  tags?: string[];
  /** Whether to publish as private (limited sharing) */
  private?: boolean;
  /** Enable slide/presentation mode */
  slide?: boolean;
}

export interface AdaptResult {
  /** Adapted markdown body */
  bodyMarkdown: string;
  /** Validated title */
  title: string;
  /** Validated tags in Qiita format */
  tags: QiitaTag[];
  /** Warnings from validation */
  warnings: string[];
}

// ---------------------------------------------------------------------------
// Tag validation
// ---------------------------------------------------------------------------

/**
 * Validate and normalize Qiita tags.
 * Qiita tags are free-form (no fixed list). Max 5 tags recommended.
 * Each tag has a name and optional versions array.
 */
function validateTags(tags: string[]): { valid: QiitaTag[]; warnings: string[] } {
  const warnings: string[] = [];
  const normalized: QiitaTag[] = [];

  for (const raw of tags) {
    const name = raw.trim();
    if (name.length === 0) {
      warnings.push(`Empty tag was removed.`);
      continue;
    }
    if (normalized.length < 5) {
      normalized.push({ name, versions: [] });
    }
  }

  if (tags.length > 5) {
    warnings.push(`Qiita recommends max 5 tags. Dropped: ${tags.slice(5).join(', ')}`);
  }

  if (tags.length === 0) {
    warnings.push('No tags provided. Qiita articles should have at least 1 tag for discoverability.');
  }

  return { valid: normalized, warnings };
}

// ---------------------------------------------------------------------------
// Code block validation
// ---------------------------------------------------------------------------

/**
 * Check that all fenced code blocks have language tags.
 * Returns warnings for any untagged blocks.
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
        `Code block at line ${lineNum} has no language tag. Add a language (e.g., \`\`\`python).`,
      );
    }
  }

  return warnings;
}

// ---------------------------------------------------------------------------
// Main adapter
// ---------------------------------------------------------------------------

/**
 * Transform markdown content for Qiita publishing.
 *
 * - Validates and normalizes tags into Qiita's {name, versions} format
 * - Validates code blocks have language tags
 * - Validates title length
 * - Returns structured output
 */
export function adaptForQiita(options: AdaptOptions): AdaptResult {
  const warnings: string[] = [];

  // Validate title
  let title = options.title.trim();
  if (title.length < 5) {
    warnings.push(`Title is very short (${title.length} chars). Consider a more descriptive title.`);
  }
  if (title.length > 255) {
    warnings.push(`Title is too long (${title.length} chars). Qiita allows up to 255 characters.`);
    title = title.slice(0, 255);
  }

  // Validate tags
  const tagResult = validateTags(options.tags ?? []);
  warnings.push(...tagResult.warnings);

  // Validate code blocks
  const codeWarnings = validateCodeBlocks(options.markdown);
  warnings.push(...codeWarnings);

  // Check word count
  const wordCount = options.markdown.split(/\s+/).length;
  if (wordCount < 100) {
    warnings.push(`Article is quite short (~${wordCount} words). Qiita readers expect substantial technical content.`);
  }

  return {
    bodyMarkdown: options.markdown,
    title,
    tags: tagResult.valid,
    warnings,
  };
}
