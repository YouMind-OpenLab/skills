#!/usr/bin/env tsx
/**
 * CLI entry point for YouMind Reddit Skill.
 *
 * Usage:
 *   npx tsx src/cli.ts submit --subreddit programming --title "My Post" --file article.md
 *   npx tsx src/cli.ts submit-link --subreddit technology --title "Cool Article" --url https://example.com
 *   npx tsx src/cli.ts preview --title "My Post" --file article.md
 *   npx tsx src/cli.ts subreddit-info --sub programming
 *   npx tsx src/cli.ts flairs --sub programming
 *   npx tsx src/cli.ts me
 */

import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { getMe, getSubredditRules, getFlairs, loadRedditConfig, getAuthMode } from './reddit-api.js';
import { closeBrowser, browserLogin } from './reddit-browser.js';
import {
  publishSelfPost,
  publishLinkPost,
  analyzeSubreddit,
  preview,
} from './publisher.js';

const program = new Command();

program
  .name('youmind-reddit')
  .description('YouMind Reddit: Write and publish posts to Reddit')
  .version('1.0.0');

program
  .command('submit')
  .description('Submit a self-post to a subreddit')
  .requiredOption('--subreddit <sub>', 'Target subreddit (without r/)')
  .requiredOption('--title <title>', 'Post title')
  .option('--text <text>', 'Post body text')
  .option('--file <path>', 'Read body from a Markdown file')
  .option('--flair-id <id>', 'Flair ID')
  .option('--flair-text <text>', 'Flair text')
  .option('--tldr <text>', 'Custom TL;DR text')
  .option('--question <q>', 'Discussion question to append')
  .action(async (opts) => {
    let content = opts.text || '';
    if (opts.file) {
      content = readFileSync(resolve(opts.file), 'utf-8');
    }
    if (!content) {
      console.error('Error: --text or --file required');
      process.exit(1);
    }

    const result = await publishSelfPost({
      subreddit: opts.subreddit,
      title: opts.title,
      content,
      flairId: opts.flairId,
      flairText: opts.flairText,
      tldr: opts.tldr,
      discussionQuestion: opts.question,
    });

    if (result.success) {
      console.log('\nPost submitted successfully!');
      console.log(`Post ID: ${result.postId}`);
      console.log(`URL: ${result.postUrl}`);
      console.log(`Subreddit: r/${result.subreddit}`);
    } else {
      console.error(`\nSubmit failed: ${result.error}`);
    }

    if (result.suggestedFlair) {
      console.log(`\nSuggested flair: ${result.suggestedFlair}`);
    }

    if (result.warnings.length > 0) {
      console.log('\nWarnings:');
      for (const w of result.warnings) console.log(`  - ${w}`);
    }
  });

program
  .command('submit-link')
  .description('Submit a link post to a subreddit')
  .requiredOption('--subreddit <sub>', 'Target subreddit')
  .requiredOption('--title <title>', 'Post title')
  .requiredOption('--url <url>', 'Link URL')
  .option('--flair-id <id>', 'Flair ID')
  .option('--flair-text <text>', 'Flair text')
  .action(async (opts) => {
    const result = await publishLinkPost({
      subreddit: opts.subreddit,
      title: opts.title,
      url: opts.url,
      flairId: opts.flairId,
      flairText: opts.flairText,
    });

    if (result.success) {
      console.log('\nLink post submitted!');
      console.log(`Post ID: ${result.postId}`);
      console.log(`URL: ${result.postUrl}`);
      console.log(`Subreddit: r/${result.subreddit}`);
    } else {
      console.error(`\nSubmit failed: ${result.error}`);
    }

    if (result.warnings.length > 0) {
      console.log('\nWarnings:');
      for (const w of result.warnings) console.log(`  - ${w}`);
    }
  });

program
  .command('preview')
  .description('Preview adapted content without submitting')
  .requiredOption('--title <title>', 'Post title')
  .option('--text <text>', 'Post body text')
  .option('--file <path>', 'Read body from a file')
  .option('--subreddit <sub>', 'Target subreddit for tone hints')
  .option('--tldr <text>', 'Custom TL;DR')
  .option('--question <q>', 'Discussion question')
  .action((opts) => {
    let content = opts.text || '';
    if (opts.file) {
      content = readFileSync(resolve(opts.file), 'utf-8');
    }
    if (!content) {
      console.error('Error: --text or --file required');
      process.exit(1);
    }

    const result = preview(opts.title, content, {
      subreddit: opts.subreddit,
      tldrText: opts.tldr,
      discussionQuestion: opts.question,
    });

    console.log(`Title: ${result.title}`);
    console.log(`Character count: ${result.charCount}/40000`);

    if (result.suggestedFlair) {
      console.log(`Suggested flair: ${result.suggestedFlair}`);
    }

    if (result.warnings.length > 0) {
      console.log('\nWarnings:');
      for (const w of result.warnings) console.log(`  - ${w}`);
    }

    console.log('\n--- Body Preview ---');
    console.log(result.body);
    console.log('--- End ---');
  });

program
  .command('subreddit-info')
  .description('Show subreddit rules, flairs, and tone guidance')
  .requiredOption('--sub <subreddit>', 'Subreddit name')
  .action(async (opts) => {
    const analysis = await analyzeSubreddit(opts.sub);

    console.log(`\n=== r/${opts.sub} ===\n`);

    if (analysis.tone) {
      console.log('Tone:');
      console.log(`  Formality: ${analysis.tone.formality}`);
      console.log(`  Technical level: ${analysis.tone.technicalLevel}`);
      console.log(`  Humor accepted: ${analysis.tone.humorAccepted}`);
      console.log('  Tips:');
      for (const tip of analysis.tone.tips) {
        console.log(`    - ${tip}`);
      }
    }

    if (analysis.rules.length > 0) {
      console.log(`\nRules (${analysis.rules.length}):`);
      for (const rule of analysis.rules) {
        console.log(`  - ${rule.short_name}: ${rule.description?.slice(0, 100) || '(no description)'}`);
      }
    } else {
      console.log('\nNo rules found (may require auth or subreddit is private).');
    }

    if (analysis.flairs.length > 0) {
      console.log(`\nFlairs (${analysis.flairs.length}):`);
      for (const flair of analysis.flairs) {
        console.log(`  - [${flair.id}] ${flair.text}`);
      }
    } else {
      console.log('\nNo flairs available.');
    }
  });

program
  .command('flairs')
  .description('List available flairs for a subreddit')
  .requiredOption('--sub <subreddit>', 'Subreddit name')
  .action(async (opts) => {
    const config = loadRedditConfig();
    const flairs = await getFlairs(config, opts.sub);
    if (flairs.length === 0) {
      console.log('No flairs available for this subreddit.');
      return;
    }
    console.log(`Flairs for r/${opts.sub}:\n`);
    for (const flair of flairs) {
      console.log(`  [${flair.id}] ${flair.text} (editable: ${flair.text_editable})`);
    }
  });

program
  .command('me')
  .description('Show authenticated Reddit user profile')
  .action(async () => {
    try {
      const config = loadRedditConfig();
      const user = await getMe(config);
      console.log('Reddit Profile:');
      console.log(`  Username: ${user.name}`);
      console.log(`  Link karma: ${user.link_karma}`);
      console.log(`  Comment karma: ${user.comment_karma}`);
      console.log(`  Account age: ${new Date(user.created_utc * 1000).toLocaleDateString()}`);
    } finally {
      await closeBrowser();
    }
  });

program
  .command('login')
  .description('Log in to Reddit via browser (cookie mode). Opens a browser window for manual login.')
  .action(async () => {
    const config = loadRedditConfig();
    if (getAuthMode(config) === 'oauth') {
      console.log('OAuth mode is active (client_id/client_secret configured). No browser login needed.');
      return;
    }
    try {
      await browserLogin(config);
    } finally {
      await closeBrowser();
    }
  });

program.parse();
