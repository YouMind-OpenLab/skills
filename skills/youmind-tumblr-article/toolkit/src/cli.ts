#!/usr/bin/env node

import { Command } from 'commander';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { renderTumblrRichText } from './content-adapter.js';
import { preview, publish, saveLocalDraft } from './publisher.js';
import {
  createTumblrPhotoPost,
  deleteTumblrPost,
  getTumblrLimits,
  listTumblrFollowers,
  listTumblrNotes,
  listTumblrNotifications,
  listTumblrPosts,
  loadTumblrConfig,
  reorderTumblrQueue,
  shuffleTumblrQueue,
  type TumblrListState,
  type TumblrNotesMode,
  type TumblrPostState,
} from './tumblr-api.js';

function parseFrontMatter(raw: string): { data: Record<string, unknown>; content: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) {
    return { data: {}, content: raw };
  }

  return {
    data: (parseYaml(match[1]) ?? {}) as Record<string, unknown>,
    content: match[2],
  };
}

function parseTags(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string').map((item) => item.trim());
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function parseCsv(value: unknown): string[] {
  if (typeof value !== 'string') {
    return [];
  }
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function pickString(meta: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = meta[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
}

function parseOptionalInt(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.trunc(value);
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return undefined;
}

function ensureInput(opts: {
  file?: string;
  text?: string;
}): { raw: string; defaultTitle?: string; meta: Record<string, unknown> } {
  if (opts.file) {
    const filePath = resolve(opts.file);
    if (!existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    const raw = readFileSync(filePath, 'utf-8');
    const parsed = parseFrontMatter(raw);
    return {
      raw: parsed.content,
      defaultTitle: basename(filePath, '.md'),
      meta: parsed.data,
    };
  }

  if (opts.text?.trim()) {
    return { raw: opts.text.trim(), meta: {} };
  }

  throw new Error('Provide --file <path> or --text <content>.');
}

function readOptionalText(opts: { text?: string; file?: string }): string | undefined {
  if (typeof opts.file === 'string' && opts.file.trim()) {
    const filePath = resolve(opts.file);
    if (!existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    return readFileSync(filePath, 'utf-8').trim();
  }
  if (typeof opts.text === 'string' && opts.text.trim()) {
    return opts.text.trim();
  }
  return undefined;
}

const program = new Command();

program
  .name('youmind-tumblr')
  .description('YouMind Tumblr: AI-powered Tumblr publishing via YouMind OpenAPI')
  .version('1.0.0');

program
  .command('publish')
  .description('Publish a Tumblr text post')
  .option('--file <path>', 'Read content from a Markdown or HTML file')
  .option('--text <text>', 'Use inline text/Markdown/HTML content')
  .option('--title <title>', 'Override post title')
  .option('--tags <tags>', 'Comma-separated Tumblr tags')
  .option('--cover-image <url>', 'Optional cover image URL to prepend')
  .option('--blog <identifier>', 'Optional Tumblr blog identifier override')
  .option('--state <state>', 'Tumblr state: published, draft, queue, private')
  .option('--publish-on <datetime>', 'Schedule time for queued Tumblr posts')
  .option('--date <datetime>', 'Backdate timestamp for Tumblr')
  .option('--slug <slug>', 'Custom Tumblr permalink slug')
  .action(async (opts) => {
    try {
      const config = loadTumblrConfig();
      if (!config.apiKey) {
        console.error('Error: youmind.api_key not set. Configure ~/.youmind/config.yaml.');
        process.exit(1);
      }

      const input = ensureInput(opts);
      const tags = [...parseTags(input.meta.tags), ...parseTags(opts.tags)];
      const title =
        (typeof opts.title === 'string' && opts.title.trim()) ||
        (typeof input.meta.title === 'string' && input.meta.title.trim()) ||
        input.defaultTitle;
      const coverImageUrl =
        (typeof opts.coverImage === 'string' && opts.coverImage) ||
        (typeof input.meta.coverImage === 'string' && input.meta.coverImage) ||
        (typeof input.meta.cover_image === 'string' && input.meta.cover_image) ||
        undefined;
      const blogIdentifier =
        (typeof opts.blog === 'string' && opts.blog) ||
        (typeof input.meta.blogIdentifier === 'string' && input.meta.blogIdentifier) ||
        (typeof input.meta.blog === 'string' && input.meta.blog) ||
        undefined;
      const state =
        ((typeof opts.state === 'string' && opts.state) ||
          pickString(input.meta, 'state')) as TumblrPostState | undefined;
      const publishOn =
        (typeof opts.publishOn === 'string' && opts.publishOn) ||
        pickString(input.meta, 'publishOn', 'publish_on');
      const date = (typeof opts.date === 'string' && opts.date) || pickString(input.meta, 'date');
      const slug = (typeof opts.slug === 'string' && opts.slug) || pickString(input.meta, 'slug');

      const result = await publish({
        input: input.raw,
        isFile: false,
        title,
        tags,
        coverImageUrl,
        blogIdentifier,
        state,
        publishOn,
        date,
        slug,
        config,
      });

      if (result.warnings.length > 0) {
        console.log('Warnings:');
        for (const warning of result.warnings) {
          console.log(`  - ${warning}`);
        }
        console.log('');
      }

      console.log('Tumblr text post published successfully!');
      console.log(`  Post ID:         ${result.post.postId}`);
      console.log(`  Blog Identifier: ${result.post.blogIdentifier}`);
      console.log(`  Title:           ${result.post.title}`);
      if (result.post.state) {
        console.log(`  State:           ${result.post.state}`);
      }
      if (result.post.url) {
        console.log(`  URL:             ${result.post.url}`);
      }
    } catch (error) {
      const message = (error as Error).message;
      console.error(`Publish failed: ${message}`);
      try {
        const input = ensureInput(opts);
        const tags = [...parseTags(input.meta.tags), ...parseTags(opts.tags)];
        const title =
          (typeof opts.title === 'string' && opts.title.trim()) ||
          (typeof input.meta.title === 'string' && input.meta.title.trim()) ||
          input.defaultTitle ||
          'tumblr-post';
        const coverImageUrl =
          (typeof opts.coverImage === 'string' && opts.coverImage) ||
          (typeof input.meta.coverImage === 'string' && input.meta.coverImage) ||
          (typeof input.meta.cover_image === 'string' && input.meta.cover_image) ||
          undefined;
        const adapted = preview({
          input: input.raw,
          isFile: false,
          title,
          tags,
          coverImageUrl,
        });
        const fallbackPath = saveLocalDraft(title, adapted.body);
        console.error(`Saved local draft to: ${fallbackPath}`);
      } catch {
        // ignore fallback failure
      }
      process.exit(1);
    }
  });

program
  .command('publish-photo')
  .description('Publish a Tumblr photo post from a public image URL')
  .requiredOption('--source-url <url>', 'Public image URL')
  .option('--caption <text>', 'Caption text or HTML')
  .option('--caption-file <path>', 'Read caption text/Markdown/HTML from a file')
  .option('--link <url>', 'Optional click-through URL for the photo')
  .option('--tags <tags>', 'Comma-separated Tumblr tags')
  .option('--blog <identifier>', 'Optional Tumblr blog identifier override')
  .option('--state <state>', 'Tumblr state: published, draft, queue, private')
  .option('--publish-on <datetime>', 'Schedule time for queued Tumblr posts')
  .option('--date <datetime>', 'Backdate timestamp for Tumblr')
  .option('--slug <slug>', 'Custom Tumblr permalink slug')
  .action(async (opts) => {
    try {
      const config = loadTumblrConfig();
      const captionRaw = readOptionalText({
        text: typeof opts.caption === 'string' ? opts.caption : undefined,
        file: typeof opts.captionFile === 'string' ? opts.captionFile : undefined,
      });
      const result = await createTumblrPhotoPost(config, {
        sourceUrl: String(opts.sourceUrl),
        caption: captionRaw ? renderTumblrRichText(captionRaw) : undefined,
        link: typeof opts.link === 'string' ? opts.link : undefined,
        tags: parseTags(opts.tags),
        blogIdentifier: typeof opts.blog === 'string' ? opts.blog : undefined,
        state: typeof opts.state === 'string' ? (opts.state as TumblrPostState) : undefined,
        publishOn: typeof opts.publishOn === 'string' ? opts.publishOn : undefined,
        date: typeof opts.date === 'string' ? opts.date : undefined,
        slug: typeof opts.slug === 'string' ? opts.slug : undefined,
      });

      console.log('Tumblr photo post published successfully!');
      console.log(`  Post ID:         ${result.postId}`);
      console.log(`  Blog Identifier: ${result.blogIdentifier}`);
      if (result.state) {
        console.log(`  State:           ${result.state}`);
      }
      if (result.url) {
        console.log(`  URL:             ${result.url}`);
      }
    } catch (error) {
      console.error(`Photo publish failed: ${(error as Error).message}`);
      process.exit(1);
    }
  });

program
  .command('list')
  .description('List Tumblr posts from the connected blog')
  .option('--state <state>', 'Tumblr collection: published, draft, queue, submission')
  .option('--blog <identifier>', 'Optional Tumblr blog identifier override')
  .option('--limit <number>', 'Maximum number of posts to return')
  .option('--offset <number>', 'Pagination offset')
  .option('--notes-info', 'Request notes metadata when available')
  .action(async (opts) => {
    try {
      const config = loadTumblrConfig();
      const result = await listTumblrPosts(config, {
        state: (typeof opts.state === 'string' ? opts.state : undefined) as
          | TumblrListState
          | undefined,
        blogIdentifier: typeof opts.blog === 'string' ? opts.blog : undefined,
        limit: parseOptionalInt(opts.limit),
        offset: parseOptionalInt(opts.offset),
        notesInfo: opts.notesInfo === true ? true : undefined,
      });

      console.log('Tumblr posts listed successfully!');
      console.log(`  Blog Identifier: ${result.blogIdentifier}`);
      console.log(`  State:           ${result.state}`);
      console.log(`  Returned:        ${result.posts.length}`);
      console.log(`  Limit:           ${result.limit}`);
      console.log(`  Offset:          ${result.offset}`);
      if (typeof result.totalPosts === 'number') {
        console.log(`  Total Posts:     ${result.totalPosts}`);
      }

      if (result.posts.length > 0) {
        console.log('\nPosts:');
        for (const post of result.posts) {
          console.log(`- ${post.postId} | ${post.state} | ${post.title}`);
          console.log(`  ${post.url}`);
        }
      }
    } catch (error) {
      console.error(`List failed: ${(error as Error).message}`);
      process.exit(1);
    }
  });

program
  .command('notes')
  .description('Read Tumblr notes for a specific post')
  .requiredOption('--post-id <id>', 'Tumblr post ID')
  .option('--mode <mode>', 'Notes mode: all, likes, conversation, rollup, reblogs_with_tags')
  .option('--before-timestamp <number>', 'Pagination cursor')
  .option('--blog <identifier>', 'Optional Tumblr blog identifier override')
  .action(async (opts) => {
    try {
      const config = loadTumblrConfig();
      const result = await listTumblrNotes(config, {
        postId: String(opts.postId),
        mode: (typeof opts.mode === 'string' ? opts.mode : undefined) as TumblrNotesMode | undefined,
        beforeTimestamp: parseOptionalInt(opts.beforeTimestamp),
        blogIdentifier: typeof opts.blog === 'string' ? opts.blog : undefined,
      });

      console.log('Tumblr notes loaded successfully!');
      console.log(`  Blog Identifier:       ${result.blogIdentifier}`);
      console.log(`  Post ID:               ${result.postId}`);
      console.log(`  Mode:                  ${result.mode}`);
      console.log(`  Notes Returned:        ${result.notes.length}`);
      console.log(`  Rollup Notes Returned: ${result.rollupNotes.length}`);
      if (typeof result.totalNotes === 'number') {
        console.log(`  Total Notes:           ${result.totalNotes}`);
      }
      if (typeof result.totalLikes === 'number') {
        console.log(`  Total Likes:           ${result.totalLikes}`);
      }
      if (typeof result.totalReblogs === 'number') {
        console.log(`  Total Reblogs:         ${result.totalReblogs}`);
      }
      if (typeof result.nextBeforeTimestamp === 'number') {
        console.log(`  Next Cursor:           ${result.nextBeforeTimestamp}`);
      }

      if (result.notes.length > 0) {
        console.log('\nNotes:');
        for (const note of result.notes) {
          console.log(`- ${note.type} | ${note.blogName || '(anonymous)'} | ${note.timestamp}`);
          if (note.bodyText) {
            console.log(`  ${note.bodyText}`);
          }
        }
      }
    } catch (error) {
      console.error(`Notes failed: ${(error as Error).message}`);
      process.exit(1);
    }
  });

program
  .command('notifications')
  .description('Read Tumblr activity notifications for the connected blog')
  .option('--before <number>', 'Pagination cursor')
  .option('--types <types>', 'Comma-separated activity types')
  .option('--no-rollups', 'Disable activity rollups')
  .option('--omit-post-ids <ids>', 'Comma-separated post IDs to exclude')
  .option('--blog <identifier>', 'Optional Tumblr blog identifier override')
  .action(async (opts) => {
    try {
      const config = loadTumblrConfig();
      const result = await listTumblrNotifications(config, {
        before: parseOptionalInt(opts.before),
        types: parseCsv(opts.types),
        rollups: typeof opts.rollups === 'boolean' ? opts.rollups : undefined,
        omitPostIds: parseCsv(opts.omitPostIds),
        blogIdentifier: typeof opts.blog === 'string' ? opts.blog : undefined,
      });

      console.log('Tumblr notifications loaded successfully!');
      console.log(`  Blog Identifier: ${result.blogIdentifier}`);
      console.log(`  Returned:        ${result.notifications.length}`);
      if (typeof result.nextBefore === 'number') {
        console.log(`  Next Cursor:     ${result.nextBefore}`);
      }

      if (result.notifications.length > 0) {
        console.log('\nNotifications:');
        for (const item of result.notifications) {
          console.log(`- ${item.type} | ${item.blogName || '(unknown)'} | ${item.timestamp ?? 'n/a'}`);
          if (item.postId) {
            console.log(`  Post ID: ${item.postId}`);
          }
        }
      }
    } catch (error) {
      console.error(`Notifications failed: ${(error as Error).message}`);
      process.exit(1);
    }
  });

program
  .command('followers')
  .description('List Tumblr followers for the connected blog')
  .option('--limit <number>', 'Maximum number of followers to return')
  .option('--offset <number>', 'Pagination offset')
  .option('--blog <identifier>', 'Optional Tumblr blog identifier override')
  .action(async (opts) => {
    try {
      const config = loadTumblrConfig();
      const result = await listTumblrFollowers(config, {
        limit: parseOptionalInt(opts.limit),
        offset: parseOptionalInt(opts.offset),
        blogIdentifier: typeof opts.blog === 'string' ? opts.blog : undefined,
      });

      console.log('Tumblr followers loaded successfully!');
      console.log(`  Blog Identifier: ${result.blogIdentifier}`);
      console.log(`  Returned:        ${result.users.length}`);
      console.log(`  Limit:           ${result.limit}`);
      console.log(`  Offset:          ${result.offset}`);
      if (typeof result.totalUsers === 'number') {
        console.log(`  Total Users:     ${result.totalUsers}`);
      }

      if (result.users.length > 0) {
        console.log('\nFollowers:');
        for (const user of result.users) {
          console.log(`- ${user.name}${user.url ? ` | ${user.url}` : ''}`);
        }
      }
    } catch (error) {
      console.error(`Followers failed: ${(error as Error).message}`);
      process.exit(1);
    }
  });

program
  .command('limits')
  .description('Read Tumblr publish and account limits')
  .action(async () => {
    try {
      const config = loadTumblrConfig();
      const result = await getTumblrLimits(config);

      console.log('Tumblr limits loaded successfully!');
      if (result.limits.length === 0) {
        console.log('  No limit details returned.');
        return;
      }

      for (const limit of result.limits) {
        console.log(`- ${limit.key}`);
        if (limit.description) {
          console.log(`  ${limit.description}`);
        }
        if (typeof limit.limit === 'number') {
          console.log(`  Limit:      ${limit.limit}`);
        }
        if (typeof limit.remaining === 'number') {
          console.log(`  Remaining:  ${limit.remaining}`);
        }
        if (typeof limit.resetAt === 'number') {
          console.log(`  Reset At:   ${limit.resetAt}`);
        }
      }
    } catch (error) {
      console.error(`Limits failed: ${(error as Error).message}`);
      process.exit(1);
    }
  });

program
  .command('queue-reorder')
  .description('Move a queued Tumblr post to a different queue position')
  .requiredOption('--post-id <id>', 'Queued Tumblr post ID to move')
  .option('--insert-after <id>', 'Move after this queued post ID, or 0 to move to the top')
  .option('--blog <identifier>', 'Optional Tumblr blog identifier override')
  .action(async (opts) => {
    try {
      const config = loadTumblrConfig();
      const result = await reorderTumblrQueue(config, {
        postId: String(opts.postId),
        insertAfter: typeof opts.insertAfter === 'string' ? opts.insertAfter : undefined,
        blogIdentifier: typeof opts.blog === 'string' ? opts.blog : undefined,
      });

      console.log('Tumblr queue reordered successfully!');
      console.log(`  Blog Identifier: ${result.blogIdentifier}`);
      console.log(`  Post ID:         ${result.postId}`);
      console.log(`  Insert After:    ${result.insertAfter}`);
    } catch (error) {
      console.error(`Queue reorder failed: ${(error as Error).message}`);
      process.exit(1);
    }
  });

program
  .command('queue-shuffle')
  .description('Shuffle queued Tumblr posts for the connected blog')
  .option('--blog <identifier>', 'Optional Tumblr blog identifier override')
  .action(async (opts) => {
    try {
      const config = loadTumblrConfig();
      const result = await shuffleTumblrQueue(config, {
        blogIdentifier: typeof opts.blog === 'string' ? opts.blog : undefined,
      });

      console.log('Tumblr queue shuffled successfully!');
      console.log(`  Blog Identifier: ${result.blogIdentifier}`);
      console.log(`  OK:              ${result.ok}`);
    } catch (error) {
      console.error(`Queue shuffle failed: ${(error as Error).message}`);
      process.exit(1);
    }
  });

program
  .command('delete')
  .description('Delete a Tumblr post by post ID')
  .requiredOption('--post-id <id>', 'Tumblr post ID to delete')
  .option('--blog <identifier>', 'Optional Tumblr blog identifier override')
  .action(async (opts) => {
    try {
      const config = loadTumblrConfig();
      const result = await deleteTumblrPost(config, {
        postId: String(opts.postId),
        blogIdentifier: typeof opts.blog === 'string' ? opts.blog : undefined,
      });

      console.log('Tumblr post deleted successfully!');
      console.log(`  Post ID:         ${result.postId}`);
      console.log(`  Blog Identifier: ${result.blogIdentifier}`);
      console.log(`  OK:              ${result.ok}`);
    } catch (error) {
      console.error(`Delete failed: ${(error as Error).message}`);
      process.exit(1);
    }
  });

program
  .command('preview')
  .description('Preview Tumblr-adapted HTML without publishing')
  .option('--file <path>', 'Read content from a Markdown or HTML file')
  .option('--text <text>', 'Use inline text/Markdown/HTML content')
  .option('--title <title>', 'Override post title')
  .option('--tags <tags>', 'Comma-separated Tumblr tags')
  .option('--cover-image <url>', 'Optional cover image URL to prepend')
  .option('-o, --output <path>', 'Write preview HTML to a file')
  .action((opts) => {
    try {
      const input = ensureInput(opts);
      const tags = [...parseTags(input.meta.tags), ...parseTags(opts.tags)];
      const title =
        (typeof opts.title === 'string' && opts.title.trim()) ||
        (typeof input.meta.title === 'string' && input.meta.title.trim()) ||
        input.defaultTitle;
      const coverImageUrl =
        (typeof opts.coverImage === 'string' && opts.coverImage) ||
        (typeof input.meta.coverImage === 'string' && input.meta.coverImage) ||
        (typeof input.meta.cover_image === 'string' && input.meta.cover_image) ||
        undefined;

      const result = preview({
        input: input.raw,
        isFile: false,
        title,
        tags,
        coverImageUrl,
      });

      console.log(`Title: ${result.title}`);
      console.log(`Tags:  ${result.tags.join(', ') || '(none)'}`);

      if (result.warnings.length > 0) {
        console.log('\nWarnings:');
        for (const warning of result.warnings) {
          console.log(`  - ${warning}`);
        }
      }

      if (typeof opts.output === 'string' && opts.output.trim()) {
        const outputPath = resolve(opts.output);
        writeFileSync(outputPath, result.body, 'utf-8');
        console.log(`\nPreview HTML written to: ${outputPath}`);
      } else {
        console.log('\n--- Preview HTML ---');
        console.log(result.body);
        console.log('--- End Preview ---');
      }
    } catch (error) {
      console.error(`Preview failed: ${(error as Error).message}`);
      process.exit(1);
    }
  });

program
  .command('validate')
  .description('Validate local YouMind credentials')
  .action(() => {
    const config = loadTumblrConfig();
    if (!config.apiKey) {
      console.error('Error: youmind.api_key not set. Configure ~/.youmind/config.yaml.');
      process.exit(1);
    }

    console.log('YouMind API key is configured.');
    console.log(`Base URL: ${config.baseUrl}`);
    console.log(
      'Tumblr account connectivity is validated on the first OpenAPI call. If Tumblr is not connected in YouMind yet, the request will return a clear error.',
    );
    console.log(
      'Available operations: publish, publish-photo, preview, list, notes, notifications, followers, limits, queue-reorder, queue-shuffle, delete.',
    );
  });

program.parse();
