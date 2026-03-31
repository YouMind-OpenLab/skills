#!/usr/bin/env tsx
/**
 * CLI entry point for YouMind Reddit Skill.
 *
 * Usage:
 *   npx tsx src/cli.ts preview article.md
 *   npx tsx src/cli.ts publish article.md --subreddit programming
 *   npx tsx src/cli.ts hot programming --limit 10
 *   npx tsx src/cli.ts flairs programming
 */

import { Command } from 'commander';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { RedditConverter, previewHtml } from './converter.js';
import { publishPost } from './publisher.js';
import { getHotPosts, getSubredditFlairs } from './reddit-api.js';

const program = new Command();

program
  .name('youmind-reddit')
  .description('YouMind Reddit: AI-powered article writing and posting')
  .version('1.0.0');

program
  .command('preview')
  .description('Generate HTML preview of Reddit post')
  .argument('<input>', 'Markdown file path')
  .option('-o, --output <path>', 'Output HTML file path')
  .option('--no-open', "Don't open browser")
  .action(async (input: string, opts) => {
    const converter = new RedditConverter();
    const result = converter.convertFile(input);
    const html = previewHtml(result.body, result.title);

    const outputPath = opts.output || input.replace(/\.md$/, '.reddit-preview.html');
    writeFileSync(outputPath, html, 'utf-8');

    console.log(`Title: ${result.title}`);
    console.log(`Digest: ${result.digest}`);
    console.log(`Images: ${result.images.length}`);
    console.log(`Body length: ${result.body.length} chars`);
    console.log(`Output: ${outputPath}`);

    if (opts.open !== false) {
      const { default: open } = await import('open');
      await open(`file://${resolve(outputPath)}`);
    }
  });

program
  .command('publish')
  .description('Publish article as Reddit post')
  .argument('<input>', 'Markdown file path')
  .requiredOption('-s, --subreddit <name>', 'Target subreddit')
  .option('-f, --flair <id>', 'Flair ID')
  .option('-x, --crosspost <subs>', 'Comma-separated subreddits to crosspost to')
  .option('--title <text>', 'Override post title')
  .action(async (input: string, opts) => {
    const converter = new RedditConverter();
    const result = converter.convertFile(input);

    const title = opts.title || result.title;
    if (!title) {
      console.error('Error: No title found. Use --title or add an H1 heading.');
      process.exit(1);
    }

    console.log(`Title: ${title}`);
    console.log(`Subreddit: r/${opts.subreddit}`);
    console.log(`Body length: ${result.body.length} chars`);

    const crosspostTo = opts.crosspost?.split(',').map((s: string) => s.trim()).filter(Boolean);

    const published = await publishPost({
      subreddit: opts.subreddit,
      title,
      body: result.body,
      flairId: opts.flair,
      crosspostTo,
    });

    console.log(`\nPost published!`);
    console.log(`  ID: ${published.postId}`);
    console.log(`  URL: ${published.postUrl}`);
    if (published.crossposts.length) {
      console.log(`  Crossposts:`);
      for (const xp of published.crossposts) {
        console.log(`    r/${xp.subreddit}: ${xp.url}`);
      }
    }
  });

program
  .command('hot')
  .description('Show hot posts from a subreddit')
  .argument('<subreddit>', 'Subreddit name')
  .option('-l, --limit <n>', 'Number of posts', '10')
  .action(async (subreddit: string, opts) => {
    const posts = await getHotPosts(subreddit, parseInt(opts.limit));
    console.log(`\nHot posts in r/${subreddit}:\n`);
    for (const [i, post] of posts.entries()) {
      console.log(`  ${i + 1}. [${post.score}↑] ${post.title}`);
      console.log(`     ${post.numComments} comments · u/${post.author}`);
    }
  });

program
  .command('flairs')
  .description('List available flairs for a subreddit')
  .argument('<subreddit>', 'Subreddit name')
  .action(async (subreddit: string) => {
    const flairs = await getSubredditFlairs(subreddit);
    if (!flairs.length) {
      console.log(`No flairs available for r/${subreddit}`);
      return;
    }
    console.log(`\nFlairs for r/${subreddit}:\n`);
    for (const f of flairs) {
      console.log(`  ${f.id.padEnd(40)} ${f.text}`);
    }
  });

program.parse();
