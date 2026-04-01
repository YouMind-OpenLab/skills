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

import { loadConfig, listMyArticles, getArticle } from './devto-api.js';
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

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

const program = new Command();

program
  .name('youmind-devto')
  .description('YouMind Dev.to: AI-powered article writing and publishing')
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
  .option('--api-key <key>', 'Dev.to API key (overrides config)')
  .action(async (input: string, opts) => {
    const cfg = loadConfig();
    const apiKey = opts.apiKey || cfg.devto.apiKey;

    if (!apiKey) {
      console.error('Error: Dev.to API key required. Set devto.api_key in config.yaml or pass --api-key.');
      process.exit(1);
    }

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
        apiKey,
        title: adapted.title,
        markdown: adapted.bodyMarkdown,
        tags: adapted.tags,
        description: adapted.description,
        coverImageUrl,
        canonicalUrl,
        series,
        published,
      });

      console.log('Article published successfully!');
      console.log(`  ID: ${result.id}`);
      console.log(`  URL: ${result.url}`);
      console.log(`  Slug: ${result.slug}`);
      console.log(`  Status: ${result.published ? 'public' : 'draft'}`);
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
  .description('Check API key and Dev.to connectivity')
  .option('--api-key <key>', 'Dev.to API key (overrides config)')
  .action(async (opts) => {
    const cfg = loadConfig();
    const apiKey = opts.apiKey || cfg.devto.apiKey;

    if (!apiKey) {
      console.error('No Dev.to API key found.');
      console.error('Set devto.api_key in config.yaml or pass --api-key.');
      process.exit(1);
    }

    console.log('Checking Dev.to API connectivity...');
    try {
      const articles = await listMyArticles(apiKey, 1, 1);
      console.log('Dev.to API connection successful!');
      console.log(`Your account has articles. Latest: ${articles[0]?.title || '(no articles yet)'}`);
    } catch (err) {
      console.error(`Dev.to API check failed: ${(err as Error).message}`);
      process.exit(1);
    }

    // Check YouMind config
    const ymKey = cfg.youmind?.api_key;
    if (ymKey) {
      console.log('YouMind API key: configured');
    } else {
      console.log('YouMind API key: not configured (optional, for knowledge base features)');
    }
  });

// --- list ---

program
  .command('list')
  .description("List your Dev.to articles")
  .option('--page <n>', 'Page number', '1')
  .option('--per-page <n>', 'Articles per page', '10')
  .option('--api-key <key>', 'Dev.to API key (overrides config)')
  .action(async (opts) => {
    const cfg = loadConfig();
    const apiKey = opts.apiKey || cfg.devto.apiKey;

    if (!apiKey) {
      console.error('No Dev.to API key found.');
      process.exit(1);
    }

    const page = parseInt(opts.page, 10);
    const perPage = parseInt(opts.perPage, 10);

    try {
      const articles = await listMyArticles(apiKey, page, perPage);

      if (articles.length === 0) {
        console.log('No articles found.');
        return;
      }

      console.log(`Your Dev.to articles (page ${page}):\n`);
      for (const a of articles) {
        const status = a.published ? 'published' : 'draft';
        const reactions = a.public_reactions_count ?? 0;
        const views = a.page_views_count ?? 0;
        console.log(
          `  [${status}] ${a.title}`,
        );
        console.log(
          `    URL: ${a.url}  |  Reactions: ${reactions}  |  Views: ${views}  |  ${a.reading_time_minutes}min read`,
        );
        console.log('');
      }
    } catch (err) {
      console.error(`Failed to list articles: ${(err as Error).message}`);
      process.exit(1);
    }
  });

program.parse();
