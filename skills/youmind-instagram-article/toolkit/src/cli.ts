#!/usr/bin/env node

/**
 * CLI for the YouMind Instagram Article skill.
 *
 * Commands:
 *   publish <input>              — publish single image post
 *   carousel <input>             — publish carousel post
 *   preview <input>              — show formatted caption preview
 *   validate                     — check Instagram credentials
 *   list                         — list recent media
 *   status <container_id>        — check media container processing status
 */

import { Command } from 'commander';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { adaptContent } from './content-adapter.js';
import { publishSingleImage, publishCarousel } from './publisher.js';
import {
  loadInstagramConfig,
  getAccountInfo,
  listMedia,
  getMediaStatus,
} from './instagram-api.js';

const program = new Command();

program
  .name('youmind-instagram')
  .description('AI Instagram post and carousel publisher')
  .version('1.0.0');

// ---------------------------------------------------------------------------
// publish
// ---------------------------------------------------------------------------

program
  .command('publish <input>')
  .description('Publish a single image post to Instagram (image URL required)')
  .requiredOption('--image-url <url>', 'Publicly accessible image URL (REQUIRED)')
  .option('--caption <text>', 'Custom caption (overrides content adaptation)')
  .option('--hashtags <tags>', 'Comma-separated hashtags')
  .option('--niche <niche>', 'Niche/industry for hashtag generation')
  .option('--raw', 'Use input as caption directly without adaptation')
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

      // Determine caption
      let caption: string;
      if (typeof opts.caption === 'string') {
        caption = opts.caption;
      } else if (opts.raw) {
        caption = content;
      } else {
        const hashtags = typeof opts.hashtags === 'string'
          ? opts.hashtags.split(',').map(h => h.trim())
          : [];
        const adapted = adaptContent({
          content,
          hashtags,
          niche: typeof opts.niche === 'string' ? opts.niche : undefined,
        });
        caption = adapted.caption;
      }

      // Publish
      const result = await publishSingleImage({
        imageUrl: opts['image-url'] as string,
        caption,
      });

      console.log('\n--- Published Successfully ---');
      console.log(`Media ID:   ${result.id}`);
      console.log(`Type:       ${result.mediaType}`);
      if (result.permalink) {
        console.log(`Permalink:  ${result.permalink}`);
      }
    } catch (err) {
      console.error(`[ERROR] ${(err as Error).message}`);
      process.exit(1);
    }
  });

// ---------------------------------------------------------------------------
// carousel
// ---------------------------------------------------------------------------

program
  .command('carousel <input>')
  .description('Publish a carousel post to Instagram (2-10 image URLs required)')
  .requiredOption('--images <urls...>', 'Publicly accessible image URLs (2-10, space-separated)')
  .option('--caption <text>', 'Custom caption')
  .option('--hashtags <tags>', 'Comma-separated hashtags')
  .option('--niche <niche>', 'Niche/industry for hashtag generation')
  .option('--raw', 'Use input as caption directly without adaptation')
  .action(async (input: string, opts: Record<string, string | string[] | boolean | undefined>) => {
    try {
      let content: string;
      const inputPath = resolve(process.cwd(), input);
      if (existsSync(inputPath) && !input.includes('\n')) {
        content = readFileSync(inputPath, 'utf-8');
        console.log(`[INFO] Read content from file: ${inputPath}`);
      } else {
        content = input;
      }

      const imageUrls = opts.images as string[];
      if (!imageUrls?.length || imageUrls.length < 2) {
        console.error('[ERROR] Carousels require at least 2 image URLs.');
        process.exit(1);
      }

      // Determine caption
      let caption: string;
      if (typeof opts.caption === 'string') {
        caption = opts.caption;
      } else if (opts.raw) {
        caption = content;
      } else {
        const hashtags = typeof opts.hashtags === 'string'
          ? opts.hashtags.split(',').map(h => h.trim())
          : [];
        const adapted = adaptContent({
          content,
          hashtags,
          niche: typeof opts.niche === 'string' ? opts.niche : undefined,
          maxSlides: imageUrls.length,
        });
        caption = adapted.caption;
      }

      // Publish carousel
      const result = await publishCarousel({
        imageUrls,
        caption,
      });

      console.log('\n--- Carousel Published Successfully ---');
      console.log(`Media ID:   ${result.id}`);
      console.log(`Type:       ${result.mediaType}`);
      console.log(`Images:     ${imageUrls.length}`);
      if (result.permalink) {
        console.log(`Permalink:  ${result.permalink}`);
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
  .description('Preview adapted Instagram caption without publishing')
  .option('--hashtags <tags>', 'Comma-separated hashtags')
  .option('--niche <niche>', 'Niche/industry for hashtag generation')
  .option('--max-slides <n>', 'Maximum carousel slides', '10')
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
        niche: opts.niche,
        maxSlides: parseInt(opts['max-slides'] ?? '10', 10),
      });

      console.log('=== Instagram Caption Preview ===\n');
      console.log(adapted.caption);
      console.log(`\n=== Stats ===`);
      console.log(`Caption length: ${adapted.caption.length} / 2200 chars`);
      console.log(`Hashtags:       ${adapted.hashtags.length}`);
      console.log(`Slide count:    ${adapted.slideDescriptions.length}`);

      if (adapted.slideDescriptions.length > 0) {
        console.log('\n=== Carousel Slides ===');
        for (let i = 0; i < adapted.slideDescriptions.length; i++) {
          console.log(`\nSlide ${i + 1}:`);
          console.log(`  ${adapted.slideDescriptions[i]!.slice(0, 120)}`);
        }
      }

      console.log('\n=== Cover Image Prompt ===');
      console.log(adapted.coverImagePrompt);
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
  .description('Validate Instagram credentials via YouMind proxy')
  .action(async () => {
    try {
      const config = loadInstagramConfig();

      if (!config.apiKey) {
        console.error('[ERROR] youmind.api_key not set in config.yaml');
        process.exit(1);
      }

      console.log('[INFO] Validating Instagram credentials via YouMind proxy...');
      const account = await getAccountInfo(config);

      console.log('\n--- Account Info ---');
      console.log(`Account ID:  ${account.id}`);
      if (account.username) {
        console.log(`Username:    @${account.username}`);
      }
      if (account.media_count !== undefined) {
        console.log(`Media count: ${account.media_count}`);
      }
      console.log('\nCredentials are valid (via YouMind proxy)!');
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
  .description('List recent media from the Instagram account')
  .option('--limit <n>', 'Number of items to fetch', '10')
  .action(async (opts: Record<string, string>) => {
    try {
      const config = loadInstagramConfig();
      const limit = parseInt(opts.limit ?? '10', 10);
      const result = await listMedia(config, limit);

      console.log(`\n--- Recent Media (${result.data.length}) ---\n`);
      for (const media of result.data) {
        const caption = media.caption
          ? media.caption.split('\n')[0]!.slice(0, 80) + (media.caption.length > 80 ? '...' : '')
          : '(no caption)';
        console.log(`[${media.timestamp ?? 'unknown'}] ${media.id} (${media.media_type ?? 'unknown'})`);
        console.log(`  ${caption}`);
        if (media.permalink) {
          console.log(`  ${media.permalink}`);
        }
        console.log('');
      }
    } catch (err) {
      console.error(`[ERROR] ${(err as Error).message}`);
      process.exit(1);
    }
  });

// ---------------------------------------------------------------------------
// status
// ---------------------------------------------------------------------------

program
  .command('status <container_id>')
  .description('Check the processing status of a media container')
  .action(async (containerId: string) => {
    try {
      const config = loadInstagramConfig();
      const status = await getMediaStatus(config, containerId);

      console.log(`\n--- Container Status ---`);
      console.log(`Container ID: ${status.id}`);
      console.log(`Status:       ${status.status_code ?? 'UNKNOWN'}`);

      switch (status.status_code) {
        case 'FINISHED':
          console.log('\nContainer is ready to publish.');
          break;
        case 'IN_PROGRESS':
          console.log('\nContainer is still processing. Try again in a few seconds.');
          break;
        case 'ERROR':
          console.log('\nContainer processing failed. Check the image URL and try again.');
          break;
        case 'EXPIRED':
          console.log('\nContainer has expired. Create a new one.');
          break;
        default:
          console.log('\nUnknown status. Check the Instagram API documentation.');
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
