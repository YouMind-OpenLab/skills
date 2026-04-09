#!/usr/bin/env node

/**
 * CLI for the YouMind Facebook Article skill.
 *
 * Commands:
 *   publish <input>  — publish text/markdown to Facebook Page
 *   preview <input>  — show formatted preview without publishing
 *   validate         — check Page Access Token validity
 *   list             — list recent page posts
 */

import { Command } from 'commander';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { adaptContent } from './content-adapter.js';
import { publish } from './publisher.js';
import { loadFacebookConfig, getPageInfo, listPosts } from './facebook-api.js';

const program = new Command();

program
  .name('youmind-facebook')
  .description('AI Facebook Page post publisher')
  .version('1.0.0');

// ---------------------------------------------------------------------------
// publish
// ---------------------------------------------------------------------------

program
  .command('publish <input>')
  .description('Publish text or markdown content as a Facebook Page post')
  .option('--with-image <url>', 'Attach an image URL to the post')
  .option('--link <url>', 'Include a link (creates preview card)')
  .option('--schedule <timestamp>', 'Schedule post for a Unix timestamp')
  .option('--hashtags <tags>', 'Comma-separated hashtags')
  .option('--raw', 'Publish input as-is without content adaptation')
  .option('--max-chars <n>', 'Maximum characters for adapted content', '500')
  .action(async (input: string, opts: Record<string, string | boolean | undefined>) => {
    try {
      // Read input: if it looks like a file path, read the file
      let content: string;
      const inputPath = resolve(process.cwd(), input);
      if (existsSync(inputPath) && !input.includes('\n')) {
        content = readFileSync(inputPath, 'utf-8');
        console.log(`[INFO] Read content from file: ${inputPath}`);
      } else {
        content = input;
      }

      // Adapt content unless --raw
      let message: string;
      if (opts.raw) {
        message = content;
      } else {
        const hashtags = typeof opts.hashtags === 'string'
          ? opts.hashtags.split(',').map(h => h.trim())
          : [];
        const adapted = adaptContent({
          content,
          hashtags,
          link: typeof opts.link === 'string' ? opts.link : undefined,
          maxChars: parseInt(String(opts.maxChars ?? '500'), 10),
        });
        message = adapted.text;
      }

      // Publish
      const result = await publish({
        message,
        link: typeof opts.link === 'string' ? opts.link : undefined,
        imageUrl: typeof opts['with-image'] === 'string' ? opts['with-image'] as string : undefined,
        scheduledTime: typeof opts.schedule === 'string' ? parseInt(opts.schedule, 10) : undefined,
      });

      console.log('\n--- Published Successfully ---');
      console.log(`Post ID:   ${result.id}`);
      console.log(`Type:      ${result.type}`);
      console.log(`Published: ${result.published}`);
      if (result.url) {
        console.log(`URL:       ${result.url}`);
      }
    } catch (err) {
      console.error(`[ERROR] ${(err as Error).message}`);
      process.exit(1);
    }
  });

// ---------------------------------------------------------------------------
// preview
// ---------------------------------------------------------------------------

program
  .command('preview <input>')
  .description('Preview formatted post without publishing')
  .option('--hashtags <tags>', 'Comma-separated hashtags')
  .option('--link <url>', 'Include a link')
  .option('--max-chars <n>', 'Maximum characters', '500')
  .action(async (input: string, opts: Record<string, string | undefined>) => {
    try {
      let content: string;
      const inputPath = resolve(process.cwd(), input);
      if (existsSync(inputPath) && !input.includes('\n')) {
        content = readFileSync(inputPath, 'utf-8');
      } else {
        content = input;
      }

      const hashtags = opts.hashtags
        ? opts.hashtags.split(',').map(h => h.trim())
        : [];

      const adapted = adaptContent({
        content,
        hashtags,
        link: opts.link,
        maxChars: parseInt(opts.maxChars ?? '500', 10),
      });

      console.log('=== Facebook Post Preview ===\n');
      console.log(adapted.text);
      console.log(`\n=== Stats ===`);
      console.log(`Characters: ${adapted.text.length}`);
      console.log(`Title/Hook: ${adapted.title}`);
      if (adapted.hashtags.length) {
        console.log(`Hashtags:   ${adapted.hashtags.join(', ')}`);
      }
    } catch (err) {
      console.error(`[ERROR] ${(err as Error).message}`);
      process.exit(1);
    }
  });

// ---------------------------------------------------------------------------
// validate
// ---------------------------------------------------------------------------

program
  .command('validate')
  .description('Validate Facebook Page Access Token and show page info')
  .action(async () => {
    try {
      const config = loadFacebookConfig();

      if (!config.apiKey) {
        console.error('[ERROR] youmind.api_key not set in config.yaml');
        process.exit(1);
      }

      console.log('[INFO] Validating Facebook credentials via YouMind proxy...');
      const page = await getPageInfo(config);

      console.log('\n--- Page Info ---');
      console.log(`Page ID:   ${page.id}`);
      console.log(`Name:      ${page.name}`);
      if (page.fan_count !== undefined) {
        console.log(`Followers: ${page.fan_count.toLocaleString()}`);
      }
      console.log('\nCredentials are valid!');
    } catch (err) {
      console.error(`[ERROR] Validation failed: ${(err as Error).message}`);
      process.exit(1);
    }
  });

// ---------------------------------------------------------------------------
// list
// ---------------------------------------------------------------------------

program
  .command('list')
  .description('List recent posts from the Facebook Page')
  .option('--limit <n>', 'Number of posts to fetch', '10')
  .action(async (opts: Record<string, string>) => {
    try {
      const config = loadFacebookConfig();
      const limit = parseInt(opts.limit ?? '10', 10);
      const result = await listPosts(config, limit);

      console.log(`\n--- Recent Posts (${result.data.length}) ---\n`);
      for (const post of result.data) {
        const msg = post.message
          ? post.message.slice(0, 80) + (post.message.length > 80 ? '...' : '')
          : '(no text)';
        console.log(`[${post.created_time ?? 'unknown'}] ${post.id}`);
        console.log(`  ${msg}`);
        if (post.permalink_url) {
          console.log(`  ${post.permalink_url}`);
        }
        console.log('');
      }
    } catch (err) {
      console.error(`[ERROR] ${(err as Error).message}`);
      process.exit(1);
    }
  });

// ---------------------------------------------------------------------------
// Parse
// ---------------------------------------------------------------------------

program.parse();
