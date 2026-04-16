#!/usr/bin/env tsx
/**
 * CLI entry point for YouMind X Skill.
 *
 * All publishing flows through YouMind's OpenAPI proxy. The user only needs a
 * YouMind API key locally; their X account is connected once inside YouMind.
 *
 * Usage:
 *   npx tsx src/cli.ts tweet --text "Your tweet here"
 *   npx tsx src/cli.ts tweet --text "Check this out" --image https://cdn.gooo.ai/user-files/pic.jpg
 *   npx tsx src/cli.ts thread --file article.md
 *   npx tsx src/cli.ts preview --text "Check length" --mode tweet
 *   npx tsx src/cli.ts preview --file article.md --mode thread
 *   npx tsx src/cli.ts validate
 */

import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { deleteXPost, loadXConfig } from './x-api.js';
import {
  previewThread,
  previewTweet,
  publishThread,
  publishTweet,
} from './publisher.js';

const program = new Command();

program
  .name('youmind-x')
  .description('YouMind X: Write and publish tweets and threads via YouMind OpenAPI')
  .version('1.0.0');

program
  .command('tweet')
  .description('Publish a single tweet')
  .option('--text <text>', 'Tweet text content')
  .option('--file <path>', 'Read content from a file')
  .option('--image <urls...>', 'Image URLs (https://cdn.gooo.ai/..., max 4)')
  .option('--hashtags <tags>', 'Comma-separated hashtags (max 2)')
  .action(async (opts) => {
    let content = opts.text || '';
    if (opts.file) {
      content = readFileSync(resolve(opts.file), 'utf-8');
    }
    if (!content) {
      console.error('Error: --text or --file required');
      process.exit(1);
    }

    const config = loadXConfig();
    if (!config.apiKey) {
      console.error('[ERROR] youmind.api_key not set. Configure ~/.youmind/config.yaml.');
      process.exit(1);
    }

    const hashtags = opts.hashtags
      ? opts.hashtags.split(',').map((h: string) => h.trim())
      : undefined;

    const result = await publishTweet({
      content,
      mediaUrls: opts.image,
      hashtags,
      config,
    });

    if (result.success) {
      const post = result.posts[0];
      console.log('\nTweet published via YouMind OpenAPI!');
      console.log(`Post ID: ${post.postId}`);
      console.log(`URL:     ${post.url}`);
    } else {
      console.error(`\nPublish failed: ${result.error}`);
    }

    if (result.warnings.length > 0) {
      console.log('\nWarnings:');
      for (const w of result.warnings) console.log(`  - ${w}`);
    }

    console.log(`\nText (${(result.content as string).length} chars):`);
    console.log('---');
    console.log(result.content);
    console.log('---');
  });

program
  .command('thread')
  .description('Publish a sequence of numbered tweets from long-form content')
  .option('--text <text>', 'Thread content')
  .option('--file <path>', 'Read content from a file')
  .option('--image <urls...>', 'Image URLs attached to the first tweet only')
  .option('--hashtags <tags>', 'Comma-separated hashtags')
  .option('--no-numbering', 'Disable tweet numbering')
  .action(async (opts) => {
    let content = opts.text || '';
    if (opts.file) {
      content = readFileSync(resolve(opts.file), 'utf-8');
    }
    if (!content) {
      console.error('Error: --text or --file required');
      process.exit(1);
    }

    const config = loadXConfig();
    if (!config.apiKey) {
      console.error('[ERROR] youmind.api_key not set. Configure ~/.youmind/config.yaml.');
      process.exit(1);
    }

    const hashtags = opts.hashtags
      ? opts.hashtags.split(',').map((h: string) => h.trim())
      : undefined;

    const result = await publishThread({
      content,
      mediaUrls: opts.image,
      hashtags,
      addNumbering: opts.numbering !== false,
      config,
    });

    if (result.success) {
      console.log(
        `\nThread published via YouMind OpenAPI (${result.posts.length} tweets)`,
      );
      for (let i = 0; i < result.posts.length; i++) {
        console.log(`  ${i + 1}. ${result.posts[i].url}`);
      }
    } else {
      console.error(`\nPublish failed: ${result.error}`);
      if (result.posts.length > 0) {
        console.log(`Published before failure: ${result.posts.length}`);
        for (let i = 0; i < result.posts.length; i++) {
          console.log(`  ${i + 1}. ${result.posts[i].url}`);
        }
      }
    }

    if (result.warnings.length > 0) {
      console.log('\nWarnings:');
      for (const w of result.warnings) console.log(`  - ${w}`);
    }

    const tweets = Array.isArray(result.content) ? result.content : [String(result.content)];
    console.log(`\nThread preview (${tweets.length} tweets):`);
    for (let i = 0; i < tweets.length; i++) {
      console.log(`\n--- Tweet ${i + 1} ---`);
      console.log(tweets[i]);
    }
  });

program
  .command('preview')
  .description('Preview formatted content without publishing')
  .option('--text <text>', 'Content text')
  .option('--file <path>', 'Read content from a file')
  .option('--mode <mode>', 'tweet or thread', 'tweet')
  .option('--hashtags <tags>', 'Comma-separated hashtags')
  .option('--no-numbering', 'Disable thread numbering')
  .action((opts) => {
    let content = opts.text || '';
    if (opts.file) {
      content = readFileSync(resolve(opts.file), 'utf-8');
    }
    if (!content) {
      console.error('Error: --text or --file required');
      process.exit(1);
    }

    const hashtags = opts.hashtags
      ? opts.hashtags.split(',').map((h: string) => h.trim())
      : undefined;

    if (opts.mode === 'thread') {
      const result = previewThread(content, {
        hashtags,
        addNumbering: opts.numbering !== false,
      });
      console.log(`Thread preview: ${result.totalTweets} tweets\n`);
      for (let i = 0; i < result.tweets.length; i++) {
        console.log(`--- Tweet ${i + 1} ---`);
        console.log(result.tweets[i]);
        console.log('');
      }
      if (result.warnings.length > 0) {
        console.log('Warnings:');
        for (const w of result.warnings) console.log(`  - ${w}`);
      }
    } else {
      const result = previewTweet(content, { hashtags });
      console.log(`Character count: ${result.charCount}/280`);
      if (result.warnings.length > 0) {
        console.log('\nWarnings:');
        for (const w of result.warnings) console.log(`  - ${w}`);
      }
      console.log('\n--- Preview ---');
      console.log(result.text);
      console.log('--- End ---');
    }
  });

program
  .command('validate')
  .description('Validate YouMind credentials from ~/.youmind config')
  .action(() => {
    const config = loadXConfig();

    if (!config.apiKey) {
      console.error('[ERROR] youmind.api_key not set. Configure ~/.youmind/config.yaml.');
      console.error(
        'Get a key: https://youmind.com/settings/api-keys?utm_source=youmind-x-article',
      );
      process.exit(1);
    }

    console.log('YouMind API key is configured.');
    console.log(`Base URL: ${config.baseUrl}`);
    console.log(
      'X account connection is validated on the first publish call; ' +
        'if your X account is not connected in YouMind yet, publishing will return a clear error with a connect URL.',
    );
  });

program
  .command('delete')
  .description('Delete a tweet by ID')
  .argument('<postId>', 'Tweet ID')
  .option('-y, --yes', 'Skip confirmation prompt')
  .action(async (postId: string, opts) => {
    const config = loadXConfig();
    if (!config.apiKey) {
      console.error('[ERROR] youmind.api_key not set. Configure ~/.youmind/config.yaml.');
      process.exit(1);
    }
    if (!opts.yes) {
      console.error(`Refusing to delete ${postId} without --yes. Re-run with -y to confirm.`);
      process.exit(1);
    }

    try {
      const result = await deleteXPost(config, postId);
      if (!result.ok) {
        console.error(`Delete returned ok=false for ${result.postId}.`);
        process.exit(1);
      }
      console.log(`Deleted tweet ${result.postId}.`);
    } catch (err) {
      console.error(`Delete failed: ${(err as Error).message}`);
      process.exit(1);
    }
  });

program.parse();
