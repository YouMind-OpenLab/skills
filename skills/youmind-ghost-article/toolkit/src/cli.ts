#!/usr/bin/env node

/**
 * YouMind Ghost Article CLI
 *
 * Commands:
 *   publish <input>  Publish a Markdown file to Ghost
 *   preview <input>  Convert Markdown and preview HTML locally
 *   validate         Check Ghost credentials and API connectivity
 *   list             List recent posts
 */

import { Command } from 'commander';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { publish } from './publisher.js';
import { convertToHtml } from './content-adapter.js';
import {
  loadGhostConfig,
  validateConnection,
  listPosts,
} from './ghost-api.js';

const program = new Command();

program
  .name('youmind-ghost')
  .description('YouMind Ghost Article — AI-powered article publishing')
  .version('1.0.0');

// ---------------------------------------------------------------------------
// publish
// ---------------------------------------------------------------------------

program
  .command('publish <input>')
  .description('Publish a Markdown file to Ghost')
  .option('--draft', 'Publish as draft (default)')
  .option('--publish', 'Publish immediately')
  .option('--scheduled', 'Set status to scheduled')
  .option('--tags <names>', 'Comma-separated tag names (first is primary)')
  .option('--feature-image <file>', 'Path to feature image file')
  .option('--feature-image-url <url>', 'URL for feature image')
  .option('--title <title>', 'Override post title')
  .action(async (input: string, opts: Record<string, string | boolean | undefined>) => {
    try {
      // Determine status
      let status: 'published' | 'draft' | 'scheduled' = 'draft';
      if (opts.publish) status = 'published';
      else if (opts.scheduled) status = 'scheduled';

      const tags = typeof opts.tags === 'string'
        ? opts.tags.split(',').map(t => t.trim()).filter(Boolean)
        : undefined;

      console.log(`Publishing ${input} as ${status}...`);

      const result = await publish({
        input: resolve(input),
        isFile: true,
        status,
        tags,
        featureImage: typeof opts.featureImage === 'string' ? opts.featureImage : undefined,
        featureImageUrl: typeof opts.featureImageUrl === 'string' ? opts.featureImageUrl : undefined,
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
      max-width: 740px;
      margin: 40px auto;
      padding: 0 20px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans",
                   Ubuntu, "Droid Sans", "Helvetica Neue", sans-serif;
      font-size: 1.8rem;
      line-height: 1.7;
      color: #15171a;
      background: #fff;
    }
    h1 { font-size: 3.2rem; line-height: 1.2; margin-bottom: 0.5em; }
    h2 { font-size: 2.4rem; margin-top: 1.5em; }
    h3 { font-size: 2rem; margin-top: 1.2em; }
    code {
      background: #f0f0f0;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 0.9em;
    }
    pre {
      background: #f0f0f0;
      padding: 20px;
      border-radius: 5px;
      overflow-x: auto;
    }
    pre code { background: none; padding: 0; }
    blockquote {
      border-left: 3px solid #15171a;
      margin: 1.5em 0;
      padding: 0 1.5em;
      color: #5d7179;
      font-style: italic;
    }
    img { max-width: 100%; height: auto; }
    a { color: #15171a; text-decoration: underline; }
    .excerpt {
      color: #5d7179;
      font-size: 2rem;
      line-height: 1.5;
      border-bottom: 1px solid #e5eff5;
      padding-bottom: 1em;
      margin-bottom: 2em;
    }
    /* Ghost-like styling */
    figure { margin: 2em 0; }
    figcaption { font-size: 1.4rem; color: #5d7179; text-align: center; margin-top: 0.5em; }
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
  .description('Check YouMind API key and Ghost connectivity via YouMind proxy')
  .action(async () => {
    const config = loadGhostConfig();

    if (!config.apiKey) {
      console.error('[ERROR] youmind.api_key not set in config.yaml');
      process.exit(1);
    }

    console.log('[INFO] Validating Ghost credentials via YouMind proxy...');
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
  .description('List recent Ghost posts')
  .option('--page <n>', 'Page number', '1')
  .option('--limit <n>', 'Posts per page', '15')
  .action(async (opts: { page: string; limit: string }) => {
    try {
      const config = loadGhostConfig();
      const page = parseInt(opts.page, 10);
      const limit = parseInt(opts.limit, 10);

      const { posts, total } = await listPosts(config, page, limit);

      if (!posts.length) {
        console.log('No posts found.');
        return;
      }

      console.log(`Posts (page ${page}, total: ${total}):\n`);
      for (const post of posts) {
        const title = post.title || '(no title)';
        const date = post.published_at?.split('T')[0] || post.created_at?.split('T')[0] || '';
        const primaryTag = post.primary_tag?.name || '';
        const tagStr = primaryTag ? ` [${primaryTag}]` : '';
        console.log(`  ${post.id.slice(0, 8)}  ${date} | ${post.status.padEnd(9)} | ${title}${tagStr}`);
        console.log(`          ${post.url}`);
      }
    } catch (e) {
      console.error(`List failed: ${(e as Error).message}`);
      process.exit(1);
    }
  });

// ---------------------------------------------------------------------------
// Parse & run
// ---------------------------------------------------------------------------

program.parse();
