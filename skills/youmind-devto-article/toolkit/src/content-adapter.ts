/**
 * Content adapter for Dev.to — transforms markdown for Dev.to publishing.
 *
 * Responsibilities:
 * - Generate YAML front matter (title, published, description, tags, cover_image, canonical_url)
 * - Validate tags (max 4, lowercase, alphanumeric + hyphens)
 * - Add TL;DR section if not present
 * - Validate code blocks have language tags
 * - Return structured output for publisher
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AdaptOptions {
  /** Raw markdown content (without front matter) */
  markdown: string;
  /** Article title (60-80 chars recommended) */
  title: string;
  /** Short description for SEO (max 170 chars) */
  description?: string;
  /** Up to 4 tags, lowercase */
  tags?: string[];
  /** Cover image URL */
  coverImageUrl?: string;
  /** Canonical URL for cross-posting */
  canonicalUrl?: string;
  /** Whether to publish immediately */
  published?: boolean;
  /** TL;DR text to prepend if missing */
  tldr?: string;
}

export interface AdaptResult {
  /** Full markdown body with TL;DR prepended if needed (no front matter) */
  bodyMarkdown: string;
  /** Validated title */
  title: string;
  /** Validated description (max 170 chars) */
  description: string;
  /** Validated tags (max 4, normalized) */
  tags: string[];
  /** Generated YAML front matter string */
  frontMatter: string;
  /** Full article text: front matter + body */
  fullMarkdown: string;
  /** Warnings from validation */
  warnings: string[];
}

// ---------------------------------------------------------------------------
// Tag validation
// ---------------------------------------------------------------------------

/**
 * Validate and normalize Dev.to tags.
 * Rules: max 4 tags, lowercase, alphanumeric + hyphens, max 30 chars each.
 */
function validateTags(tags: string[]): { valid: string[]; warnings: string[] } {
  const warnings: string[] = [];
  const normalized: string[] = [];

  for (const raw of tags) {
    const tag = raw.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 30);
    if (tag.length === 0) {
      warnings.push(`Tag "${raw}" was removed — contains no valid characters.`);
      continue;
    }
    if (tag !== raw.toLowerCase()) {
      warnings.push(`Tag "${raw}" was normalized to "${tag}".`);
    }
    if (normalized.length < 4) {
      normalized.push(tag);
    }
  }

  if (tags.length > 4) {
    warnings.push(`Only 4 tags allowed. Dropped: ${tags.slice(4).join(', ')}`);
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
        `Code block at line ${lineNum} has no language tag. Add a language (e.g., \`\`\`typescript).`,
      );
    }
  }

  return warnings;
}

// ---------------------------------------------------------------------------
// TL;DR injection
// ---------------------------------------------------------------------------

/**
 * Check if the markdown already has a TL;DR section.
 */
function hasTldr(markdown: string): boolean {
  return /^#{1,3}\s*TL;?DR/im.test(markdown) || /^\*?\*?TL;?DR\*?\*?[:\s]/im.test(markdown);
}

/**
 * Prepend a TL;DR section if not present.
 */
function injectTldr(markdown: string, tldr: string): string {
  if (hasTldr(markdown)) {
    return markdown;
  }

  const tldrBlock = `## TL;DR\n\n${tldr.trim()}\n\n---\n\n`;
  return tldrBlock + markdown;
}

// ---------------------------------------------------------------------------
// Front matter generation
// ---------------------------------------------------------------------------

function generateFrontMatter(opts: {
  title: string;
  published: boolean;
  description: string;
  tags: string[];
  coverImageUrl?: string;
  canonicalUrl?: string;
}): string {
  const lines: string[] = ['---'];
  lines.push(`title: "${opts.title.replace(/"/g, '\\"')}"`);
  lines.push(`published: ${opts.published}`);
  lines.push(`description: "${opts.description.replace(/"/g, '\\"')}"`);

  if (opts.tags.length > 0) {
    lines.push(`tags: ${opts.tags.join(', ')}`);
  }

  if (opts.coverImageUrl) {
    lines.push(`cover_image: ${opts.coverImageUrl}`);
  }

  if (opts.canonicalUrl) {
    lines.push(`canonical_url: ${opts.canonicalUrl}`);
  }

  lines.push('---');
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Main adapter
// ---------------------------------------------------------------------------

/**
 * Transform markdown content for Dev.to publishing.
 *
 * - Validates and normalizes tags
 * - Validates code blocks have language tags
 * - Injects TL;DR if not present
 * - Generates YAML front matter
 * - Returns structured output
 */
export function adaptForDevto(options: AdaptOptions): AdaptResult {
  const warnings: string[] = [];

  // Validate title
  let title = options.title.trim();
  if (title.length < 10) {
    warnings.push(`Title is very short (${title.length} chars). Aim for 60-80 characters.`);
  }
  if (title.length > 100) {
    warnings.push(`Title is too long (${title.length} chars). Dev.to recommends under 100.`);
    title = title.slice(0, 100);
  }

  // Validate description
  let description = (options.description ?? '').trim();
  if (description.length > 170) {
    warnings.push(`Description truncated from ${description.length} to 170 characters.`);
    description = description.slice(0, 170);
  }
  if (description.length === 0) {
    // Auto-generate from first paragraph
    const firstParagraph = options.markdown
      .split('\n\n')
      .find(p => p.trim().length > 0 && !p.trim().startsWith('#'));
    description = (firstParagraph ?? title).replace(/\n/g, ' ').trim().slice(0, 170);
    warnings.push('Description was empty — auto-generated from first paragraph.');
  }

  // Validate tags
  const tagResult = validateTags(options.tags ?? []);
  warnings.push(...tagResult.warnings);

  // Validate code blocks
  const codeWarnings = validateCodeBlocks(options.markdown);
  warnings.push(...codeWarnings);

  // Inject TL;DR if needed
  let bodyMarkdown = options.markdown;
  if (options.tldr && !hasTldr(bodyMarkdown)) {
    bodyMarkdown = injectTldr(bodyMarkdown, options.tldr);
  } else if (!hasTldr(bodyMarkdown)) {
    warnings.push(
      'Article has no TL;DR section. Consider adding one at the top for better engagement.',
    );
  }

  // Generate front matter
  const frontMatter = generateFrontMatter({
    title,
    published: options.published ?? false,
    description,
    tags: tagResult.valid,
    coverImageUrl: options.coverImageUrl,
    canonicalUrl: options.canonicalUrl,
  });

  const fullMarkdown = `${frontMatter}\n\n${bodyMarkdown}`;

  return {
    bodyMarkdown,
    title,
    description,
    tags: tagResult.valid,
    frontMatter,
    fullMarkdown,
    warnings,
  };
}
