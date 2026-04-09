#!/usr/bin/env tsx
/**
 * CLI entry point for YouMind X Skill.
 *
 * All publishing now flows through YouMind's proxy. The skill no longer
 * juggles OAuth 2.0 Bearer tokens or OAuth 1.0a HMAC signatures locally —
 * YouMind holds the user's X credentials server-side and attaches whichever
 * flow each downstream endpoint requires.
 *
 * Usage:
 *   npx tsx src/cli.ts tweet --text "Your tweet here"
 *   npx tsx src/cli.ts thread --file article.md
 *   npx tsx src/cli.ts preview --text "Check length" --mode tweet
 *   npx tsx src/cli.ts preview --file article.md --mode thread
 *   npx tsx src/cli.ts me
 *   npx tsx src/cli.ts delete --id 1234567890
 */

import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { getMe, deleteTweet, loadXConfig } from './x-api.js';
import {
  publishTweet,
  publishThread,
  previewTweet,
  previewThread,
} from './publisher.js';

const program = new Command();

program
  .name('youmind-x')
  .description('YouMind X: Write and publish tweets and threads')
  .version('1.0.0');

program
  .command('tweet')
  .description('Publish a single tweet')
  .option('--text <text>', 'Tweet text content')
  .option('--file <path>', 'Read content from a file')
  .option('--image <paths...>', 'Image file paths or URLs')
  .option('--reply-to <id>', 'Reply to tweet ID')
  .option('--quote <id>', 'Quote tweet ID')
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
      console.error('[ERROR] youmind.api_key not set in config.yaml');
      process.exit(1);
    }

    const hashtags = opts.hashtags
      ? opts.hashtags.split(',').map((h: string) => h.trim())
      : undefined;

    const result = await publishTweet({
      content,
      media: opts.image,
      replyTo: opts.replyTo,
      quoteTweetId: opts.quote,
      hashtags,
      config,
    });

    if (result.success) {
      console.log('\nTweet published via YouMind proxy!');
      console.log(`Tweet ID: ${result.tweetIds[0]}`);
      console.log(`URL: https://x.com/i/status/${result.tweetIds[0]}`);
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
  .description('Publish a thread from long-form content')
  .option('--text <text>', 'Thread content')
  .option('--file <path>', 'Read content from a file')
  .option('--image <paths...>', 'Image for first tweet')
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
      console.error('[ERROR] youmind.api_key not set in config.yaml');
      process.exit(1);
    }

    const hashtags = opts.hashtags
      ? opts.hashtags.split(',').map((h: string) => h.trim())
      : undefined;

    const result = await publishThread({
      content,
      media: opts.image,
      hashtags,
      addNumbering: opts.numbering !== false,
      config,
    });

    if (result.success) {
      console.log(`\nThread published via YouMind proxy! (${result.tweetIds.length} tweets)`);
      for (let i = 0; i < result.tweetIds.length; i++) {
        console.log(`  ${i + 1}. https://x.com/i/status/${result.tweetIds[i]}`);
      }
    } else {
      console.error(`\nPublish failed: ${result.error}`);
    }

    if (result.warnings.length > 0) {
      console.log('\nWarnings:');
      for (const w of result.warnings) console.log(`  - ${w}`);
    }

    const tweets = result.content as string[];
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
  .command('login')
  .description('(no-op) X auth is now handled server-side by YouMind')
  .action(() => {
    console.log('YouMind handles X authentication server-side via the proxy.');
    console.log('Just set youmind.api_key in config.yaml — no separate X login needed.');
  });

program
  .command('validate')
  .description('Validate YouMind credentials and show X profile (via YouMind proxy)')
  .action(async () => {
    const config = loadXConfig();

    if (!config.apiKey) {
      console.error('[ERROR] youmind.api_key not set in config.yaml');
      process.exit(1);
    }

    try {
      console.log('[INFO] Validating X credentials via YouMind proxy...');
      const user = await getMe(config);
      console.log('\n--- X Profile ---');
      console.log(`User ID:  ${user.id}`);
      console.log(`Name:     ${user.name}`);
      console.log(`Username: @${user.username}`);
      console.log('\nCredentials are valid!');
    } catch (err) {
      console.error(`[ERROR] Validation failed: ${(err as Error).message}`);
      process.exit(1);
    }
  });

program
  .command('me')
  .description('Show authenticated X user profile (via YouMind proxy)')
  .action(async () => {
    const config = loadXConfig();
    if (!config.apiKey) {
      console.error('[ERROR] youmind.api_key not set in config.yaml');
      process.exit(1);
    }
    const user = await getMe(config);
    console.log('X Profile (via YouMind proxy):');
    console.log(JSON.stringify(user, null, 2));
  });

program
  .command('delete')
  .description('Delete a tweet (via YouMind proxy)')
  .requiredOption('--id <tweetId>', 'Tweet ID to delete')
  .action(async (opts) => {
    const config = loadXConfig();
    if (!config.apiKey) {
      console.error('[ERROR] youmind.api_key not set in config.yaml');
      process.exit(1);
    }
    const result = await deleteTweet(config, opts.id);
    console.log(result.deleted ? 'Tweet deleted.' : 'Tweet not deleted (may not exist).');
  });

program.parse();
