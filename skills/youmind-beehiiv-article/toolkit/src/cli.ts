#!/usr/bin/env node

import { Command } from 'commander';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { convertToHtml, adaptForBeehiiv } from './content-adapter.js';
import { publish } from './publisher.js';
import {
  deletePost,
  getPost,
  listPostTemplates,
  listPosts,
  loadBeehiivConfig,
  type BeehiivPost,
  type BeehiivPostEmailSettings,
  type BeehiivPostRecipients,
  type BeehiivPostSeoSettings,
  type BeehiivPostTemplate,
  type BeehiivPostWebSettings,
  updatePost,
  validateConnection,
} from './beehiiv-api.js';

const program = new Command();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SKILL_ROOT_DIR = resolve(__dirname, '../..');
const OUTPUT_DIR = resolve(SKILL_ROOT_DIR, 'output');

function parseCsv(value?: string): string[] | undefined {
  if (!value) return undefined;
  const items = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length ? items : undefined;
}

function parseJsonOption<T>(value?: string): T | undefined {
  if (!value) {
    return undefined;
  }

  const raw =
    value.startsWith('@') && existsSync(resolve(value.slice(1)))
      ? readFileSync(resolve(value.slice(1)), 'utf-8')
      : existsSync(resolve(value))
        ? readFileSync(resolve(value), 'utf-8')
        : value;

  return JSON.parse(raw) as T;
}

function getDefaultPreviewOutput(inputPath: string): string {
  const filename = basename(inputPath).replace(/\.md$/i, '') || 'article';
  mkdirSync(OUTPUT_DIR, { recursive: true });
  return resolve(OUTPUT_DIR, `${filename}.beehiiv.preview.html`);
}

function printPost(post: BeehiivPost): void {
  console.log(`  Post ID:         ${post.id}`);
  console.log(`  Status:          ${post.status}`);
  console.log(`  Title:           ${post.title}`);
  if (post.subtitle) {
    console.log(`  Subtitle:        ${post.subtitle}`);
  }
  if (post.webUrl) {
    console.log(`  Web URL:         ${post.webUrl}`);
  }
  if (post.slug) {
    console.log(`  Slug:            ${post.slug}`);
  }
  if (post.newsletterListId) {
    console.log(`  Newsletter List: ${post.newsletterListId}`);
  }
  if (post.authors?.length) {
    console.log(`  Authors:         ${post.authors.join(', ')}`);
  }
  if (post.contentTags?.length) {
    console.log(`  Tags:            ${post.contentTags.join(', ')}`);
  }
}

function printTemplate(template: BeehiivPostTemplate): void {
  console.log(`  Template ID: ${template.id}`);
  console.log(`  Name:        ${template.name}`);
}

async function updateFromMarkdown(
  id: string,
  input: string,
  opts: Record<string, string | boolean | undefined>,
): Promise<void> {
  const inputPath = resolve(input);
  const markdown = existsSync(inputPath) ? readFileSync(inputPath, 'utf-8') : input;

  const adapted = await adaptForBeehiiv({
    markdown,
    title: typeof opts.title === 'string' ? opts.title : undefined,
    subtitle: typeof opts.subtitle === 'string' ? opts.subtitle : undefined,
    contentTags: parseCsv(typeof opts.tags === 'string' ? opts.tags : undefined),
    thumbnailImageUrl: typeof opts.thumbnailUrl === 'string' ? opts.thumbnailUrl : undefined,
    scheduledAt: typeof opts.scheduleAt === 'string' ? opts.scheduleAt : undefined,
    customLinkTrackingEnabled: opts.customLinkTracking ? true : undefined,
    emailCaptureTypeOverride:
      typeof opts.emailCaptureType === 'string'
        ? (opts.emailCaptureType as 'none' | 'gated' | 'popup')
        : undefined,
    overrideScheduledAt:
      typeof opts.overrideScheduledAt === 'string' ? opts.overrideScheduledAt : undefined,
    socialShare:
      typeof opts.socialShare === 'string'
        ? (opts.socialShare as
            | 'comments_and_likes_only'
            | 'with_comments_and_likes'
            | 'top'
            | 'none')
        : undefined,
    emailSettings: parseJsonOption<BeehiivPostEmailSettings>(
      typeof opts.emailSettingsJson === 'string' ? opts.emailSettingsJson : undefined,
    ),
    webSettings: parseJsonOption<BeehiivPostWebSettings>(
      typeof opts.webSettingsJson === 'string' ? opts.webSettingsJson : undefined,
    ),
    seoSettings: parseJsonOption<BeehiivPostSeoSettings>(
      typeof opts.seoSettingsJson === 'string' ? opts.seoSettingsJson : undefined,
    ),
  });

  const post = await updatePost(loadBeehiivConfig(), id, {
    title: adapted.title,
    bodyContent: adapted.html,
    subtitle: adapted.subtitle,
    scheduledAt: adapted.scheduledAt,
    customLinkTrackingEnabled: adapted.customLinkTrackingEnabled,
    emailCaptureTypeOverride: adapted.emailCaptureTypeOverride,
    overrideScheduledAt: adapted.overrideScheduledAt,
    socialShare: adapted.socialShare,
    contentTags: adapted.contentTags.length ? adapted.contentTags : undefined,
    thumbnailImageUrl: adapted.thumbnailImageUrl,
    emailSettings: adapted.emailSettings,
    webSettings: adapted.webSettings,
    seoSettings: adapted.seoSettings,
  });

  console.log('\nUpdated successfully!');
  printPost(post);
  console.log('  Note:            Beehiiv 官方文档目前将 update post 标为 beta/Enterprise。');
}

program
  .name('youmind-beehiiv')
  .description('YouMind Beehiiv Article toolkit')
  .version('1.1.0');

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
  .option('--post-template-id <id>', 'Beehiiv post template ID')
  .option('--custom-link-tracking', 'Enable custom link tracking')
  .option('--email-capture-type <type>', 'Email capture override: none, gated, popup')
  .option('--override-scheduled-at <iso>', 'Display date override shown in the email')
  .option(
    '--social-share <mode>',
    'Social share mode: comments_and_likes_only, with_comments_and_likes, top, none',
  )
  .option('--recipients-json <json-or-file>', 'Recipients JSON or @file')
  .option('--email-settings-json <json-or-file>', 'Email settings JSON or @file')
  .option('--web-settings-json <json-or-file>', 'Web settings JSON or @file')
  .option('--seo-settings-json <json-or-file>', 'SEO settings JSON or @file')
  .option('--headers-json <json-or-file>', 'Headers JSON or @file')
  .option('--custom-fields-json <json-or-file>', 'Custom fields JSON or @file')
  .option('--newsletter-list-id <id>', 'Newsletter list ID')
  .action(async (input: string, opts: Record<string, string | boolean | undefined>) => {
    try {
      const result = await publish({
        input: resolve(input),
        isFile: true,
        status: opts.confirm ? 'confirmed' : opts.draft ? 'draft' : undefined,
        scheduledAt: typeof opts.scheduleAt === 'string' ? opts.scheduleAt : undefined,
        contentTags: parseCsv(typeof opts.tags === 'string' ? opts.tags : undefined),
        thumbnailImageUrl:
          typeof opts.thumbnailUrl === 'string' ? opts.thumbnailUrl : undefined,
        title: typeof opts.title === 'string' ? opts.title : undefined,
        subtitle: typeof opts.subtitle === 'string' ? opts.subtitle : undefined,
        postTemplateId:
          typeof opts.postTemplateId === 'string' ? opts.postTemplateId : undefined,
        customLinkTrackingEnabled: opts.customLinkTracking ? true : undefined,
        emailCaptureTypeOverride:
          typeof opts.emailCaptureType === 'string'
            ? (opts.emailCaptureType as 'none' | 'gated' | 'popup')
            : undefined,
        overrideScheduledAt:
          typeof opts.overrideScheduledAt === 'string' ? opts.overrideScheduledAt : undefined,
        socialShare:
          typeof opts.socialShare === 'string'
            ? (opts.socialShare as
                | 'comments_and_likes_only'
                | 'with_comments_and_likes'
                | 'top'
                | 'none')
            : undefined,
        recipients: parseJsonOption<BeehiivPostRecipients>(
          typeof opts.recipientsJson === 'string' ? opts.recipientsJson : undefined,
        ),
        emailSettings: parseJsonOption<BeehiivPostEmailSettings>(
          typeof opts.emailSettingsJson === 'string' ? opts.emailSettingsJson : undefined,
        ),
        webSettings: parseJsonOption<BeehiivPostWebSettings>(
          typeof opts.webSettingsJson === 'string' ? opts.webSettingsJson : undefined,
        ),
        seoSettings: parseJsonOption<BeehiivPostSeoSettings>(
          typeof opts.seoSettingsJson === 'string' ? opts.seoSettingsJson : undefined,
        ),
        headers: parseJsonOption<Record<string, string>>(
          typeof opts.headersJson === 'string' ? opts.headersJson : undefined,
        ),
        customFields: parseJsonOption<Record<string, string>>(
          typeof opts.customFieldsJson === 'string' ? opts.customFieldsJson : undefined,
        ),
        newsletterListId:
          typeof opts.newsletterListId === 'string' ? opts.newsletterListId : undefined,
      });

      console.log('\nPublished successfully!');
      console.log(`  Post ID:         ${result.id}`);
      console.log(`  Status:          ${result.status}`);
      console.log(`  Title:           ${result.title}`);
      if (result.subtitle) {
        console.log(`  Subtitle:        ${result.subtitle}`);
      }
      if (result.webUrl) {
        console.log(`  Web URL:         ${result.webUrl}`);
      }
      console.log(`  Preview:         ${result.previewText}`);
    } catch (error) {
      console.error(`Publish failed: ${(error as Error).message}`);
      process.exit(1);
    }
  });

program
  .command('update <id> <input>')
  .description('Update an existing Beehiiv post from Markdown (Beehiiv marks this API beta/Enterprise)')
  .option('--schedule-at <iso>', 'Schedule publish time in ISO 8601 format')
  .option('--tags <names>', 'Comma-separated content tags')
  .option('--thumbnail-url <url>', 'Thumbnail image URL')
  .option('--title <title>', 'Override post title')
  .option('--subtitle <subtitle>', 'Override post subtitle')
  .option('--custom-link-tracking', 'Enable custom link tracking')
  .option('--email-capture-type <type>', 'Email capture override: none, gated, popup')
  .option('--override-scheduled-at <iso>', 'Display date override shown in the email')
  .option(
    '--social-share <mode>',
    'Social share mode: comments_and_likes_only, with_comments_and_likes, top, none',
  )
  .option('--email-settings-json <json-or-file>', 'Email settings JSON or @file')
  .option('--web-settings-json <json-or-file>', 'Web settings JSON or @file')
  .option('--seo-settings-json <json-or-file>', 'SEO settings JSON or @file')
  .action(async (id: string, input: string, opts: Record<string, string | boolean | undefined>) => {
    try {
      await updateFromMarkdown(id, input, opts);
    } catch (error) {
      console.error(`Update failed: ${(error as Error).message}`);
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
  .command('templates')
  .description('List Beehiiv post templates available to the connected publication')
  .option('--page <n>', 'Page number', '1')
  .option('--limit <n>', 'Page size', '10')
  .option('--order <direction>', 'Order direction: asc, desc')
  .option('--order-by <field>', 'Order field')
  .action(
    async (opts: {
      page: string;
      limit: string;
      order?: string;
      orderBy?: string;
    }) => {
      try {
        const response = await listPostTemplates(loadBeehiivConfig(), {
          page: Number(opts.page || 1),
          limit: Number(opts.limit || 10),
          order: opts.order as 'asc' | 'desc' | undefined,
          orderBy: opts.orderBy,
        });

        console.log(
          `Found ${response.templates.length} template(s) on page ${response.page}/${response.totalPages}`,
        );
        for (const template of response.templates) {
          printTemplate(template);
          console.log('');
        }
      } catch (error) {
        console.error(`Templates failed: ${(error as Error).message}`);
        process.exit(1);
      }
    },
  );

program
  .command('list')
  .description('List recent Beehiiv posts')
  .option('--page <n>', 'Page number', '1')
  .option('--limit <n>', 'Page size', '10')
  .option('--status <status>', 'Optional status filter')
  .option('--audience <audience>', 'Audience filter: free, premium, all')
  .option('--platform <platform>', 'Platform filter: web, email, both, all')
  .option('--tags <names>', 'Comma-separated content tags')
  .option('--slugs <slugs>', 'Comma-separated slugs')
  .option('--authors <names>', 'Comma-separated author names')
  .option('--premium-tiers <names>', 'Comma-separated premium tier names')
  .option('--expand <flags>', 'Comma-separated expand flags')
  .option('--order-by <field>', 'Sort field: created, publish_date, displayed_date')
  .option('--direction <direction>', 'Sort direction: asc, desc')
  .option('--hidden-from-feed <value>', 'all, true, false')
  .action(
    async (opts: {
      page: string;
      limit: string;
      status?: string;
      audience?: string;
      platform?: string;
      tags?: string;
      slugs?: string;
      authors?: string;
      premiumTiers?: string;
      expand?: string;
      orderBy?: string;
      direction?: string;
      hiddenFromFeed?: string;
    }) => {
      try {
        const response = await listPosts(loadBeehiivConfig(), {
          page: Number(opts.page || 1),
          limit: Number(opts.limit || 10),
          status: opts.status as 'draft' | 'confirmed' | 'archived' | 'all' | undefined,
          audience: opts.audience as 'free' | 'premium' | 'all' | undefined,
          platform: opts.platform as 'web' | 'email' | 'both' | 'all' | undefined,
          contentTags: parseCsv(opts.tags),
          slugs: parseCsv(opts.slugs),
          authors: parseCsv(opts.authors),
          premiumTiers: parseCsv(opts.premiumTiers),
          expand: parseCsv(opts.expand),
          orderBy: opts.orderBy as
            | 'created'
            | 'publish_date'
            | 'displayed_date'
            | 'publishDate'
            | 'displayedDate'
            | undefined,
          direction: opts.direction as 'asc' | 'desc' | undefined,
          hiddenFromFeed: opts.hiddenFromFeed as 'all' | 'true' | 'false' | undefined,
        });

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
    },
  );

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
