#!/usr/bin/env tsx
/**
 * CLI entry point for YouMind Dev.to Skill.
 *
 * Usage:
 *   npx tsx src/cli.ts publish article.md --tags "typescript,webdev"
 *   npx tsx src/cli.ts preview article.md
 *   npx tsx src/cli.ts validate
 *   npx tsx src/cli.ts list --page 1
 */

import { Command } from 'commander';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, basename } from 'node:path';

import {
  loadDevtoConfig,
  listDraftArticles,
  listMyArticles,
  listPublishedArticles,
  publishArticle,
  type DevtoArticle,
  unpublishArticle,
} from './devto-api.js';
import { publish } from './publisher.js';
import { adaptForDevto } from './content-adapter.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Strip existing YAML front matter from markdown content.
 * Returns { data, content } where data is the parsed front matter object.
 */
function parseFrontMatter(raw: string): { data: Record<string, unknown>; content: string } {
  const fmRegex = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/;
  const match = raw.match(fmRegex);
  if (!match) {
    return { data: {}, content: raw };
  }

  // Simple YAML key-value parsing (no dependency on gray-matter at runtime for basic cases)
  const data: Record<string, unknown> = {};
  for (const line of match[1].split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim();
      let value: unknown = line.slice(colonIdx + 1).trim();
      // Strip surrounding quotes
      if (typeof value === 'string' && value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      // Parse booleans
      if (value === 'true') value = true;
      if (value === 'false') value = false;
      data[key] = value;
    }
  }

  return { data, content: match[2] };
}

function printArticle(article: DevtoArticle): void {
  const status = article.published ? 'public' : 'draft';
  console.log(`  ID: ${article.id}`);
  console.log(`  Title: ${article.title}`);
  console.log(`  Status: ${status}`);
  console.log(`  Slug: ${article.slug}`);
  if (article.published) {
    console.log(`  URL: ${article.url}`);
  } else {
    console.log(`  Drafts dashboard: ${DEVTO_DASHBOARD_URL}`);
    console.log(`  Note: public URL may 404 until published: ${article.url}`);
  }
}

function printArticleList(label: string, articles: DevtoArticle[], page: number): void {
  if (articles.length === 0) {
    console.log(`No ${label.toLowerCase()} found.`);
    return;
  }

  console.log(`${label} (page ${page}):\n`);
  for (const article of articles) {
    const status = article.published ? 'published' : 'draft';
    const reactions = article.public_reactions_count ?? 0;
    const views = article.page_views_count ?? 0;
    console.log(`  [${status}] ${article.title}`);
    console.log(
      `    ID: ${article.id}  |  URL: ${article.url}  |  Reactions: ${reactions}  |  Views: ${views}  |  ${article.reading_time_minutes}min read`,
    );
    console.log('');
  }
}

function getConfigOrExit() {
  const config = loadDevtoConfig();

  if (!config.apiKey) {
    console.error('Error: YouMind API key not set. Configure ~/.youmind/config.yaml.');
    process.exit(1);
  }

  return config;
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

const program = new Command();
const DEVTO_DASHBOARD_URL = 'https://dev.to/dashboard';

program
  .name('youmind-devto')
  .description('YouMind Dev.to: AI-powered article writing and publishing via your connected Dev.to account')
  .version('1.0.0');

// --- publish ---

program
  .command('publish')
  .description('Publish a markdown file to Dev.to')
  .argument('<input>', 'Markdown file path')
  .option('--draft', 'Publish as draft (default)', true)
  .option('--publish', 'Publish immediately (public)')
  .option('--tags <tags>', 'Comma-separated tags (max 4)')
  .option('--cover <url>', 'Cover image URL')
  .option('--series <name>', 'Series name')
  .option('--canonical <url>', 'Canonical URL for cross-posting')
  .option('--description <text>', 'Article description (max 170 chars)')
  .action(async (input: string, opts) => {
    const config = getConfigOrExit();

    const filePath = resolve(input);
    if (!existsSync(filePath)) {
      console.error(`Error: File not found: ${filePath}`);
      process.exit(1);
    }

    const raw = readFileSync(filePath, 'utf-8');
    const { data: fm, content } = parseFrontMatter(raw);

    // Merge front matter values with CLI options
    const title = (fm.title as string) || basename(input, '.md');
    const tags = opts.tags
      ? opts.tags.split(',').map((t: string) => t.trim())
      : typeof fm.tags === 'string'
        ? fm.tags.split(',').map((t: string) => t.trim())
        : [];
    const published = opts.publish ? true : (fm.published === true ? true : false);
    const description = opts.description || (fm.description as string) || '';
    const coverImageUrl = opts.cover || (fm.cover_image as string) || undefined;
    const canonicalUrl = opts.canonical || (fm.canonical_url as string) || undefined;
    const series = opts.series || (fm.series as string) || undefined;

    // Adapt content
    const adapted = adaptForDevto({
      markdown: content,
      title,
      description,
      tags,
      coverImageUrl,
      canonicalUrl,
      published,
    });

    // Print warnings
    if (adapted.warnings.length > 0) {
      console.log('Warnings:');
      for (const w of adapted.warnings) {
        console.log(`  - ${w}`);
      }
      console.log('');
    }

    console.log(`Title: ${adapted.title}`);
    console.log(`Tags: ${adapted.tags.join(', ') || '(none)'}`);
    console.log(`Published: ${published}`);
    console.log(`Description: ${adapted.description.slice(0, 80)}...`);
    console.log('');

    // Publish
    try {
      const result = await publish({
        config,
        title: adapted.title,
        markdown: adapted.bodyMarkdown,
        tags: adapted.tags,
        description: adapted.description,
        coverImageUrl,
        canonicalUrl,
        series,
        published,
      });

      if (result.published) {
        console.log('Article published successfully!');
        console.log(`  ID: ${result.id}`);
        console.log(`  URL: ${result.url}`);
        console.log(`  Slug: ${result.slug}`);
        console.log('  Status: public');
      } else {
        console.log('Draft created successfully!');
        console.log(`  ID: ${result.id}`);
        console.log(`  Drafts dashboard: ${DEVTO_DASHBOARD_URL}`);
        console.log(`  Slug: ${result.slug}`);
        console.log('  Status: draft');
        console.log(`  Note: the public article URL may 404 until you publish it: ${result.url}`);
        console.log('  Tip: use --publish if you want to publish immediately.');
      }
    } catch (err) {
      console.error(`Publish failed: ${(err as Error).message}`);

      // Fallback: save adapted markdown locally
      const fallbackPath = filePath.replace(/\.md$/, '.devto.md');
      writeFileSync(fallbackPath, adapted.fullMarkdown, 'utf-8');
      console.log(`Saved adapted markdown to: ${fallbackPath}`);
      console.log('You can copy-paste this into Dev.to editor manually.');
      process.exit(1);
    }
  });

// --- preview ---

program
  .command('preview')
  .description('Validate and preview content for Dev.to (no publishing)')
  .argument('<input>', 'Markdown file path')
  .option('--tags <tags>', 'Comma-separated tags (max 4)')
  .option('--description <text>', 'Article description')
  .option('-o, --output <path>', 'Output adapted markdown file path')
  .action(async (input: string, opts) => {
    const filePath = resolve(input);
    if (!existsSync(filePath)) {
      console.error(`Error: File not found: ${filePath}`);
      process.exit(1);
    }

    const raw = readFileSync(filePath, 'utf-8');
    const { data: fm, content } = parseFrontMatter(raw);

    const title = (fm.title as string) || basename(input, '.md');
    const tags = opts.tags
      ? opts.tags.split(',').map((t: string) => t.trim())
      : typeof fm.tags === 'string'
        ? fm.tags.split(',').map((t: string) => t.trim())
        : [];
    const description = opts.description || (fm.description as string) || '';

    const adapted = adaptForDevto({
      markdown: content,
      title,
      description,
      tags,
    });

    console.log('=== Dev.to Article Preview ===\n');
    console.log(`Title: ${adapted.title}`);
    console.log(`Description: ${adapted.description}`);
    console.log(`Tags: ${adapted.tags.join(', ') || '(none)'}`);
    console.log(`Word count: ~${content.split(/\s+/).length}`);
    console.log('');

    if (adapted.warnings.length > 0) {
      console.log('Warnings:');
      for (const w of adapted.warnings) {
        console.log(`  - ${w}`);
      }
      console.log('');
    } else {
      console.log('No warnings. Article looks good for Dev.to!');
      console.log('');
    }

    // Front matter preview
    console.log('--- Front Matter ---');
    console.log(adapted.frontMatter);
    console.log('');

    // Save if output path provided
    if (opts.output) {
      const outputPath = resolve(opts.output);
      writeFileSync(outputPath, adapted.fullMarkdown, 'utf-8');
      console.log(`Adapted markdown saved to: ${outputPath}`);
    }
  });

// --- validate ---

program
  .command('validate')
  .description('Check the YouMind API key and Dev.to connectivity through YouMind')
  .action(async () => {
    const config = getConfigOrExit();

    console.log('Checking Dev.to connection through your YouMind account...');
    try {
      const articles = await listMyArticles(config, 1, 1);
      console.log('Dev.to connection successful!');
      console.log(`Latest article: ${articles[0]?.title || '(no articles yet)'}`);
    } catch (err) {
      console.error(`Dev.to API check failed: ${(err as Error).message}`);
      process.exit(1);
    }
  });

// --- list ---

program
  .command('list')
  .description("List your Dev.to articles")
  .option('--page <n>', 'Page number', '1')
  .option('--per-page <n>', 'Articles per page', '10')
  .action(async (opts) => {
    const config = getConfigOrExit();

    const page = parseInt(opts.page, 10);
    const perPage = parseInt(opts.perPage, 10);

    try {
      const articles = await listMyArticles(config, page, perPage);
      printArticleList('Your Dev.to articles', articles, page);
    } catch (err) {
      console.error(`Failed to list articles: ${(err as Error).message}`);
      process.exit(1);
    }
  });

program
  .command('list-drafts')
  .description('List your Dev.to drafts')
  .option('--page <n>', 'Page number', '1')
  .option('--per-page <n>', 'Articles per page', '10')
  .action(async (opts) => {
    const config = getConfigOrExit();
    const page = parseInt(opts.page, 10);
    const perPage = parseInt(opts.perPage, 10);

    try {
      const articles = await listDraftArticles(config, page, perPage);
      printArticleList('Your Dev.to drafts', articles, page);
    } catch (err) {
      console.error(`Failed to list drafts: ${(err as Error).message}`);
      process.exit(1);
    }
  });

program
  .command('list-published')
  .description('List your published Dev.to articles')
  .option('--page <n>', 'Page number', '1')
  .option('--per-page <n>', 'Articles per page', '10')
  .action(async (opts) => {
    const config = getConfigOrExit();
    const page = parseInt(opts.page, 10);
    const perPage = parseInt(opts.perPage, 10);

    try {
      const articles = await listPublishedArticles(config, page, perPage);
      printArticleList('Your published Dev.to articles', articles, page);
    } catch (err) {
      console.error(`Failed to list published articles: ${(err as Error).message}`);
      process.exit(1);
    }
  });

program
  .command('publish-article')
  .description('Publish an existing Dev.to article by ID')
  .argument('<id>', 'Dev.to article ID')
  .action(async (id: string) => {
    const config = getConfigOrExit();

    try {
      const article = await publishArticle(config, parseInt(id, 10));
      console.log('Article published successfully!');
      printArticle(article);
    } catch (err) {
      console.error(`Failed to publish article: ${(err as Error).message}`);
      process.exit(1);
    }
  });

program
  .command('unpublish-article')
  .description('Move an existing Dev.to article back to draft by ID')
  .argument('<id>', 'Dev.to article ID')
  .action(async (id: string) => {
    const config = getConfigOrExit();

    try {
      const article = await unpublishArticle(config, parseInt(id, 10));
      console.log('Article moved back to draft successfully!');
      printArticle(article);
    } catch (err) {
      console.error(`Failed to unpublish article: ${(err as Error).message}`);
      process.exit(1);
    }
  });

program.parse();
