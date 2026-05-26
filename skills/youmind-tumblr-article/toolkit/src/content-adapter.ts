import MarkdownIt from 'markdown-it';

export interface TumblrAdaptOptions {
  raw: string;
  title?: string;
  tags?: string[];
  coverImageUrl?: string;
}

export interface TumblrAdaptResult {
  title: string;
  body: string;
  tags: string[];
  warnings: string[];
}

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: false,
});

function looksLikeHtml(input: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(input);
}

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function stripHtmlTags(input: string): string {
  return decodeHtmlEntities(input.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function extractTitleFromMarkdown(markdown: string): string | null {
  const h1 = markdown.match(/^#\s+(.+)$/m);
  return h1 ? h1[1].trim() : null;
}

function extractTitleFromHtml(html: string): string | null {
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  return h1 ? stripHtmlTags(h1[1]) : null;
}

function removeLeadingMarkdownTitle(markdown: string): string {
  return markdown.replace(/^#\s+.+\n?/, '').trim();
}

function removeLeadingHtmlTitle(html: string): string {
  return html.replace(/^\s*<h1[^>]*>[\s\S]*?<\/h1>\s*/i, '').trim();
}

function normalizeTags(tags: string[] | undefined): { tags: string[]; warnings: string[] } {
  const warnings: string[] = [];
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const raw of tags ?? []) {
    const value = raw.trim().replace(/^#/, '');
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    normalized.push(value);
  }

  if (normalized.length === 0) {
    warnings.push('No Tumblr tags provided. Tags are optional, but they help discovery.');
  }

  if (normalized.length > 20) {
    warnings.push(`Tumblr tags were trimmed from ${normalized.length} to 20.`);
    return { tags: normalized.slice(0, 20), warnings };
  }

  return { tags: normalized, warnings };
}

function prependCoverImage(body: string, coverImageUrl: string | undefined): string {
  if (!coverImageUrl?.trim()) {
    return body;
  }
  if (body.includes(coverImageUrl)) {
    return body;
  }
  return `<p><img src="${coverImageUrl.trim()}" alt="" /></p>\n${body}`.trim();
}

export function renderTumblrRichText(raw: string): string {
  const input = raw.trim();
  if (!input) {
    return '';
  }
  return looksLikeHtml(input) ? input : md.render(input).trim();
}

export function adaptForTumblr(options: TumblrAdaptOptions): TumblrAdaptResult {
  const warnings: string[] = [];
  const input = options.raw.trim();

  if (!input) {
    throw new Error('Tumblr post content is required.');
  }

  const isHtml = looksLikeHtml(input);
  const derivedTitle = isHtml ? extractTitleFromHtml(input) : extractTitleFromMarkdown(input);
  let title = options.title?.trim() || derivedTitle || 'Untitled';
  let body = isHtml ? removeLeadingHtmlTitle(input) : md.render(removeLeadingMarkdownTitle(input));

  if (!body.trim()) {
    body = isHtml ? input : md.render(input);
  }

  if (title.length > 500) {
    warnings.push(`Title trimmed from ${title.length} to 500 characters.`);
    title = title.slice(0, 500).trim();
  }

  if (/<script[\s>]/i.test(body) || /<iframe[\s>]/i.test(body)) {
    warnings.push(
      'Tumblr text posts work best with simple HTML. Scripts and iframe embeds may not render reliably.',
    );
  }

  body = prependCoverImage(body, options.coverImageUrl);

  const tags = normalizeTags(options.tags);
  warnings.push(...tags.warnings);

  return {
    title,
    body,
    tags: tags.tags,
    warnings,
  };
}
