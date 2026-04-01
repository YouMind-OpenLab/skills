#!/usr/bin/env tsx
/**
 * CLI entry point for YouMind Medium Skill.
 *
 * Usage:
 *   npx tsx src/cli.ts publish article.md --draft
 *   npx tsx src/cli.ts publish article.md --public --tags "ai,writing"
 *   npx tsx src/cli.ts preview article.md
 *   npx tsx src/cli.ts validate
 *   npx tsx src/cli.ts publications
 */

import { Command } from 'commander';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, basename } from 'node:path';

import { loadConfig, getUser, getUserPublications } from './medium-api.js';
import { publish } from './publisher.js';
import { adaptForMedium } from './content-adapter.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Parse simple YAML-like front matter from markdown.
 * Returns { data, content } where data is key-value pairs and content is the body.
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
  .name('youmind-medium')
  .description('YouMind Medium: AI-powered article publishing (API is deprecated but functional)')
  .version('1.0.0');

// --- publish ---

program
  .command('publish')
  .description('Publish a markdown file to Medium')
  .argument('<input>', 'Markdown file path')
  .option('--draft', 'Publish as draft (default)')
  .option('--public', 'Publish publicly')
  .option('--unlisted', 'Publish as unlisted')
  .option('--tags <tags>', 'Comma-separated tags (max 5)')
  .option('--publication <id>', 'Publication ID to publish under')
  .option('--canonical-url <url>', 'Canonical URL for cross-posting')
  .option('--format <format>', 'Content format: markdown or html', 'markdown')
  .option('--token <token>', 'Medium integration token (overrides config)')
  .action(async (input: string, opts) => {
    const cfg = loadConfig();
    const token = opts.token || cfg.medium.token;

    if (!token) {
      console.error('Error: Medium integration token required.');
      console.error('Set medium.token in config.yaml or pass --token.');
      console.error('Get your token from: https://medium.com/me/settings/security');
      process.exit(1);
    }

    const filePath = resolve(input);
    if (!existsSync(filePath)) {
      console.error(`Error: File not found: ${filePath}`);
      process.exit(1);
    }

    const raw = readFileSync(filePath, 'utf-8');
    const { data: fm, content } = parseFrontMatter(raw);

    // Determine publish status
    let publishStatus: 'public' | 'draft' | 'unlisted' = 'draft';
    if (opts.public) publishStatus = 'public';
    else if (opts.unlisted) publishStatus = 'unlisted';
    else if (fm.publishStatus === 'public') publishStatus = 'public';
    else if (fm.publishStatus === 'unlisted') publishStatus = 'unlisted';

    // Merge front matter values with CLI options
    const title = (fm.title as string) || basename(input, '.md');
    const tags = opts.tags
      ? opts.tags.split(',').map((t: string) => t.trim())
      : typeof fm.tags === 'string'
        ? fm.tags.split(',').map((t: string) => t.trim())
        : [];
    const canonicalUrl = opts.canonicalUrl || (fm.canonical_url as string) || undefined;
    const publicationId = opts.publication || (fm.publication_id as string) || undefined;
    const contentFormat = (opts.format === 'html' ? 'html' : 'markdown') as 'markdown' | 'html';

    // Adapt content
    const adapted = adaptForMedium({
      markdown: content,
      title,
      tags,
      canonicalUrl,
      contentFormat,
      publishStatus,
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
    console.log(`Status: ${adapted.publishStatus}`);
    console.log(`Format: ${adapted.contentFormat}`);
    if (publicationId) {
      console.log(`Publication: ${publicationId}`);
    }
    console.log('');

    // Publish
    try {
      const result = await publish({
        token,
        title: adapted.title,
        content: adapted.content,
        contentFormat: adapted.contentFormat,
        tags: adapted.tags,
        canonicalUrl: adapted.canonicalUrl,
        publishStatus: adapted.publishStatus,
        publicationId,
      });

      console.log('Article published to Medium!');
      console.log(`  ID: ${result.id}`);
      console.log(`  URL: ${result.url}`);
      console.log(`  Status: ${result.publishStatus}`);
      console.log(`  Author: ${result.authorId}`);
      if (result.publicationId) {
        console.log(`  Publication: ${result.publicationId}`);
      }
      console.log('');
      console.log('Note: Medium API is publish-only. To edit, use the Medium web editor.');
    } catch (err) {
      console.error(`Publish failed: ${(err as Error).message}`);

      // Fallback: save markdown locally
      const fallbackPath = filePath.replace(/\.md$/, '.medium.md');
      writeFileSync(fallbackPath, `# ${adapted.title}\n\n${adapted.content}`, 'utf-8');
      console.log(`\nSaved article to: ${fallbackPath}`);
      console.log('You can copy-paste this into the Medium editor manually.');
      process.exit(1);
    }
  });

// --- preview ---

program
  .command('preview')
  .description('Validate and preview content for Medium (no publishing)')
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

    const adapted = adaptForMedium({
      markdown: content,
      title,
      tags,
    });

    console.log('=== Medium Article Preview ===\n');
    console.log(`Title: ${adapted.title}`);
    console.log(`Tags: ${adapted.tags.join(', ') || '(none)'}`);
    console.log(`Format: ${adapted.contentFormat}`);
    console.log(`Word count: ~${content.split(/\s+/).filter(w => w.length > 0).length}`);
    console.log('');

    if (adapted.warnings.length > 0) {
      console.log('Warnings:');
      for (const w of adapted.warnings) {
        console.log(`  - ${w}`);
      }
      console.log('');
    } else {
      console.log('No warnings. Article looks good for Medium!');
      console.log('');
    }

    // Show first 500 chars of content
    console.log('--- Content Preview ---');
    console.log(adapted.content.slice(0, 500));
    if (adapted.content.length > 500) {
      console.log(`\n... (${adapted.content.length - 500} more chars)`);
    }
    console.log('');

    // Save if output path provided
    if (opts.output) {
      const outputPath = resolve(opts.output);
      const output = `# ${adapted.title}\n\n${adapted.content}`;
      writeFileSync(outputPath, output, 'utf-8');
      console.log(`Adapted markdown saved to: ${outputPath}`);
    }
  });

// --- validate ---

program
  .command('validate')
  .description('Check Medium integration token and get user info')
  .option('--token <token>', 'Medium integration token (overrides config)')
  .action(async (opts) => {
    const cfg = loadConfig();
    const token = opts.token || cfg.medium.token;

    if (!token) {
      console.error('No Medium integration token found.');
      console.error('Set medium.token in config.yaml or pass --token.');
      console.error('Get your token from: https://medium.com/me/settings/security');
      process.exit(1);
    }

    console.log('Checking Medium API connectivity...\n');
    try {
      const user = await getUser(token);
      console.log('Medium API connection successful!');
      console.log(`  Name: ${user.name}`);
      console.log(`  Username: @${user.username}`);
      console.log(`  Profile: ${user.url}`);
      console.log(`  User ID: ${user.id}`);
    } catch (err) {
      console.error(`Medium API check failed: ${(err as Error).message}`);
      process.exit(1);
    }

    // Check YouMind config
    const ymKey = cfg.youmind?.api_key;
    if (ymKey) {
      console.log('\nYouMind API key: configured');
    } else {
      console.log('\nYouMind API key: not configured (optional, for knowledge base features)');
    }

    console.log('\nNote: Medium API is deprecated but functional. Supports publish-only (no updates/deletes).');
  });

// --- publications ---

program
  .command('publications')
  .description("List your Medium publications")
  .option('--token <token>', 'Medium integration token (overrides config)')
  .action(async (opts) => {
    const cfg = loadConfig();
    const token = opts.token || cfg.medium.token;

    if (!token) {
      console.error('No Medium integration token found.');
      console.error('Set medium.token in config.yaml or pass --token.');
      process.exit(1);
    }

    try {
      // First get the user ID
      const user = await getUser(token);
      console.log(`Publications for @${user.username}:\n`);

      // Then get publications
      const publications = await getUserPublications(token, user.id);

      if (publications.length === 0) {
        console.log('No publications found.');
        console.log('You can create or join publications at https://medium.com');
        return;
      }

      for (const pub of publications) {
        console.log(`  ${pub.name}`);
        console.log(`    ID: ${pub.id}`);
        console.log(`    URL: ${pub.url}`);
        if (pub.description) {
          console.log(`    Description: ${pub.description.slice(0, 100)}`);
        }
        console.log('');
      }

      console.log('To publish to a publication, use:');
      console.log('  --publication <id> flag, or set medium.publication_id in config.yaml');
    } catch (err) {
      console.error(`Failed to list publications: ${(err as Error).message}`);
      process.exit(1);
    }
  });

program.parse();
