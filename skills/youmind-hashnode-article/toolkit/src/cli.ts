#!/usr/bin/env tsx
/**
 * CLI entry point for YouMind Hashnode Skill.
 *
 * Usage:
 *   npx tsx src/cli.ts publish article.md --tags "graphql,api"
 *   npx tsx src/cli.ts preview article.md
 *   npx tsx src/cli.ts validate
 *   npx tsx src/cli.ts list
 */

import { Command } from 'commander';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, basename } from 'node:path';

import { loadHashnodeConfig, listPosts, searchTags } from './hashnode-api.js';
import { publish } from './publisher.js';
import { adaptForHashnode } from './content-adapter.js';

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
  .name('youmind-hashnode')
  .description('YouMind Hashnode: AI-powered article writing and publishing')
  .version('1.0.0');

// --- publish ---

program
  .command('publish')
  .description('Publish a markdown file to Hashnode via YouMind proxy')
  .argument('<input>', 'Markdown file path')
  .option('--tags <tags>', 'Comma-separated tags (max 5)')
  .option('--subtitle <text>', 'Article subtitle / hook')
  .option('--cover <url>', 'Cover image URL (1600x840 recommended)')
  .option('--series-id <id>', 'Series ID to add the post to')
  .option('--canonical <url>', 'Canonical URL for cross-posting')
  .option('--meta-description <text>', 'SEO meta description (max 160 chars)')
  .action(async (input: string, opts) => {
    const config = loadHashnodeConfig();

    if (!config.apiKey) {
      console.error('[ERROR] youmind.api_key not set in config.yaml');
      process.exit(1);
    }

    const filePath = resolve(input);
    if (!existsSync(filePath)) {
      console.error(`Error: File not found: ${filePath}`);
      process.exit(1);
    }

    const raw = readFileSync(filePath, 'utf-8');
    const { data: fm, content } = parseFrontMatter(raw);

    // Merge front matter with CLI options
    const title = (fm.title as string) || basename(input, '.md');
    const subtitle = opts.subtitle || (fm.subtitle as string) || '';
    const tags = opts.tags
      ? opts.tags.split(',').map((t: string) => t.trim())
      : typeof fm.tags === 'string'
        ? fm.tags.split(',').map((t: string) => t.trim())
        : [];
    const coverImageUrl = opts.cover || (fm.cover_image as string) || undefined;
    const canonicalUrl = opts.canonical || (fm.canonical_url as string) || undefined;
    const seriesId = opts.seriesId || (fm.series_id as string) || undefined;
    const metaDescription = opts.metaDescription || (fm.description as string) || '';

    // Adapt content
    const adapted = adaptForHashnode({
      markdown: content,
      title,
      subtitle,
      metaDescription,
      tags,
      coverImageUrl,
      canonicalUrl,
      seriesId,
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
    console.log(`Subtitle: ${adapted.subtitle}`);
    console.log(`Tags: ${adapted.tags.join(', ') || '(none)'}`);
    console.log(`Meta: ${adapted.metaDescription.slice(0, 80)}...`);
    console.log('');

    // Publish
    try {
      const result = await publish({
        config,
        title: adapted.title,
        markdown: adapted.bodyMarkdown,
        subtitle: adapted.subtitle,
        tags: adapted.tags,
        coverImageUrl: adapted.coverImageUrl,
        canonicalUrl: adapted.canonicalUrl,
        seriesId: adapted.seriesId,
        metaTitle: adapted.title,
        metaDescription: adapted.metaDescription,
      });

      console.log('Article published successfully!');
      console.log(`  ID: ${result.id}`);
      console.log(`  URL: ${result.url}`);
      console.log(`  Slug: ${result.slug}`);
      console.log(`  Read time: ${result.readTimeInMinutes} min`);
    } catch (err) {
      console.error(`Publish failed: ${(err as Error).message}`);

      // Fallback: save markdown locally
      const fallbackPath = filePath.replace(/\.md$/, '.hashnode.md');
      writeFileSync(fallbackPath, content, 'utf-8');
      console.log(`Saved markdown to: ${fallbackPath}`);
      console.log('You can copy-paste this into the Hashnode editor manually.');
      process.exit(1);
    }
  });

// --- preview ---

program
  .command('preview')
  .description('Validate and preview content for Hashnode (no publishing)')
  .argument('<input>', 'Markdown file path')
  .option('--tags <tags>', 'Comma-separated tags (max 5)')
  .option('--subtitle <text>', 'Article subtitle')
  .option('--meta-description <text>', 'SEO meta description')
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
    const subtitle = opts.subtitle || (fm.subtitle as string) || '';
    const tags = opts.tags
      ? opts.tags.split(',').map((t: string) => t.trim())
      : typeof fm.tags === 'string'
        ? fm.tags.split(',').map((t: string) => t.trim())
        : [];
    const metaDescription = opts.metaDescription || (fm.description as string) || '';

    const adapted = adaptForHashnode({
      markdown: content,
      title,
      subtitle,
      metaDescription,
      tags,
    });

    console.log('=== Hashnode Article Preview ===\n');
    console.log(`Title: ${adapted.title}`);
    console.log(`Subtitle: ${adapted.subtitle}`);
    console.log(`Meta description: ${adapted.metaDescription}`);
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
      console.log('No warnings. Article looks good for Hashnode!');
      console.log('');
    }

    // Save if output path provided
    if (opts.output) {
      const outputPath = resolve(opts.output);
      writeFileSync(outputPath, content, 'utf-8');
      console.log(`Markdown saved to: ${outputPath}`);
    }
  });

// --- validate ---

program
  .command('validate')
  .description('Check API key and Hashnode connectivity via YouMind proxy')
  .action(async () => {
    const config = loadHashnodeConfig();

    if (!config.apiKey) {
      console.error('[ERROR] youmind.api_key not set in config.yaml');
      process.exit(1);
    }

    console.log('Checking Hashnode API connectivity via YouMind proxy...');
    try {
      const posts = await listPosts(config, 1);
      console.log('Hashnode API connection successful!');
      if (posts.length > 0) {
        console.log(`Latest post: ${posts[0].title}`);
      } else {
        console.log('No posts yet in this publication.');
      }
    } catch (err) {
      console.error(`Hashnode API check failed: ${(err as Error).message}`);
      process.exit(1);
    }
  });

// --- list ---

program
  .command('list')
  .description('List posts from your Hashnode publication via YouMind proxy')
  .option('--count <n>', 'Number of posts to fetch', '10')
  .action(async (opts) => {
    const config = loadHashnodeConfig();

    if (!config.apiKey) {
      console.error('[ERROR] youmind.api_key not set in config.yaml');
      process.exit(1);
    }

    const count = parseInt(opts.count, 10);

    try {
      const posts = await listPosts(config, count);

      if (posts.length === 0) {
        console.log('No posts found in this publication.');
        return;
      }

      console.log(`Your Hashnode posts (${posts.length}):\n`);
      for (const p of posts) {
        const reactions = p.reactionCount ?? 0;
        const views = p.views ?? 0;
        console.log(`  ${p.title}`);
        if (p.subtitle) {
          console.log(`    Subtitle: ${p.subtitle}`);
        }
        console.log(
          `    URL: ${p.url}  |  Reactions: ${reactions}  |  Views: ${views}  |  ${p.readTimeInMinutes}min read`,
        );
        if (p.tags?.length) {
          console.log(`    Tags: ${p.tags.map(t => t.name).join(', ')}`);
        }
        console.log('');
      }
    } catch (err) {
      console.error(`Failed to list posts: ${(err as Error).message}`);
      process.exit(1);
    }
  });

// --- search-tags ---

program
  .command('search-tags')
  .description('Search for Hashnode tags via YouMind proxy')
  .argument('<keyword>', 'Tag keyword to search')
  .option('--count <n>', 'Number of results', '10')
  .action(async (keyword: string, opts) => {
    const config = loadHashnodeConfig();

    if (!config.apiKey) {
      console.error('[ERROR] youmind.api_key not set in config.yaml');
      process.exit(1);
    }

    const count = parseInt(opts.count, 10);

    try {
      const tags = await searchTags(config, keyword, count);

      if (tags.length === 0) {
        console.log(`No tags found for "${keyword}".`);
        return;
      }

      console.log(`Tags matching "${keyword}":\n`);
      for (const t of tags) {
        console.log(`  ${t.name.padEnd(30)} slug: ${t.slug.padEnd(30)} posts: ${t.postsCount}`);
      }
    } catch (err) {
      console.error(`Tag search failed: ${(err as Error).message}`);
      process.exit(1);
    }
  });

program.parse();
