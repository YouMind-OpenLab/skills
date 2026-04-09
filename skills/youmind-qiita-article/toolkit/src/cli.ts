#!/usr/bin/env tsx
/**
 * CLI entry point for YouMind Qiita Skill.
 *
 * Usage:
 *   npx tsx src/cli.ts publish article.md --tags "Python,API,Qiita"
 *   npx tsx src/cli.ts preview article.md
 *   npx tsx src/cli.ts validate
 *   npx tsx src/cli.ts list --page 1
 */

import { Command } from 'commander';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, basename } from 'node:path';

import { loadQiitaConfig, listMyItems } from './qiita-api.js';
import { publish } from './publisher.js';
import { adaptForQiita } from './content-adapter.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Strip existing YAML front matter from markdown content.
 */
function parseFrontMatter(raw: string): { data: Record<string, unknown>; content: string } {
  const fmRegex = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/;
  const match = raw.match(fmRegex);
  if (!match) {
    return { data: {}, content: raw };
  }

  const data: Record<string, unknown> = {};
  for (const line of match[1].split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim();
      let value: unknown = line.slice(colonIdx + 1).trim();
      if (typeof value === 'string' && value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
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
  .name('youmind-qiita')
  .description('YouMind Qiita: AI-powered article writing and publishing')
  .version('1.0.0');

// --- publish ---

program
  .command('publish')
  .description('Publish a markdown file to Qiita')
  .argument('<input>', 'Markdown file path')
  .option('--private', 'Publish as private/limited sharing (default)', true)
  .option('--public', 'Publish publicly')
  .option('--tags <tags>', 'Comma-separated tags (max 5)')
  .option('--tweet', 'Post to Twitter/X if integration enabled')
  .option('--slide', 'Enable slide/presentation mode')
  .option('--org <name>', 'Publish under an organization')
  .action(async (input: string, opts) => {
    const cfg = loadQiitaConfig();

    if (!cfg.apiKey) {
      console.error('Error: youmind.api_key not set in config.yaml');
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
    const isPrivate = opts.public ? false : (fm.private === false ? false : true);

    // Adapt content
    const adapted = adaptForQiita({
      markdown: content,
      title,
      tags,
      private: isPrivate,
      slide: opts.slide || false,
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
    console.log(`Tags: ${adapted.tags.map(t => t.name).join(', ') || '(none)'}`);
    console.log(`Private: ${isPrivate}`);
    console.log('');

    // Publish
    try {
      const result = await publish({
        config: cfg,
        title: adapted.title,
        markdown: adapted.bodyMarkdown,
        tags: adapted.tags,
        private: isPrivate,
        tweet: opts.tweet || false,
        slide: opts.slide || false,
        organizationUrlName: opts.org || null,
      });

      console.log('Article published successfully!');
      console.log(`  ID: ${result.id}`);
      console.log(`  URL: ${result.url}`);
      console.log(`  Status: ${result.private ? 'private (limited sharing)' : 'public'}`);
    } catch (err) {
      console.error(`Publish failed: ${(err as Error).message}`);

      // Fallback: save adapted markdown locally
      const fallbackPath = filePath.replace(/\.md$/, '.qiita.md');
      writeFileSync(fallbackPath, adapted.bodyMarkdown, 'utf-8');
      console.log(`Saved adapted markdown to: ${fallbackPath}`);
      console.log('You can copy-paste this into Qiita editor manually.');
      process.exit(1);
    }
  });

// --- preview ---

program
  .command('preview')
  .description('Validate and preview content for Qiita (no publishing)')
  .argument('<input>', 'Markdown file path')
  .option('--tags <tags>', 'Comma-separated tags (max 5)')
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

    const adapted = adaptForQiita({
      markdown: content,
      title,
      tags,
    });

    console.log('=== Qiita Article Preview ===\n');
    console.log(`Title: ${adapted.title}`);
    console.log(`Tags: ${adapted.tags.map(t => t.name).join(', ') || '(none)'}`);
    console.log(`Word count: ~${content.split(/\s+/).length}`);
    console.log('');

    if (adapted.warnings.length > 0) {
      console.log('Warnings:');
      for (const w of adapted.warnings) {
        console.log(`  - ${w}`);
      }
      console.log('');
    } else {
      console.log('No warnings. Article looks good for Qiita!');
      console.log('');
    }

    // Save if output path provided
    if (opts.output) {
      const outputPath = resolve(opts.output);
      writeFileSync(outputPath, adapted.bodyMarkdown, 'utf-8');
      console.log(`Adapted markdown saved to: ${outputPath}`);
    }
  });

// --- validate ---

program
  .command('validate')
  .description('Check YouMind API key and Qiita API connectivity')
  .action(async () => {
    const cfg = loadQiitaConfig();

    if (!cfg.apiKey) {
      console.error('Error: youmind.api_key not set in config.yaml');
      process.exit(1);
    }

    console.log('Checking Qiita API connectivity...');
    try {
      const items = await listMyItems(cfg, 1, 1);
      console.log('Qiita API connection successful!');
      console.log(`Your account has articles. Latest: ${items[0]?.title || '(no articles yet)'}`);
    } catch (err) {
      console.error(`Qiita API check failed: ${(err as Error).message}`);
      process.exit(1);
    }

    console.log('YouMind API key: configured');
  });

// --- list ---

program
  .command('list')
  .description('List your Qiita articles')
  .option('--page <n>', 'Page number', '1')
  .option('--per-page <n>', 'Articles per page', '10')
  .action(async (opts) => {
    const cfg = loadQiitaConfig();

    if (!cfg.apiKey) {
      console.error('Error: youmind.api_key not set in config.yaml');
      process.exit(1);
    }

    const page = parseInt(opts.page, 10);
    const perPage = parseInt(opts.perPage, 10);

    try {
      const items = await listMyItems(cfg, page, perPage);

      if (items.length === 0) {
        console.log('No articles found.');
        return;
      }

      console.log(`Your Qiita articles (page ${page}):\n`);
      for (const a of items) {
        const status = a.private ? 'private' : 'public';
        const likes = a.likes_count ?? 0;
        const stocks = a.stocks_count ?? 0;
        console.log(
          `  [${status}] ${a.title}`,
        );
        console.log(
          `    URL: ${a.url}  |  Likes: ${likes}  |  Stocks: ${stocks}  |  Tags: ${a.tags.map(t => t.name).join(', ')}`,
        );
        console.log('');
      }
    } catch (err) {
      console.error(`Failed to list articles: ${(err as Error).message}`);
      process.exit(1);
    }
  });

program.parse();
