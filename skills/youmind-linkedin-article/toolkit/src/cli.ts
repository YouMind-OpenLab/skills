#!/usr/bin/env tsx
/**
 * CLI entry point for YouMind LinkedIn Skill.
 *
 * Usage:
 *   npx tsx src/cli.ts preview article.md --mode post
 *   npx tsx src/cli.ts publish-post article.md --hashtags "AI,tech"
 *   npx tsx src/cli.ts publish-article article.md --cover cover.jpg
 *   npx tsx src/cli.ts recommend article.md
 *   npx tsx src/cli.ts profile
 */

import { Command } from 'commander';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { LinkedInConverter, previewHtml } from './converter.js';
import { publishLinkedInPost, publishLinkedInArticle, recommendContentType } from './publisher.js';
import { getProfile } from './linkedin-api.js';

const program = new Command();

program
  .name('youmind-linkedin')
  .description('YouMind LinkedIn: AI-powered post and article publishing')
  .version('1.0.0');

program
  .command('preview')
  .description('Generate HTML preview')
  .argument('<input>', 'Markdown file path')
  .option('-m, --mode <type>', 'Content type: post or article', 'auto')
  .option('-o, --output <path>', 'Output HTML file path')
  .option('--no-open', "Don't open browser")
  .action(async (input: string, opts) => {
    const converter = new LinkedInConverter();
    const mdText = readFileSync(resolve(input), 'utf-8');

    let mode = opts.mode as 'post' | 'article' | 'auto';
    if (mode === 'auto') {
      mode = recommendContentType(mdText.length);
    }

    let content: string;
    let title: string;

    if (mode === 'post') {
      const result = converter.convertToPost(mdText);
      content = result.text;
      title = 'LinkedIn Post';
      console.log(`Mode: Post`);
      console.log(`Text length: ${result.text.length} / 3000 chars`);
      console.log(`Hashtags: ${result.hashtags.join(', ') || '(none)'}`);
      console.log(`Images: ${result.images.length}`);
    } else {
      const result = converter.convertToArticle(mdText);
      content = result.html;
      title = result.title || 'LinkedIn Article';
      console.log(`Mode: Article`);
      console.log(`Title: ${result.title}`);
      console.log(`Description: ${result.description}`);
      console.log(`Images: ${result.images.length}`);
    }

    const html = previewHtml(content, title, mode);
    const outputPath = opts.output || input.replace(/\.md$/, `.linkedin-${mode}.html`);
    writeFileSync(outputPath, html, 'utf-8');
    console.log(`Output: ${outputPath}`);

    if (opts.open !== false) {
      const { default: open } = await import('open');
      await open(`file://${resolve(outputPath)}`);
    }
  });

program
  .command('publish-post')
  .description('Publish as LinkedIn post')
  .argument('<input>', 'Markdown file path')
  .option('--hashtags <tags>', 'Comma-separated hashtags')
  .option('--image <path>', 'Image file to attach')
  .option('--visibility <v>', 'PUBLIC or CONNECTIONS', 'PUBLIC')
  .action(async (input: string, opts) => {
    const converter = new LinkedInConverter();
    const result = converter.convertFileToPost(input);

    const hashtags = opts.hashtags
      ? opts.hashtags.split(',').map((t: string) => t.trim())
      : result.hashtags;

    console.log(`Text length: ${result.text.length} chars`);
    console.log(`Hashtags: ${hashtags.join(', ')}`);

    const published = await publishLinkedInPost({
      text: result.text,
      imagePath: opts.image,
      hashtags,
      visibility: opts.visibility,
    });

    console.log(`\nPost published!`);
    console.log(`  URN: ${published.postUrn}`);
    console.log(`  URL: ${published.postUrl}`);
  });

program
  .command('publish-article')
  .description('Publish as LinkedIn article')
  .argument('<input>', 'Markdown file path')
  .option('--cover <path>', 'Cover image file path')
  .option('--description <text>', 'Article description')
  .option('--visibility <v>', 'PUBLIC or CONNECTIONS', 'PUBLIC')
  .action(async (input: string, opts) => {
    const converter = new LinkedInConverter();
    const result = converter.convertFileToArticle(input);

    console.log(`Title: ${result.title}`);
    console.log(`Description: ${opts.description || result.description}`);
    console.log(`Images: ${result.images.length}`);

    const published = await publishLinkedInArticle({
      title: result.title,
      htmlBody: result.html,
      description: opts.description || result.description,
      coverImagePath: opts.cover,
      visibility: opts.visibility,
    });

    console.log(`\nArticle published!`);
    console.log(`  URN: ${published.articleUrn}`);
    console.log(`  URL: ${published.articleUrl}`);
  });

program
  .command('recommend')
  .description('Recommend post vs article based on content')
  .argument('<input>', 'Markdown file path')
  .action(async (input: string) => {
    const text = readFileSync(resolve(input), 'utf-8');
    const charCount = text.length;
    const type = recommendContentType(charCount);

    console.log(`Content length: ${charCount} chars`);
    console.log(`Recommended type: ${type}`);
    console.log(`\nReason: ${type === 'post'
      ? 'Content is short enough for a LinkedIn post (≤1500 chars). Posts get higher engagement for concise content.'
      : 'Content exceeds 1500 chars. An article format allows full formatting and is better for thought leadership pieces.'
    }`);
  });

program
  .command('profile')
  .description('Show current LinkedIn profile')
  .action(async () => {
    const profile = await getProfile();
    console.log(`Name: ${profile.firstName} ${profile.lastName}`);
    console.log(`ID: ${profile.id}`);
    if (profile.headline) console.log(`Headline: ${profile.headline}`);
  });

program.parse();
