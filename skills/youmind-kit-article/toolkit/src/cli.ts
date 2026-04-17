#!/usr/bin/env node

import { Command } from 'commander';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { convertToHtml } from './content-adapter.js';
import { publish } from './publisher.js';
import {
  deleteBroadcast,
  getBroadcast,
  listEmailTemplates,
  listBroadcasts,
  loadKitConfig,
  type KitBroadcast,
  type KitEmailTemplate,
  validateConnection,
} from './kit-api.js';

const program = new Command();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SKILL_ROOT_DIR = resolve(__dirname, '../..');
const OUTPUT_DIR = resolve(SKILL_ROOT_DIR, 'output');
const KIT_CAMPAIGNS_URL = 'https://app.kit.com/campaigns';

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
  return resolve(OUTPUT_DIR, `${filename}.kit.preview.html`);
}

function printBroadcast(broadcast: KitBroadcast): void {
  console.log(`  Broadcast ID: ${broadcast.id}`);
  console.log(`  Subject:      ${broadcast.subject || '(untitled)'}`);
  console.log(`  Public:       ${broadcast.isPublic ? 'yes' : 'no'}`);
  if (!broadcast.publicUrl) {
    console.log(`  Dashboard:    ${KIT_CAMPAIGNS_URL}`);
  }
  if (broadcast.publicUrl) {
    console.log(`  Public URL:   ${broadcast.publicUrl}`);
  }
  if (broadcast.publishedAt) {
    console.log(`  Published At: ${broadcast.publishedAt}`);
  }
  if (broadcast.sendAt) {
    console.log(`  Send At:      ${broadcast.sendAt}`);
  }
}

function printEmailTemplate(template: KitEmailTemplate): void {
  console.log(`  Template ID: ${template.id}`);
  console.log(`  Name:        ${template.name}`);
  if (template.category) {
    console.log(`  Category:    ${template.category}`);
  }
  if (template.isDefault !== undefined) {
    console.log(`  Default:     ${template.isDefault ? 'yes' : 'no'}`);
  }
}

program
  .name('youmind-kit')
  .description('YouMind Kit Article toolkit')
  .version('1.0.0');

program
  .command('publish <input>')
  .description('Publish a Markdown file to Kit')
  .option('--subject <subject>', 'Override broadcast subject')
  .option('--description <text>', 'Internal description')
  .option('--preview-text <text>', 'Preview text')
  .option('--public', 'Publish to the public web feed (default)')
  .option('--private', 'Keep the broadcast off the public web feed')
  .option('--published-at <iso>', 'Override public published timestamp')
  .option('--send-at <iso>', 'Schedule email send time')
  .option('--thumbnail-url <url>', 'Thumbnail image URL')
  .option('--thumbnail-alt <text>', 'Thumbnail alt text')
  .option('--email-template-id <n>', 'Email template ID')
  .option('--email-address <email>', 'Sender email address')
  .option('--subscriber-filter-json <json-or-file>', 'Subscriber filter JSON or @file')
  .action(async (input: string, opts: Record<string, string | boolean | undefined>) => {
    try {
      const result = await publish({
        input: resolve(input),
        isFile: true,
        subject: typeof opts.subject === 'string' ? opts.subject : undefined,
        description: typeof opts.description === 'string' ? opts.description : undefined,
        previewText: typeof opts.previewText === 'string' ? opts.previewText : undefined,
        isPublic: opts.private ? false : opts.public ? true : undefined,
        publishedAt: typeof opts.publishedAt === 'string' ? opts.publishedAt : undefined,
        sendAt: typeof opts.sendAt === 'string' ? opts.sendAt : undefined,
        thumbnailUrl:
          typeof opts.thumbnailUrl === 'string' ? opts.thumbnailUrl : undefined,
        thumbnailAlt:
          typeof opts.thumbnailAlt === 'string' ? opts.thumbnailAlt : undefined,
        emailTemplateId:
          typeof opts.emailTemplateId === 'string'
            ? Number(opts.emailTemplateId)
            : undefined,
        emailAddress:
          typeof opts.emailAddress === 'string' ? opts.emailAddress : undefined,
        subscriberFilter: parseJsonOption<Record<string, unknown>[]>(
          typeof opts.subscriberFilterJson === 'string' ? opts.subscriberFilterJson : undefined,
        ),
      });

      console.log('\nPublished successfully!');
      console.log(`  Broadcast ID: ${result.id}`);
      console.log(`  Subject:      ${result.subject}`);
      console.log(`  Public:       ${result.isPublic ? 'yes' : 'no'}`);
      if (result.publicUrl) {
        console.log(`  Public URL:   ${result.publicUrl}`);
      }
      if (result.dashboardUrl) {
        console.log(`  Dashboard:    ${result.dashboardUrl}`);
      }
      console.log(`  Result URL:   ${result.resultUrl}`);
      if (result.message) {
        console.log(`  Note:         ${result.message}`);
      }
      if (result.publishedAt) {
        console.log(`  Published At: ${result.publishedAt}`);
      }
      if (result.sendAt) {
        console.log(`  Send At:      ${result.sendAt}`);
      }
      console.log(`  Preview:      ${result.previewText}`);
    } catch (error) {
      console.error(`Publish failed: ${(error as Error).message}`);
      process.exit(1);
    }
  });

program
  .command('preview <input>')
  .description('Convert Markdown to Kit-style HTML preview locally')
  .option('-o, --output <file>', 'Output HTML file path')
  .action((input: string, opts: { output?: string }) => {
    try {
      const inputPath = resolve(input);
      if (!existsSync(inputPath)) {
        console.error(`File not found: ${inputPath}`);
        process.exit(1);
      }

      const markdown = readFileSync(inputPath, 'utf-8');
      const { html, subject, previewText } = convertToHtml(markdown);
      const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body {
      margin: 0;
      background: #f3f5f7;
      color: #122230;
      font-family: "Helvetica Neue", Arial, sans-serif;
    }
    .shell {
      max-width: 720px;
      margin: 32px auto;
      background: #ffffff;
      border-radius: 22px;
      box-shadow: 0 18px 50px rgba(14, 32, 48, 0.08);
      overflow: hidden;
    }
    .header {
      padding: 24px 32px;
      background: linear-gradient(135deg, #17344d, #4c8daa);
      color: white;
      font-size: 12px;
      letter-spacing: 0.16em;
      text-transform: uppercase;
    }
    article {
      padding: 32px;
      line-height: 1.8;
      font-size: 17px;
    }
    h1 {
      margin: 0 0 12px;
      font-size: 40px;
      line-height: 1.1;
    }
    .preview-text {
      margin: 0 0 28px;
      color: #537086;
      font-size: 17px;
    }
    h2, h3 { line-height: 1.25; margin-top: 1.8em; }
    pre {
      overflow-x: auto;
      background: #10212d;
      color: #eff7ff;
      padding: 18px;
      border-radius: 14px;
    }
    code {
      background: #e9f0f5;
      padding: 2px 6px;
      border-radius: 6px;
      font-size: 0.92em;
    }
    pre code {
      background: transparent;
      padding: 0;
    }
    blockquote {
      margin: 24px 0;
      padding-left: 18px;
      border-left: 3px solid #72b3d2;
      color: #4b6678;
    }
    img {
      max-width: 100%;
      height: auto;
      border-radius: 14px;
    }
    a { color: #0e6ba8; }
  </style>
</head>
<body>
  <div class="shell">
    <div class="header">Kit Preview</div>
    <article>
      <h1>${subject}</h1>
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
  .description('Check YouMind API key and Kit connectivity via YouMind proxy')
  .action(async () => {
    try {
      const config = loadKitConfig();
      if (!config.apiKey) {
        throw new Error('YouMind API key not set. Configure ~/.youmind/config.yaml.');
      }

      const result = await validateConnection(config);
      if (!result.ok) {
        throw new Error(result.message);
      }

      console.log(`OK: ${result.message}`);
      if (result.accountName) {
        console.log(`Account:      ${result.accountName}`);
      }
      if (result.creatorProfileUrl) {
        console.log(`Profile URL:  ${result.creatorProfileUrl}`);
      }
    } catch (error) {
      console.error(`Validate failed: ${(error as Error).message}`);
      process.exit(1);
    }
  });

program
  .command('templates')
  .description('List available Kit email templates')
  .option('--after <cursor>', 'Cursor for next page')
  .option('--before <cursor>', 'Cursor for previous page')
  .option('--per-page <n>', 'Page size', '100')
  .option('--include-total-count', 'Request total count')
  .action(
    async (opts: {
      after?: string;
      before?: string;
      perPage: string;
      includeTotalCount?: boolean;
    }) => {
      try {
        const response = await listEmailTemplates(loadKitConfig(), {
          after: opts.after,
          before: opts.before,
          perPage: Number(opts.perPage || 100),
          includeTotalCount: Boolean(opts.includeTotalCount),
        });

        console.log(`Found ${response.emailTemplates.length} template(s)`);
        for (const template of response.emailTemplates) {
          printEmailTemplate(template);
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
  .description('List recent Kit broadcasts')
  .option('--after <cursor>', 'Cursor for next page')
  .option('--before <cursor>', 'Cursor for previous page')
  .option('--per-page <n>', 'Page size', '20')
  .option('--include-total-count', 'Request total count')
  .action(
    async (opts: {
      after?: string;
      before?: string;
      perPage: string;
      includeTotalCount?: boolean;
    }) => {
      try {
        const response = await listBroadcasts(loadKitConfig(), {
          after: opts.after,
          before: opts.before,
          perPage: Number(opts.perPage || 20),
          includeTotalCount: Boolean(opts.includeTotalCount),
        });

        console.log(`Found ${response.broadcasts.length} broadcast(s)`);
        for (const broadcast of response.broadcasts) {
          printBroadcast(broadcast);
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
  .description('Fetch a single Kit broadcast by ID')
  .action(async (id: string) => {
    try {
      printBroadcast(await getBroadcast(loadKitConfig(), Number(id)));
    } catch (error) {
      console.error(`Get failed: ${(error as Error).message}`);
      process.exit(1);
    }
  });

program
  .command('delete <id>')
  .description('Delete a Kit broadcast by ID')
  .action(async (id: string) => {
    try {
      const result = await deleteBroadcast(loadKitConfig(), Number(id));
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
