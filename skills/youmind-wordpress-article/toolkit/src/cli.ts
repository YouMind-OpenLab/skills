#!/usr/bin/env node

/**
 * YouMind WordPress Article CLI
 *
 * Commands:
 *   publish <input>     Publish a Markdown file to WordPress
 *   preview <input>     Convert Markdown and preview HTML locally
 *   validate            Check WordPress connectivity via YouMind proxy
 *   list                List recent posts
 *   upload-media <file> Upload a media file to WordPress
 */

import { Command } from 'commander';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, basename } from 'node:path';
import { publish } from './publisher.js';
import { convertToHtml } from './content-adapter.js';
import {
  loadWordPressConfig,
  validateConnection,
  listPosts,
  uploadMedia,
} from './wordpress-api.js';

const program = new Command();

program
  .name('youmind-wordpress')
  .description('YouMind WordPress Article — AI-powered article publishing')
  .version('1.0.0');

// ---------------------------------------------------------------------------
// publish
// ---------------------------------------------------------------------------

program
  .command('publish <input>')
  .description('Publish a Markdown file to WordPress')
  .option('--draft', 'Publish as draft (default)')
  .option('--publish', 'Publish immediately')
  .option('--pending', 'Set status to pending review')
  .option('--private', 'Publish as private post')
  .option('--category <names>', 'Comma-separated category names')
  .option('--tags <names>', 'Comma-separated tag names')
  .option('--featured-image <file>', 'Path to featured image file')
  .option('--title <title>', 'Override post title')
  .action(async (input: string, opts: Record<string, string | boolean | undefined>) => {
    try {
      const config = loadWordPressConfig();
      if (!config.apiKey) {
        console.error('[ERROR] youmind.api_key not set in config.yaml');
        process.exit(1);
      }

      // Determine status
      let status: 'publish' | 'draft' | 'pending' | 'private' = 'draft';
      if (opts.publish) status = 'publish';
      else if (opts.pending) status = 'pending';
      else if (opts.private) status = 'private';

      const tags = typeof opts.tags === 'string'
        ? opts.tags.split(',').map(t => t.trim()).filter(Boolean)
        : undefined;

      const categories = typeof opts.category === 'string'
        ? opts.category.split(',').map(c => c.trim()).filter(Boolean)
        : undefined;

      console.log(`Publishing ${input} as ${status}...`);

      const result = await publish({
        config,
        input: resolve(input),
        isFile: true,
        status,
        tags,
        categories,
        featuredImage: typeof opts.featuredImage === 'string' ? opts.featuredImage : undefined,
        title: typeof opts.title === 'string' ? opts.title : undefined,
      });

      console.log('\nPublished successfully!');
      console.log(`  Post ID:  ${result.id}`);
      console.log(`  Status:   ${result.status}`);
      console.log(`  Title:    ${result.title}`);
      console.log(`  URL:      ${result.url}`);
      console.log(`  Slug:     ${result.slug}`);
      console.log(`  Excerpt:  ${result.excerpt.slice(0, 100)}...`);
    } catch (e) {
      console.error(`Publish failed: ${(e as Error).message}`);
      process.exit(1);
    }
  });

// ---------------------------------------------------------------------------
// preview
// ---------------------------------------------------------------------------

program
  .command('preview <input>')
  .description('Convert Markdown to HTML and preview locally')
  .option('-o, --output <file>', 'Output HTML file path')
  .action((input: string, opts: { output?: string }) => {
    try {
      const inputPath = resolve(input);
      if (!existsSync(inputPath)) {
        console.error(`File not found: ${inputPath}`);
        process.exit(1);
      }

      const markdown = readFileSync(inputPath, 'utf-8');
      const { html, title, excerpt } = convertToHtml(markdown);

      const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      max-width: 800px;
      margin: 40px auto;
      padding: 0 20px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      line-height: 1.8;
      color: #333;
    }
    h1 { font-size: 2em; margin-bottom: 0.5em; }
    h2 { font-size: 1.5em; margin-top: 1.5em; }
    h3 { font-size: 1.25em; margin-top: 1.2em; }
    code {
      background: #f4f4f4;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 0.9em;
    }
    pre {
      background: #f4f4f4;
      padding: 16px;
      border-radius: 6px;
      overflow-x: auto;
    }
    pre code { background: none; padding: 0; }
    blockquote {
      border-left: 4px solid #ddd;
      margin: 1em 0;
      padding: 0.5em 1em;
      color: #666;
    }
    img { max-width: 100%; height: auto; }
    a { color: #0366d6; }
    .excerpt {
      color: #666;
      font-style: italic;
      border-bottom: 1px solid #eee;
      padding-bottom: 1em;
      margin-bottom: 2em;
    }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <p class="excerpt">${excerpt}</p>
  ${html}
</body>
</html>`;

      const outputPath = opts.output || resolve(
        inputPath.replace(/\.md$/, '') + '.preview.html'
      );
      writeFileSync(outputPath, fullHtml, 'utf-8');

      console.log(`Preview generated: ${outputPath}`);
      console.log(`Title: ${title}`);
      console.log(`Excerpt: ${excerpt.slice(0, 100)}...`);
    } catch (e) {
      console.error(`Preview failed: ${(e as Error).message}`);
      process.exit(1);
    }
  });

// ---------------------------------------------------------------------------
// validate
// ---------------------------------------------------------------------------

program
  .command('validate')
  .description('Check WordPress connectivity via YouMind proxy')
  .action(async () => {
    const config = loadWordPressConfig();

    console.log('WordPress Configuration (via YouMind proxy):');
    console.log(`  Base URL:  ${config.baseUrl || '(not set)'}`);
    console.log(`  API Key:   ${config.apiKey ? '****' + config.apiKey.slice(-4) : '(not set)'}`);
    console.log();

    if (!config.apiKey) {
      console.error('[ERROR] youmind.api_key not set in config.yaml');
      process.exit(1);
    }

    console.log('Testing WordPress API connection via YouMind proxy...');
    const result = await validateConnection(config);
    if (result.ok) {
      console.log(`OK: ${result.message}`);
    } else {
      console.error(`FAIL: ${result.message}`);
      process.exit(1);
    }
  });

// ---------------------------------------------------------------------------
// list
// ---------------------------------------------------------------------------

program
  .command('list')
  .description('List recent WordPress posts')
  .option('--page <n>', 'Page number', '1')
  .option('--per-page <n>', 'Posts per page', '10')
  .action(async (opts: { page: string; perPage: string }) => {
    try {
      const config = loadWordPressConfig();
      if (!config.apiKey) {
        console.error('[ERROR] youmind.api_key not set in config.yaml');
        process.exit(1);
      }
      const page = parseInt(opts.page, 10);
      const perPage = parseInt(opts.perPage, 10);

      const posts = await listPosts(config, page, perPage);

      if (!posts.length) {
        console.log('No posts found.');
        return;
      }

      console.log(`Recent posts (page ${page}):\n`);
      for (const post of posts) {
        const title = post.title?.rendered || '(no title)';
        const date = post.date?.split('T')[0] || '';
        console.log(`  [${post.id}] ${date} | ${post.status.padEnd(7)} | ${title}`);
        console.log(`         ${post.link}`);
      }
    } catch (e) {
      console.error(`List failed: ${(e as Error).message}`);
      process.exit(1);
    }
  });

// ---------------------------------------------------------------------------
// upload-media
// ---------------------------------------------------------------------------

program
  .command('upload-media <file>')
  .description('Upload a media file to WordPress')
  .action(async (file: string) => {
    try {
      const filePath = resolve(file);
      if (!existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        process.exit(1);
      }

      const config = loadWordPressConfig();
      if (!config.apiKey) {
        console.error('[ERROR] youmind.api_key not set in config.yaml');
        process.exit(1);
      }
      console.log(`Uploading ${basename(filePath)}...`);

      const media = await uploadMedia(config, filePath);

      console.log('\nUpload successful!');
      console.log(`  Media ID:  ${media.id}`);
      console.log(`  URL:       ${media.source_url}`);
      console.log(`  Type:      ${media.mime_type}`);
    } catch (e) {
      console.error(`Upload failed: ${(e as Error).message}`);
      process.exit(1);
    }
  });

// ---------------------------------------------------------------------------
// Parse & run
// ---------------------------------------------------------------------------

program.parse();
