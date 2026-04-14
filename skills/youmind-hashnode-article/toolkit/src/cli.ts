#!/usr/bin/env node

import { Command } from 'commander';
import { basename, dirname, resolve } from 'node:path';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { adaptForHashnode } from './content-adapter.js';
import {
  getDraft,
  getPost,
  listDrafts,
  listPosts,
  listPublishedPosts,
  loadHashnodeConfig,
  publishDraft,
  searchTags,
  type HashnodePost,
  validateConnection,
} from './hashnode-api.js';
import { publish } from './publisher.js';

const program = new Command();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SKILL_ROOT_DIR = resolve(__dirname, '../..');
const OUTPUT_DIR = resolve(SKILL_ROOT_DIR, 'output');

function parseFrontMatter(raw: string): { data: Record<string, unknown>; content: string } {
  const fmRegex = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/;
  const match = raw.match(fmRegex);
  if (!match) {
    return { data: {}, content: raw };
  }

  const data: Record<string, unknown> = {};
  for (const line of match[1].split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim();
      let value: unknown = line.slice(colonIdx + 1).trim();
      if (typeof value === 'string' && value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      if (value === 'true') value = true;
      if (value === 'false') value = false;
      data[key] = value;
    }
  }

  return { data, content: match[2] };
}

function getDefaultPreviewOutput(inputPath: string): string {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  const filename = basename(inputPath).replace(/\.md$/i, '') || 'article';
  return resolve(OUTPUT_DIR, `${filename}.hashnode.md`);
}

function printPost(post: HashnodePost): void {
  console.log(`  ID:      ${post.id}`);
  console.log(`  Status:  ${post.status}`);
  console.log(`  Title:   ${post.title || '(untitled)'}`);
  console.log(`  Slug:    ${post.slug}`);
  if (post.status === 'draft') {
    console.log(`  Dashboard: ${post.dashboardUrl || '(unavailable)'}`);
    if (post.url) {
      console.log(`  Public URL: ${post.url}`);
    }
  } else {
    console.log(`  URL:     ${post.url || '(unavailable)'}`);
    if (post.dashboardUrl) {
      console.log(`  Dashboard: ${post.dashboardUrl}`);
    }
  }
}

program
  .name('youmind-hashnode')
  .description('YouMind Hashnode: AI-powered article writing and publishing')
  .version('1.0.0');

program
  .command('publish <input>')
  .description('Publish a Markdown file to Hashnode via YouMind OpenAPI')
  .option('--draft', 'Create a draft (default)')
  .option('--publish', 'Publish immediately')
  .option('--tags <tags>', 'Comma-separated tags (max 5)')
  .option('--subtitle <text>', 'Article subtitle / hook')
  .option('--cover <url>', 'Cover image URL')
  .option('--series-id <id>', 'Series ID to add the post to')
  .option('--canonical <url>', 'Canonical URL for cross-posting')
  .option('--meta-description <text>', 'SEO meta description (max 160 chars)')
  .option('--slug <slug>', 'Custom slug')
  .option('--title <title>', 'Override article title')
  .action(async (input: string, opts: Record<string, string | boolean | undefined>) => {
    try {
      const config = loadHashnodeConfig();
      if (!config.apiKey) {
        console.error('[ERROR] YouMind API key not set. Configure youmind.api_key in config.yaml.');
        process.exit(1);
      }

      const filePath = resolve(input);
      if (!existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        process.exit(1);
      }

      const raw = readFileSync(filePath, 'utf-8');
      const { data: fm, content } = parseFrontMatter(raw);
      const title =
        (typeof opts.title === 'string' ? opts.title : undefined) ||
        (fm.title as string | undefined) ||
        basename(input, '.md');
      const subtitle =
        (typeof opts.subtitle === 'string' ? opts.subtitle : undefined) ||
        (fm.subtitle as string | undefined) ||
        '';
      const tags =
        typeof opts.tags === 'string'
          ? opts.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
          : typeof fm.tags === 'string'
            ? fm.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
            : [];
      const coverImageUrl =
        (typeof opts.cover === 'string' ? opts.cover : undefined) ||
        (fm.cover_image as string | undefined);
      const canonicalUrl =
        (typeof opts.canonical === 'string' ? opts.canonical : undefined) ||
        (fm.canonical_url as string | undefined);
      const seriesId =
        (typeof opts.seriesId === 'string' ? opts.seriesId : undefined) ||
        (fm.series_id as string | undefined);
      const metaDescription =
        (typeof opts.metaDescription === 'string' ? opts.metaDescription : undefined) ||
        (fm.description as string | undefined) ||
        '';
      const slug =
        (typeof opts.slug === 'string' ? opts.slug : undefined) ||
        (fm.slug as string | undefined);
      const status: 'draft' | 'published' = opts.publish ? 'published' : 'draft';

      const adapted = adaptForHashnode({
        markdown: content,
        title,
        subtitle,
        metaDescription,
        tags,
        coverImageUrl,
        canonicalUrl,
        seriesId,
      });

      if (adapted.warnings.length > 0) {
        console.log('Warnings:');
        for (const warning of adapted.warnings) {
          console.log(`  - ${warning}`);
        }
        console.log('');
      }

      const result = await publish({
        config,
        title: adapted.title,
        markdown: adapted.bodyMarkdown,
        status,
        subtitle: adapted.subtitle,
        tags: adapted.tags,
        coverImageUrl: adapted.coverImageUrl,
        canonicalUrl: adapted.canonicalUrl,
        seriesId: adapted.seriesId,
        slug,
        metaTitle: adapted.title,
        metaDescription: adapted.metaDescription,
      });

      console.log(`Article ${result.status === 'draft' ? 'drafted' : 'published'} successfully!`);
      console.log(`  ID:      ${result.id}`);
      console.log(`  Status:  ${result.status}`);
      console.log(`  Title:   ${result.title || adapted.title}`);
      if (result.status === 'draft') {
        console.log(`  Dashboard: ${result.dashboardUrl || '(unavailable)'}`);
        console.log('  Note: review the draft in Hashnode before publishing it.');
      } else {
        console.log(`  URL:     ${result.url || '(unavailable)'}`);
        if (result.dashboardUrl) {
          console.log(`  Dashboard: ${result.dashboardUrl}`);
        }
      }
      console.log(`  Slug:    ${result.slug}`);
      console.log(`  Read time: ${result.readTimeInMinutes} min`);
    } catch (error) {
      console.error(`Publish failed: ${(error as Error).message}`);
      process.exit(1);
    }
  });

program
  .command('preview <input>')
  .description('Validate and adapt content for Hashnode without publishing')
  .option('--tags <tags>', 'Comma-separated tags (max 5)')
  .option('--subtitle <text>', 'Article subtitle')
  .option('--meta-description <text>', 'SEO meta description')
  .option('--title <title>', 'Override article title')
  .option('-o, --output <path>', 'Output markdown path (default: skill output/ directory)')
  .action((input: string, opts: Record<string, string | undefined>) => {
    try {
      const filePath = resolve(input);
      if (!existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        process.exit(1);
      }

      const raw = readFileSync(filePath, 'utf-8');
      const { data: fm, content } = parseFrontMatter(raw);
      const title =
        opts.title ||
        (fm.title as string | undefined) ||
        basename(input, '.md');
      const subtitle = opts.subtitle || (fm.subtitle as string | undefined) || '';
      const tags =
        opts.tags
          ? opts.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
          : typeof fm.tags === 'string'
            ? fm.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
            : [];
      const metaDescription = opts.metaDescription || (fm.description as string | undefined) || '';
      const coverImageUrl = fm.cover_image as string | undefined;
      const canonicalUrl = fm.canonical_url as string | undefined;
      const seriesId = fm.series_id as string | undefined;

      const adapted = adaptForHashnode({
        markdown: content,
        title,
        subtitle,
        metaDescription,
        tags,
        coverImageUrl,
        canonicalUrl,
        seriesId,
      });

      console.log('=== Hashnode Article Preview ===\n');
      console.log(`Title: ${adapted.title}`);
      console.log(`Subtitle: ${adapted.subtitle}`);
      console.log(`Meta description: ${adapted.metaDescription}`);
      console.log(`Tags: ${adapted.tags.join(', ') || '(none)'}`);
      console.log(`Word count: ~${content.split(/\s+/).filter(Boolean).length}`);
      console.log('');

      if (adapted.warnings.length > 0) {
        console.log('Warnings:');
        for (const warning of adapted.warnings) {
          console.log(`  - ${warning}`);
        }
        console.log('');
      } else {
        console.log('No warnings. Article looks good for Hashnode!\n');
      }

      const outputPath = opts.output ? resolve(opts.output) : getDefaultPreviewOutput(filePath);
      writeFileSync(outputPath, adapted.bodyMarkdown, 'utf-8');
      console.log(`Adapted markdown saved to: ${outputPath}`);
    } catch (error) {
      console.error(`Preview failed: ${(error as Error).message}`);
      process.exit(1);
    }
  });

program
  .command('validate')
  .description('Check YouMind API key and Hashnode connectivity via YouMind OpenAPI')
  .action(async () => {
    try {
      const config = loadHashnodeConfig();
      if (!config.apiKey) {
        console.error('[ERROR] YouMind API key not set. Configure youmind.api_key in config.yaml.');
        process.exit(1);
      }

      console.log('[INFO] Validating Hashnode credentials via YouMind OpenAPI...');
      const result = await validateConnection(config);
      if (!result.ok) {
        console.error(`FAIL: ${result.message}`);
        process.exit(1);
      }

      console.log(`OK: ${result.message}`);
      if (result.dashboardUrl) {
        console.log(`Dashboard: ${result.dashboardUrl}`);
      }
    } catch (error) {
      console.error(`Validate failed: ${(error as Error).message}`);
      process.exit(1);
    }
  });

program
  .command('list')
  .description('List recent published Hashnode posts')
  .option('--page <n>', 'Page number', '1')
  .option('--limit <n>', 'Posts per page', '15')
  .action(async (opts: { page: string; limit: string }) => {
    try {
      const config = loadHashnodeConfig();
      const page = parseInt(opts.page, 10);
      const limit = parseInt(opts.limit, 10);
      const { posts, total } = await listPosts(config, page, limit);

      if (!posts.length) {
        console.log('No posts found.');
        return;
      }

      console.log(`Published posts (page ${page}, total: ${total}):\n`);
      for (const post of posts) {
        const date = post.publishedAt?.split('T')[0] || post.updatedAt?.split('T')[0] || '';
        const primaryTag = post.tags[0]?.name || '';
        console.log(`  ${post.id.slice(0, 8)}  ${date} | ${post.title || '(untitled)'}${primaryTag ? ` [${primaryTag}]` : ''}`);
        console.log(`          ${post.url || post.dashboardUrl || '(unavailable)'}`);
      }
    } catch (error) {
      console.error(`List failed: ${(error as Error).message}`);
      process.exit(1);
    }
  });

program
  .command('list-drafts')
  .description('List Hashnode drafts')
  .option('--page <n>', 'Page number', '1')
  .option('--limit <n>', 'Posts per page', '15')
  .action(async (opts: { page: string; limit: string }) => {
    try {
      const config = loadHashnodeConfig();
      const page = parseInt(opts.page, 10);
      const limit = parseInt(opts.limit, 10);
      const { posts, total } = await listDrafts(config, page, limit);

      if (!posts.length) {
        console.log('No draft posts found.');
        return;
      }

      console.log(`Draft posts (page ${page}, total: ${total}):\n`);
      for (const post of posts) {
        const date = post.updatedAt?.split('T')[0] || '';
        console.log(`  ${post.id.slice(0, 8)}  ${date} | ${post.title || '(untitled)'}`);
        console.log(`          ${post.dashboardUrl || '(unavailable)'}`);
      }
    } catch (error) {
      console.error(`List drafts failed: ${(error as Error).message}`);
      process.exit(1);
    }
  });

program
  .command('list-published')
  .description('List published Hashnode posts')
  .option('--page <n>', 'Page number', '1')
  .option('--limit <n>', 'Posts per page', '15')
  .action(async (opts: { page: string; limit: string }) => {
    try {
      const config = loadHashnodeConfig();
      const page = parseInt(opts.page, 10);
      const limit = parseInt(opts.limit, 10);
      const { posts, total } = await listPublishedPosts(config, page, limit);

      if (!posts.length) {
        console.log('No published posts found.');
        return;
      }

      console.log(`Published posts (page ${page}, total: ${total}):\n`);
      for (const post of posts) {
        const date = post.publishedAt?.split('T')[0] || '';
        console.log(`  ${post.id.slice(0, 8)}  ${date} | ${post.title || '(untitled)'}`);
        console.log(`          ${post.url || '(unavailable)'}`);
      }
    } catch (error) {
      console.error(`List published failed: ${(error as Error).message}`);
      process.exit(1);
    }
  });

program
  .command('publish-draft <id>')
  .description('Publish an existing Hashnode draft by ID')
  .action(async (id: string) => {
    try {
      const config = loadHashnodeConfig();
      const post = await publishDraft(config, id);
      console.log('Draft published successfully!');
      printPost(post);
    } catch (error) {
      console.error(`Publish draft failed: ${(error as Error).message}`);
      process.exit(1);
    }
  });

program
  .command('get-post <id>')
  .description('Fetch a published Hashnode post by ID')
  .action(async (id: string) => {
    try {
      const config = loadHashnodeConfig();
      const post = await getPost(config, id);
      printPost(post);
    } catch (error) {
      console.error(`Get post failed: ${(error as Error).message}`);
      process.exit(1);
    }
  });

program
  .command('get-draft <id>')
  .description('Fetch a Hashnode draft by ID')
  .action(async (id: string) => {
    try {
      const config = loadHashnodeConfig();
      const post = await getDraft(config, id);
      printPost(post);
    } catch (error) {
      console.error(`Get draft failed: ${(error as Error).message}`);
      process.exit(1);
    }
  });

program
  .command('search-tags <query>')
  .description('Look up Hashnode tags by keyword or slug')
  .option('--limit <n>', 'Maximum number of matches to try', '5')
  .action(async (query: string, opts: { limit: string }) => {
    try {
      const config = loadHashnodeConfig();
      const limit = parseInt(opts.limit, 10);
      const tags = await searchTags(config, query, limit);

      if (!tags.length) {
        console.log('No matching tags found. Hashnode tag lookup is exact or slug-like.');
        return;
      }

      console.log(`Matching tags (${tags.length}):\n`);
      for (const tag of tags) {
        console.log(`  ${tag.name} (${tag.slug})`);
        console.log(`    Posts: ${tag.postsCount ?? 0} | Followers: ${tag.followersCount ?? 0}`);
      }
    } catch (error) {
      console.error(`Search tags failed: ${(error as Error).message}`);
      process.exit(1);
    }
  });

program.parse();
