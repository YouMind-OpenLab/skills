#!/usr/bin/env tsx
/**
 * CLI entry point for YouMind Qiita Skill.
 *
 * Usage:
 *   node dist/cli.js publish article.md --tags "Python,API,Qiita"
 *   node dist/cli.js preview article.md
 *   node dist/cli.js validate
 *   node dist/cli.js list --page 1
 *   node dist/cli.js get <id>
 *   node dist/cli.js update <id> --title "..." --tags "a,b"
 *   node dist/cli.js delete <id>
 *   node dist/cli.js set-private <id>
 *   node dist/cli.js set-public <id>
 */

import { Command } from 'commander';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';

import {
  deleteItem,
  getItem,
  listMyItems,
  loadQiitaConfig,
  setItemPrivate,
  setItemPublic,
  updateItem,
  validateConnection,
  type QiitaConfig,
  type QiitaItem,
} from './qiita-api.js';
import { publish } from './publisher.js';
import { adaptForQiita } from './content-adapter.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

function ensureConfig(): QiitaConfig {
  const cfg = loadQiitaConfig();
  if (!cfg.apiKey) {
    console.error('Error: youmind.api_key not set. Configure ~/.youmind/config.yaml.');
    process.exit(1);
  }
  return cfg;
}

function printItem(item: QiitaItem, options: { verbose?: boolean } = {}): void {
  const status = item.private ? 'private' : 'public';
  console.log(`  [${status}] ${item.title}`);
  console.log(
    `    ID: ${item.id}  |  URL: ${item.url}  |  Likes: ${item.likesCount}  |  Stocks: ${item.stocksCount}`,
  );
  if (item.tags.length > 0) {
    console.log(`    Tags: ${item.tags.map((t) => t.name).join(', ')}`);
  }
  if (options.verbose) {
    console.log(`    Created: ${item.createdAt}  |  Updated: ${item.updatedAt}`);
    console.log(`    Reactions: ${item.reactionsCount}  |  Comments: ${item.commentsCount}`);
  }
}

function parseTags(tagsArg?: string, fmTags?: unknown): string[] {
  if (tagsArg) {
    return tagsArg.split(',').map((t) => t.trim()).filter(Boolean);
  }
  if (typeof fmTags === 'string') {
    return fmTags.split(',').map((t) => t.trim()).filter(Boolean);
  }
  if (Array.isArray(fmTags)) {
    return fmTags.filter((t): t is string => typeof t === 'string').map((t) => t.trim());
  }
  return [];
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

const program = new Command();

program
  .name('youmind-qiita')
  .description('YouMind Qiita: AI-powered article writing and publishing via YouMind OpenAPI')
  .version('1.0.0');

// --- publish ---

program
  .command('publish')
  .description('Publish a markdown file to Qiita')
  .argument('<input>', 'Markdown file path')
  .option('--private', 'Publish as private (limited sharing)')
  .option('--public', 'Publish publicly (default)')
  .option('--tags <tags>', 'Comma-separated tags (max 5)')
  .option('--tweet', 'Announce to Twitter/X if integration enabled (first publish only)')
  .option('--slide', 'Enable slide/presentation mode')
  .action(async (input: string, opts) => {
    const cfg = ensureConfig();

    const filePath = resolve(input);
    if (!existsSync(filePath)) {
      console.error(`Error: File not found: ${filePath}`);
      process.exit(1);
    }

    const raw = readFileSync(filePath, 'utf-8');
    const { data: fm, content } = parseFrontMatter(raw);

    const title = (fm.title as string) || basename(input, '.md');
    const tags = parseTags(opts.tags, fm.tags);
    const isPrivate = opts.private === true ? true : opts.public === true ? false : Boolean(fm.private);

    const adapted = adaptForQiita({
      markdown: content,
      title,
      tags,
      private: isPrivate,
      slide: opts.slide || false,
    });

    if (adapted.warnings.length > 0) {
      console.log('Warnings:');
      for (const w of adapted.warnings) {
        console.log(`  - ${w}`);
      }
      console.log('');
    }

    console.log(`Title: ${adapted.title}`);
    console.log(`Tags: ${adapted.tags.map((t) => t.name).join(', ') || '(none)'}`);
    console.log(`Private: ${isPrivate}`);
    console.log('');

    try {
      const result = await publish({
        config: cfg,
        title: adapted.title,
        markdown: adapted.bodyMarkdown,
        tags: adapted.tags,
        private: isPrivate,
        tweet: opts.tweet || false,
        slide: opts.slide || false,
      });

      console.log('Article published successfully!');
      console.log(`  ID: ${result.id}`);
      console.log(`  URL: ${result.url}`);
      console.log(`  Visibility: ${result.private ? 'private (limited sharing)' : 'public'}`);
    } catch (err) {
      console.error(`Publish failed: ${(err as Error).message}`);
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
    const tags = parseTags(opts.tags, fm.tags);

    const adapted = adaptForQiita({ markdown: content, title, tags });

    console.log('=== Qiita Article Preview ===\n');
    console.log(`Title: ${adapted.title}`);
    console.log(`Tags: ${adapted.tags.map((t) => t.name).join(', ') || '(none)'}`);
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

    if (opts.output) {
      const outputPath = resolve(opts.output);
      writeFileSync(outputPath, adapted.bodyMarkdown, 'utf-8');
      console.log(`Adapted markdown saved to: ${outputPath}`);
    }
  });

// --- validate ---

program
  .command('validate')
  .description('Check YouMind API key and Qiita connection')
  .action(async () => {
    const cfg = ensureConfig();
    console.log('Validating Qiita connection via YouMind...');
    try {
      const result = await validateConnection(cfg);
      console.log(`OK: ${result.message}`);
      if (result.accountId) console.log(`  Account ID: ${result.accountId}`);
      if (result.accountName) console.log(`  Display name: ${result.accountName}`);
      if (result.imageMonthlyUploadLimit !== undefined) {
        const remaining = result.imageMonthlyUploadRemaining ?? 0;
        const limit = result.imageMonthlyUploadLimit;
        console.log(`  Image upload quota: ${remaining}/${limit} bytes remaining this month`);
      }
    } catch (err) {
      console.error(`Validation failed: ${(err as Error).message}`);
      process.exit(1);
    }
  });

// --- list ---

program
  .command('list')
  .description('List your Qiita items (page-based)')
  .option('--page <n>', 'Page number (1-100)', '1')
  .option('--per-page <n>', 'Items per page (1-100)', '20')
  .option('-v, --verbose', 'Print extra fields (timestamps, reactions)')
  .action(async (opts) => {
    const cfg = ensureConfig();
    const page = parseInt(opts.page, 10);
    const perPage = parseInt(opts.perPage, 10);

    try {
      const response = await listMyItems(cfg, page, perPage);
      if (response.items.length === 0) {
        console.log('No items found on this page.');
        return;
      }
      console.log(
        `Your Qiita items (page ${response.page}, ${response.items.length}/${response.total} total):\n`,
      );
      for (const item of response.items) {
        printItem(item, { verbose: opts.verbose });
        console.log('');
      }
    } catch (err) {
      console.error(`Failed to list items: ${(err as Error).message}`);
      process.exit(1);
    }
  });

// --- get ---

program
  .command('get')
  .description('Fetch a single Qiita item by ID')
  .argument('<id>', 'Qiita item ID')
  .option('--show-body', 'Print the full markdown body')
  .action(async (id: string, opts) => {
    const cfg = ensureConfig();
    try {
      const item = await getItem(cfg, id);
      printItem(item, { verbose: true });
      if (opts.showBody) {
        console.log('\n--- body ---');
        console.log(item.body);
      }
    } catch (err) {
      console.error(`Failed to fetch item ${id}: ${(err as Error).message}`);
      process.exit(1);
    }
  });

// --- update ---

program
  .command('update')
  .description('Update an existing Qiita item by ID')
  .argument('<id>', 'Qiita item ID')
  .option('--title <title>', 'New title')
  .option('--body-file <path>', 'Replace body from a markdown file')
  .option('--tags <tags>', 'Replace tags (comma-separated, max 5)')
  .option('--private', 'Set the item as private')
  .option('--public', 'Set the item as public')
  .option('--slide', 'Enable slide mode')
  .option('--no-slide', 'Disable slide mode')
  .action(async (id: string, opts) => {
    const cfg = ensureConfig();
    const updates: Record<string, unknown> = {};

    if (opts.title) updates.title = opts.title;
    if (opts.bodyFile) {
      const filePath = resolve(opts.bodyFile);
      if (!existsSync(filePath)) {
        console.error(`Error: body file not found: ${filePath}`);
        process.exit(1);
      }
      updates.body = readFileSync(filePath, 'utf-8');
    }
    if (opts.tags) {
      updates.tags = parseTags(opts.tags).map((name) => ({ name }));
    }
    if (opts.private === true) updates.private = true;
    if (opts.public === true) updates.private = false;
    if (opts.slide === true) updates.slide = true;
    if (opts.slide === false) updates.slide = false;

    if (Object.keys(updates).length === 0) {
      console.error('Nothing to update. Pass at least one of: --title, --body-file, --tags, --private, --public, --slide.');
      process.exit(1);
    }

    try {
      const item = await updateItem(cfg, id, updates as Parameters<typeof updateItem>[2]);
      console.log('Item updated:');
      printItem(item, { verbose: true });
    } catch (err) {
      console.error(`Failed to update item ${id}: ${(err as Error).message}`);
      process.exit(1);
    }
  });

// --- delete ---

program
  .command('delete')
  .description('Delete a Qiita item by ID')
  .argument('<id>', 'Qiita item ID')
  .option('-y, --yes', 'Skip confirmation prompt')
  .action(async (id: string, opts) => {
    const cfg = ensureConfig();
    if (!opts.yes) {
      console.error(`Refusing to delete ${id} without --yes. Re-run with -y to confirm.`);
      process.exit(1);
    }
    try {
      const result = await deleteItem(cfg, id);
      if (result.ok) {
        console.log(`Deleted Qiita item ${result.id}.`);
      } else {
        console.error(`Delete returned ok=false for ${result.id}.`);
        process.exit(1);
      }
    } catch (err) {
      console.error(`Failed to delete item ${id}: ${(err as Error).message}`);
      process.exit(1);
    }
  });

// --- set-private / set-public ---

program
  .command('set-private')
  .description('Mark a Qiita item as private (limited sharing)')
  .argument('<id>', 'Qiita item ID')
  .action(async (id: string) => {
    const cfg = ensureConfig();
    try {
      const item = await setItemPrivate(cfg, id);
      console.log('Item set to private:');
      printItem(item, { verbose: true });
    } catch (err) {
      console.error(`Failed to set private for ${id}: ${(err as Error).message}`);
      process.exit(1);
    }
  });

program
  .command('set-public')
  .description('Mark a Qiita item as public')
  .argument('<id>', 'Qiita item ID')
  .action(async (id: string) => {
    const cfg = ensureConfig();
    try {
      const item = await setItemPublic(cfg, id);
      console.log('Item set to public:');
      printItem(item, { verbose: true });
    } catch (err) {
      console.error(`Failed to set public for ${id}: ${(err as Error).message}`);
      process.exit(1);
    }
  });

program.parse();
