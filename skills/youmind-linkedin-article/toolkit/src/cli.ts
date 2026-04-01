#!/usr/bin/env tsx
/**
 * CLI entry point for YouMind LinkedIn Skill.
 *
 * Usage:
 *   npx tsx src/cli.ts publish --text "Your post..." --visibility PUBLIC
 *   npx tsx src/cli.ts publish --file article.md --hashtags "#AI #Tech"
 *   npx tsx src/cli.ts preview --file article.md
 *   npx tsx src/cli.ts profile
 */

import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { getProfile, loadLinkedInConfig } from './linkedin-api.js';
import { publish, preview } from './publisher.js';
import { suggestHashtags } from './content-adapter.js';

const program = new Command();

program
  .name('youmind-linkedin')
  .description('YouMind LinkedIn: Write and publish professional posts')
  .version('1.0.0');

program
  .command('publish')
  .description('Publish a post to LinkedIn')
  .option('--text <text>', 'Post text content')
  .option('--file <path>', 'Read content from a Markdown/text file')
  .option('--image <paths...>', 'Image file paths or URLs to attach')
  .option('--visibility <vis>', 'PUBLIC or CONNECTIONS', 'PUBLIC')
  .option('--as-org', 'Post as organization page instead of personal profile')
  .option('--hashtags <tags>', 'Comma-separated hashtags')
  .option('--cta <question>', 'Call-to-action question for engagement')
  .action(async (opts) => {
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

    const result = await publish({
      content,
      images: opts.image,
      visibility: opts.visibility as 'PUBLIC' | 'CONNECTIONS',
      asOrganization: opts.asOrg,
      hashtags,
      ctaQuestion: opts.cta,
    });

    if (result.success) {
      console.log('\nPost published successfully!');
      console.log(`Post ID: ${result.postId}`);
      if (result.postUrl) {
        console.log(`Post URL: ${result.postUrl}`);
      }
    } else {
      console.error(`\nPublish failed: ${result.error}`);
    }

    if (result.extractedLinks.length > 0) {
      console.log('\nExtracted links (post as first comment for better reach):');
      for (const link of result.extractedLinks) {
        console.log(`  ${link}`);
      }
    }

    if (result.warnings.length > 0) {
      console.log('\nWarnings:');
      for (const w of result.warnings) {
        console.log(`  - ${w}`);
      }
    }

    console.log(`\nPost text (${result.postText.length} chars):`);
    console.log('---');
    console.log(result.postText);
    console.log('---');
  });

program
  .command('preview')
  .description('Preview adapted content without publishing')
  .option('--text <text>', 'Post text content')
  .option('--file <path>', 'Read content from a file')
  .option('--hashtags <tags>', 'Comma-separated hashtags')
  .option('--cta <question>', 'Call-to-action question')
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

    const result = preview(content, {
      hashtags,
      ctaQuestion: opts.cta,
    });

    console.log(`Character count: ${result.charCount}/3000`);

    if (result.extractedLinks.length > 0) {
      console.log('\nExtracted links (post as first comment):');
      for (const link of result.extractedLinks) {
        console.log(`  ${link}`);
      }
    }

    if (result.warnings.length > 0) {
      console.log('\nWarnings:');
      for (const w of result.warnings) {
        console.log(`  - ${w}`);
      }
    }

    console.log('\n--- Preview ---');
    console.log(result.text);
    console.log('--- End ---');
  });

program
  .command('suggest-hashtags')
  .description('Suggest hashtags for content')
  .option('--text <text>', 'Content text')
  .option('--file <path>', 'Read content from a file')
  .option('--count <n>', 'Number of hashtags', '5')
  .action((opts) => {
    let content = opts.text || '';
    if (opts.file) {
      content = readFileSync(resolve(opts.file), 'utf-8');
    }
    if (!content) {
      console.error('Error: --text or --file required');
      process.exit(1);
    }

    const tags = suggestHashtags(content, parseInt(opts.count));
    console.log('Suggested hashtags:');
    for (const tag of tags) {
      console.log(`  ${tag}`);
    }
  });

program
  .command('profile')
  .description('Show authenticated LinkedIn profile')
  .action(async () => {
    const config = loadLinkedInConfig();
    const profile = await getProfile(config);
    console.log('LinkedIn Profile:');
    console.log(JSON.stringify(profile, null, 2));
  });

program.parse();
