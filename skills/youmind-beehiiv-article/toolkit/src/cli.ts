#!/usr/bin/env node

import { Command } from 'commander';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { convertToHtml } from './content-adapter.js';
import { publish } from './publisher.js';
import {
  deletePost,
  getPost,
  listPosts,
  loadBeehiivConfig,
  type BeehiivPost,
  validateConnection,
} from './beehiiv-api.js';

const program = new Command();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SKILL_ROOT_DIR = resolve(__dirname, '../..');
const OUTPUT_DIR = resolve(SKILL_ROOT_DIR, 'output');

function parseTags(value?: string): string[] | undefined {
  if (!value) return undefined;
  const tags = value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
  return tags.length ? tags : undefined;
}

function getDefaultPreviewOutput(inputPath: string): string {
  const filename = basename(inputPath).replace(/\.md$/i, '') || 'article';
  mkdirSync(OUTPUT_DIR, { recursive: true });
  return resolve(OUTPUT_DIR, `${filename}.beehiiv.preview.html`);
}

function printPost(post: BeehiivPost): void {
  console.log(`  Post ID:     ${post.id}`);
  console.log(`  Status:      ${post.status}`);
  console.log(`  Title:       ${post.title}`);
  if (post.subtitle) {
    console.log(`  Subtitle:    ${post.subtitle}`);
  }
  if (post.webUrl) {
    console.log(`  Web URL:     ${post.webUrl}`);
  }
  if (post.contentTags?.length) {
    console.log(`  Tags:        ${post.contentTags.join(', ')}`);
  }
}

program
  .name('youmind-beehiiv')
  .description('YouMind Beehiiv Article toolkit')
  .version('1.0.0');

program
  .command('publish <input>')
  .description('Publish a Markdown file to Beehiiv')
  .option('--draft', 'Create a draft post (default)')
  .option('--confirm', 'Create a confirmed post immediately')
  .option('--schedule-at <iso>', 'Schedule publish time in ISO 8601 format')
  .option('--tags <names>', 'Comma-separated content tags')
  .option('--thumbnail-url <url>', 'Thumbnail image URL')
  .option('--title <title>', 'Override post title')
  .option('--subtitle <subtitle>', 'Override post subtitle')
  .action(async (input: string, opts: Record<string, string | boolean | undefined>) => {
    try {
      const result = await publish({
        input: resolve(input),
        isFile: true,
        status: opts.confirm ? 'confirmed' : 'draft',
        scheduledAt: typeof opts.scheduleAt === 'string' ? opts.scheduleAt : undefined,
        contentTags: parseTags(typeof opts.tags === 'string' ? opts.tags : undefined),
        thumbnailImageUrl:
          typeof opts.thumbnailUrl === 'string' ? opts.thumbnailUrl : undefined,
        title: typeof opts.title === 'string' ? opts.title : undefined,
        subtitle: typeof opts.subtitle === 'string' ? opts.subtitle : undefined,
      });

      console.log('\nPublished successfully!');
      console.log(`  Post ID:     ${result.id}`);
      console.log(`  Status:      ${result.status}`);
      console.log(`  Title:       ${result.title}`);
      if (result.subtitle) {
        console.log(`  Subtitle:    ${result.subtitle}`);
      }
      if (result.webUrl) {
        console.log(`  Web URL:     ${result.webUrl}`);
      }
      console.log(`  Preview:     ${result.previewText}`);
    } catch (error) {
      console.error(`Publish failed: ${(error as Error).message}`);
      process.exit(1);
    }
  });

program
  .command('preview <input>')
  .description('Convert Markdown to Beehiiv-style HTML preview locally')
  .option('-o, --output <file>', 'Output HTML file path')
  .action((input: string, opts: { output?: string }) => {
    try {
      const inputPath = resolve(input);
      if (!existsSync(inputPath)) {
        console.error(`File not found: ${inputPath}`);
        process.exit(1);
      }

      const markdown = readFileSync(inputPath, 'utf-8');
      const { html, title, previewText } = convertToHtml(markdown);
      const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      background: #f7f2ea;
      color: #1b1b18;
      font-family: Georgia, "Times New Roman", serif;
    }
    .shell {
      max-width: 760px;
      margin: 40px auto;
      background: #fffdf8;
      border: 1px solid #e7dcc9;
      box-shadow: 0 20px 60px rgba(43, 37, 28, 0.08);
    }
    .masthead {
      padding: 28px 36px 0;
      font-size: 12px;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: #7a6a54;
    }
    article {
      padding: 16px 36px 48px;
      line-height: 1.8;
      font-size: 18px;
    }
    h1 {
      margin: 0 0 14px;
      font-size: 44px;
      line-height: 1.08;
    }
    .preview-text {
      margin: 0 0 32px;
      color: #675842;
      font-size: 18px;
    }
    h2, h3 { line-height: 1.2; margin-top: 1.8em; }
    pre {
      overflow-x: auto;
      background: #1e1d1a;
      color: #f9f4ea;
      padding: 18px;
      border-radius: 12px;
    }
    code {
      background: #efe6d8;
      padding: 2px 6px;
      border-radius: 6px;
      font-size: 0.92em;
    }
    pre code {
      background: transparent;
      padding: 0;
    }
    blockquote {
      margin: 28px 0;
      padding-left: 18px;
      border-left: 3px solid #d9b36c;
      color: #6c5b40;
    }
    img {
      max-width: 100%;
      height: auto;
      border-radius: 16px;
    }
    a { color: #885d16; }
  </style>
</head>
<body>
  <div class="shell">
    <div class="masthead">Beehiiv Preview</div>
    <article>
      <h1>${title}</h1>
      <p class="preview-text">${previewText}</p>
      ${html}
    </article>
  </div>
</body>
</html>`;

      const outputPath = opts.output ? resolve(opts.output) : getDefaultPreviewOutput(inputPath);
      writeFileSync(outputPath, fullHtml, 'utf-8');
      console.log(`Preview generated: ${outputPath}`);
    } catch (error) {
      console.error(`Preview failed: ${(error as Error).message}`);
      process.exit(1);
    }
  });

program
  .command('validate')
  .description('Check YouMind API key and Beehiiv connectivity via YouMind proxy')
  .action(async () => {
    try {
      const config = loadBeehiivConfig();
      if (!config.apiKey) {
        throw new Error('YouMind API key not set. Configure ~/.youmind/config.yaml.');
      }

      const result = await validateConnection(config);
      if (!result.ok) {
        throw new Error(result.message);
      }

      console.log(`OK: ${result.message}`);
      if (result.workspaceName) {
        console.log(`Workspace:   ${result.workspaceName}`);
      }
      if (result.publicationName) {
        console.log(`Publication: ${result.publicationName}`);
      }
    } catch (error) {
      console.error(`Validate failed: ${(error as Error).message}`);
      process.exit(1);
    }
  });

program
  .command('list')
  .description('List recent Beehiiv posts')
  .option('--page <n>', 'Page number', '1')
  .option('--limit <n>', 'Page size', '10')
  .option('--status <status>', 'Optional status filter')
  .action(async (opts: { page: string; limit: string; status?: string }) => {
    try {
      const response = await listPosts(
        loadBeehiivConfig(),
        Number(opts.page || 1),
        Number(opts.limit || 10),
        opts.status,
      );

      console.log(
        `Found ${response.posts.length} post(s) on page ${response.page}/${response.totalPages}`,
      );
      for (const post of response.posts) {
        printPost(post);
        console.log('');
      }
    } catch (error) {
      console.error(`List failed: ${(error as Error).message}`);
      process.exit(1);
    }
  });

program
  .command('get <id>')
  .description('Fetch a single Beehiiv post by ID')
  .action(async (id: string) => {
    try {
      printPost(await getPost(loadBeehiivConfig(), id));
    } catch (error) {
      console.error(`Get failed: ${(error as Error).message}`);
      process.exit(1);
    }
  });

program
  .command('delete <id>')
  .description('Delete or archive a Beehiiv post by ID')
  .action(async (id: string) => {
    try {
      const result = await deletePost(loadBeehiivConfig(), id);
      console.log(`Deleted: ${result.id} (ok=${result.ok})`);
    } catch (error) {
      console.error(`Delete failed: ${(error as Error).message}`);
      process.exit(1);
    }
  });

program.parseAsync().catch((error) => {
  console.error((error as Error).message);
  process.exit(1);
});
