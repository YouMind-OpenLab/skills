#!/usr/bin/env node
/**
 * YouMind WordPress Article CLI.
 *
 * All operations route through https://youmind.com/openapi/v1/wordpress/*.
 * The user's WP credentials live in YouMind, not in this skill.
 */

import { Command } from 'commander';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';

import { adaptForWordPress, convertToHtml } from './content-adapter.js';
import { publish } from './publisher.js';
import {
  createCategory,
  createComment,
  deleteCategory,
  deleteComment,
  deletePost,
  getComment,
  getPost,
  listCategories,
  listComments,
  listDraftPosts,
  listPosts,
  listPublishedPosts,
  listTags,
  loadWordPressConfig,
  publishPost,
  unpublishPost,
  updateCategory,
  updateComment,
  updatePost,
  uploadMedia,
  validateConnection,
  type WordPressConfig,
  type WPCommentListStatus,
  type WPCommentStatus,
  type WPListStatus,
  type WPPost,
  type WPPostStatus,
} from './wordpress-api.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ensureConfig(): WordPressConfig {
  const cfg = loadWordPressConfig();
  if (!cfg.apiKey) {
    console.error('Error: youmind.api_key not set. Configure ~/.youmind/config.yaml.');
    process.exit(1);
  }
  return cfg;
}

function parseCommaList(value?: string): string[] | undefined {
  if (!value) return undefined;
  const arr = value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return arr.length ? arr : undefined;
}

function printPostLine(post: WPPost): void {
  const date = post.date?.split('T')[0] || '';
  const status = post.status.padEnd(7);
  console.log(`  [${post.id}] ${date} | ${status} | ${post.title || '(no title)'}`);
  console.log(`         link:  ${post.link}`);
  if (post.adminUrl) console.log(`         admin: ${post.adminUrl}`);
}

function printPostDetail(post: WPPost): void {
  console.log(`ID:           ${post.id}`);
  console.log(`Title:        ${post.title}`);
  console.log(`Status:       ${post.status}`);
  console.log(`Slug:         ${post.slug}`);
  console.log(`Link:         ${post.link}`);
  if (post.adminUrl) console.log(`Admin URL:    ${post.adminUrl}`);
  console.log(`Author:       ${post.author}`);
  console.log(`Featured:     ${post.featuredMedia || '(none)'}`);
  console.log(`Tags:         [${post.tags.join(', ')}]`);
  console.log(`Categories:   [${post.categories.join(', ')}]`);
  console.log(`Date:         ${post.date}`);
  console.log(`Modified:     ${post.modified}`);
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

const program = new Command();

program
  .name('youmind-wordpress')
  .description('YouMind WordPress Article — AI-powered publishing via YouMind OpenAPI')
  .version('1.0.0');

// --- publish ---
program
  .command('publish <input>')
  .description('Publish a Markdown file to WordPress')
  .option('--draft', 'Publish as draft (default)')
  .option('--publish', 'Publish immediately')
  .option('--pending', 'Set status to pending review')
  .option('--private', 'Publish as private post')
  .option('--future', 'Schedule as future post (requires --date)')
  .option('--category <names>', 'Comma-separated category names')
  .option('--tags <names>', 'Comma-separated tag names')
  .option('--featured-image <file>', 'Path to featured image file (auto-uploaded)')
  .option('--featured-image-alt <text>', 'Featured image alt text')
  .option('--featured-image-caption <text>', 'Featured image caption')
  .option('--excerpt <text>', 'Override excerpt')
  .option('--title <title>', 'Override post title')
  .option('--slug <slug>', 'Override post slug')
  .option('--date <iso>', 'Publish or schedule date in ISO 8601 format')
  .option('--format <format>', 'WordPress post format')
  .action(async (input: string, opts: Record<string, string | boolean | undefined>) => {
    const config = ensureConfig();

    let status: WPPostStatus = 'draft';
    if (opts.publish) status = 'publish';
    else if (opts.pending) status = 'pending';
    else if (opts.private) status = 'private';
    else if (opts.future) status = 'future';

    const tags = parseCommaList(typeof opts.tags === 'string' ? opts.tags : undefined);
    const categories = parseCommaList(
      typeof opts.category === 'string' ? opts.category : undefined,
    );

    console.log(`Publishing ${input} as ${status}...`);

    try {
      const result = await publish({
        config,
        input: resolve(input),
        isFile: true,
        status,
        tags,
        categories,
        featuredImage:
          typeof opts.featuredImage === 'string' ? opts.featuredImage : undefined,
        featuredImageAlt:
          typeof opts.featuredImageAlt === 'string' ? opts.featuredImageAlt : undefined,
        featuredImageCaption:
          typeof opts.featuredImageCaption === 'string'
            ? opts.featuredImageCaption
            : undefined,
        excerpt: typeof opts.excerpt === 'string' ? opts.excerpt : undefined,
        title: typeof opts.title === 'string' ? opts.title : undefined,
        slug: typeof opts.slug === 'string' ? opts.slug : undefined,
        date: typeof opts.date === 'string' ? opts.date : undefined,
        format:
          typeof opts.format === 'string'
            ? (opts.format as Parameters<typeof publish>[0]['format'])
            : undefined,
      });

      console.log('\nPublished successfully!');
      console.log(`  Post ID:  ${result.id}`);
      console.log(`  Status:   ${result.status}`);
      console.log(`  Title:    ${result.title}`);
      console.log(`  URL:      ${result.url}`);
      if (result.adminUrl) console.log(`  Admin:    ${result.adminUrl}`);
      console.log(`  Slug:     ${result.slug}`);
      console.log(`  Excerpt:  ${result.excerpt.slice(0, 100)}...`);
    } catch (e) {
      console.error(`Publish failed: ${(e as Error).message}`);
      process.exit(1);
    }
  });

// --- preview ---
program
  .command('preview <input>')
  .description('Convert Markdown to HTML and preview locally (no API calls)')
  .option('-o, --output <file>', 'Output HTML file path')
  .action((input: string, opts: { output?: string }) => {
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
    body { max-width: 800px; margin: 40px auto; padding: 0 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.8; color: #333; }
    h1 { font-size: 2em; margin-bottom: 0.5em; }
    h2 { font-size: 1.5em; margin-top: 1.5em; }
    h3 { font-size: 1.25em; margin-top: 1.2em; }
    code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; font-size: 0.9em; }
    pre { background: #f4f4f4; padding: 16px; border-radius: 6px; overflow-x: auto; }
    pre code { background: none; padding: 0; }
    blockquote { border-left: 4px solid #ddd; margin: 1em 0; padding: 0.5em 1em; color: #666; }
    img { max-width: 100%; height: auto; }
    a { color: #0366d6; }
    .excerpt { color: #666; font-style: italic; border-bottom: 1px solid #eee; padding-bottom: 1em; margin-bottom: 2em; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <p class="excerpt">${excerpt}</p>
  ${html}
</body>
</html>`;

    const outputPath = opts.output || resolve(`${inputPath.replace(/\.md$/, '')}.preview.html`);
    writeFileSync(outputPath, fullHtml, 'utf-8');
    console.log(`Preview generated: ${outputPath}`);
    console.log(`Title: ${title}`);
    console.log(`Excerpt: ${excerpt.slice(0, 100)}...`);
  });

// --- validate ---
program
  .command('validate')
  .description('Check WordPress connectivity via YouMind proxy')
  .action(async () => {
    const config = ensureConfig();
    console.log('Validating WordPress connection via YouMind...');
    try {
      const r = await validateConnection(config);
      console.log(`OK: ${r.message}`);
      if (r.siteUrl) console.log(`  Site URL:    ${r.siteUrl}`);
      if (r.accountUsername) console.log(`  Username:    ${r.accountUsername}`);
      if (r.accountName) console.log(`  Display:     ${r.accountName}`);
      if (r.accountId !== undefined) console.log(`  User ID:     ${r.accountId}`);
    } catch (e) {
      console.error(`Validation failed: ${(e as Error).message}`);
      process.exit(1);
    }
  });

// --- list ---
program
  .command('list')
  .description('List WordPress posts')
  .option('--page <n>', 'Page number', '1')
  .option('--per-page <n>', 'Posts per page', '15')
  .option('--status <status>', 'Filter by status (publish|draft|pending|private|future|any)')
  .action(async (opts: { page: string; perPage: string; status?: string }) => {
    const config = ensureConfig();
    const page = Number.parseInt(opts.page, 10);
    const perPage = Number.parseInt(opts.perPage, 10);
    try {
      const r = await listPosts(config, page, perPage, opts.status as WPListStatus | undefined);
      if (!r.posts.length) {
        console.log('No posts found.');
        return;
      }
      console.log(`Posts (page ${r.page}/${r.totalPages}, ${r.posts.length}/${r.total} total):\n`);
      for (const post of r.posts) {
        printPostLine(post);
        console.log('');
      }
    } catch (e) {
      console.error(`List failed: ${(e as Error).message}`);
      process.exit(1);
    }
  });

// --- list-drafts / list-published shortcuts ---
program
  .command('list-drafts')
  .description('List draft posts')
  .option('--page <n>', 'Page number', '1')
  .option('--per-page <n>', 'Posts per page', '15')
  .action(async (opts: { page: string; perPage: string }) => {
    const config = ensureConfig();
    const r = await listDraftPosts(
      config,
      Number.parseInt(opts.page, 10),
      Number.parseInt(opts.perPage, 10),
    );
    if (!r.posts.length) {
      console.log('No drafts found.');
      return;
    }
    console.log(`Drafts (page ${r.page}/${r.totalPages}, ${r.posts.length}/${r.total} total):\n`);
    for (const post of r.posts) {
      printPostLine(post);
      console.log('');
    }
  });

program
  .command('list-published')
  .description('List published posts')
  .option('--page <n>', 'Page number', '1')
  .option('--per-page <n>', 'Posts per page', '15')
  .action(async (opts: { page: string; perPage: string }) => {
    const config = ensureConfig();
    const r = await listPublishedPosts(
      config,
      Number.parseInt(opts.page, 10),
      Number.parseInt(opts.perPage, 10),
    );
    if (!r.posts.length) {
      console.log('No published posts found.');
      return;
    }
    console.log(`Published (page ${r.page}/${r.totalPages}, ${r.posts.length}/${r.total} total):\n`);
    for (const post of r.posts) {
      printPostLine(post);
      console.log('');
    }
  });

// --- get ---
program
  .command('get <id>')
  .description('Fetch a single post by ID')
  .option('--context <view|edit|embed>', 'Response context', 'view')
  .option('--show-body', 'Print the full content body')
  .action(async (id: string, opts: { context: string; showBody?: boolean }) => {
    const config = ensureConfig();
    try {
      const post = await getPost(
        config,
        Number.parseInt(id, 10),
        opts.context as 'view' | 'edit' | 'embed',
      );
      printPostDetail(post);
      if (opts.showBody) {
        console.log('\n--- content ---');
        console.log(post.content);
      }
    } catch (e) {
      console.error(`Failed to fetch post ${id}: ${(e as Error).message}`);
      process.exit(1);
    }
  });

// --- update ---
program
  .command('update <id>')
  .description('Update an existing post by ID')
  .option('--title <title>', 'New title')
  .option('--body-file <path>', 'Replace content from a markdown/html file')
  .option('--excerpt <text>', 'Replace excerpt')
  .option('--status <status>', 'New status (publish|draft|pending|private|future)')
  .option('--tags <names>', 'Replace tags (comma-separated)')
  .option('--categories <names>', 'Replace categories (comma-separated)')
  .option('--featured-image <file>', 'Replace featured image (uploads file then attaches)')
  .option('--slug <slug>', 'Replace slug')
  .action(
    async (
      id: string,
      opts: Record<string, string | boolean | undefined>,
    ) => {
      const config = ensureConfig();
      const updates: Record<string, unknown> = {};

      if (typeof opts.title === 'string') updates.title = opts.title;
      if (typeof opts.bodyFile === 'string') {
        const filePath = resolve(opts.bodyFile);
        if (!existsSync(filePath)) {
          console.error(`Body file not found: ${filePath}`);
          process.exit(1);
        }
        const md = readFileSync(filePath, 'utf-8');
        const adapted = adaptForWordPress({ markdown: md });
        updates.content = adapted.html;
        if (!('title' in updates) && adapted.title) {
          updates.title = adapted.title;
        }
        if (!('excerpt' in updates) && adapted.excerpt) {
          updates.excerpt = adapted.excerpt;
        }
        if (!('status' in updates) && adapted.status) {
          updates.status = adapted.status;
        }
        if (!('slug' in updates) && adapted.slug) {
          updates.slug = adapted.slug;
        }
        if (!('date' in updates) && adapted.date) {
          updates.date = adapted.date;
        }
        if (!('format' in updates) && adapted.format) {
          updates.format = adapted.format;
        }
        if (!('tags' in updates) && adapted.tags?.length) {
          updates.tags = adapted.tags;
        }
        if (!('categories' in updates) && adapted.categories?.length) {
          updates.categories = adapted.categories;
        }
        if (
          typeof opts.featuredImage !== 'string' &&
          adapted.featuredImage &&
          existsSync(resolve(dirname(filePath), adapted.featuredImage))
        ) {
          try {
            const media = await uploadMedia(config, {
              filePath: resolve(dirname(filePath), adapted.featuredImage),
              altText: adapted.featuredImageAlt,
              caption: adapted.featuredImageCaption,
            });
            updates.featuredMedia = media.id;
            console.log(`Featured image uploaded: ID=${media.id}, URL=${media.sourceUrl}`);
          } catch (e) {
            console.error(`Failed to upload featured image from body-file frontmatter: ${(e as Error).message}`);
            process.exit(1);
          }
        }
      }
      if (typeof opts.excerpt === 'string') updates.excerpt = opts.excerpt;
      if (typeof opts.status === 'string') updates.status = opts.status as WPPostStatus;
      if (typeof opts.tags === 'string') updates.tags = parseCommaList(opts.tags);
      if (typeof opts.categories === 'string') updates.categories = parseCommaList(opts.categories);
      if (typeof opts.slug === 'string') updates.slug = opts.slug;
      if (typeof opts.featuredImage === 'string') {
        try {
          const media = await uploadMedia(config, { filePath: opts.featuredImage });
          updates.featuredMedia = media.id;
          console.log(`Featured image uploaded: ID=${media.id}, URL=${media.sourceUrl}`);
        } catch (e) {
          console.error(`Failed to upload featured image: ${(e as Error).message}`);
          process.exit(1);
        }
      }

      if (Object.keys(updates).length === 0) {
        console.error(
          'Nothing to update. Pass at least one of --title / --body-file / --excerpt / --status / --tags / --categories / --featured-image / --slug.',
        );
        process.exit(1);
      }

      try {
        const post = await updatePost(
          config,
          Number.parseInt(id, 10),
          updates as Parameters<typeof updatePost>[2],
        );
        console.log('Updated:');
        printPostDetail(post);
      } catch (e) {
        console.error(`Failed to update post ${id}: ${(e as Error).message}`);
        process.exit(1);
      }
    },
  );

// --- delete ---
program
  .command('delete <id>')
  .description('Delete a post (default: trash; --force for permanent)')
  .option('-y, --yes', 'Skip confirmation prompt')
  .option('--force', 'Permanently delete (bypasses trash)')
  .action(async (id: string, opts: { yes?: boolean; force?: boolean }) => {
    if (!opts.yes) {
      console.error(`Refusing to delete ${id} without --yes. Re-run with -y to confirm.`);
      process.exit(1);
    }
    const config = ensureConfig();
    try {
      const r = await deletePost(config, Number.parseInt(id, 10), opts.force === true);
      console.log(
        r.deletedPermanently
          ? `Permanently deleted post ${r.id}.`
          : `Moved post ${r.id} to trash. Run with --force to delete permanently.`,
      );
    } catch (e) {
      console.error(`Failed to delete post ${id}: ${(e as Error).message}`);
      process.exit(1);
    }
  });

// --- publish-post / unpublish-post ---
program
  .command('publish-post <id>')
  .description('Publish an existing draft / pending post')
  .action(async (id: string) => {
    const config = ensureConfig();
    try {
      const post = await publishPost(config, Number.parseInt(id, 10));
      console.log('Post is now PUBLISHED:');
      printPostDetail(post);
    } catch (e) {
      console.error(`Failed to publish post ${id}: ${(e as Error).message}`);
      process.exit(1);
    }
  });

program
  .command('unpublish-post <id>')
  .description('Move a published post back to draft')
  .action(async (id: string) => {
    const config = ensureConfig();
    try {
      const post = await unpublishPost(config, Number.parseInt(id, 10));
      console.log('Post is now DRAFT:');
      printPostDetail(post);
    } catch (e) {
      console.error(`Failed to unpublish post ${id}: ${(e as Error).message}`);
      process.exit(1);
    }
  });

// --- upload-media ---
program
  .command('upload-media <file>')
  .description('Upload a media file to WordPress (image, etc.)')
  .option('--alt <text>', 'Alt text for accessibility')
  .option('--caption <text>', 'Caption text')
  .action(async (file: string, opts: { alt?: string; caption?: string }) => {
    const filePath = resolve(file);
    if (!existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      process.exit(1);
    }
    const config = ensureConfig();
    console.log(`Uploading ${basename(filePath)}...`);
    try {
      const media = await uploadMedia(config, {
        filePath,
        altText: opts.alt,
        caption: opts.caption,
      });
      console.log('\nUpload successful!');
      console.log(`  Media ID:  ${media.id}`);
      console.log(`  URL:       ${media.sourceUrl}`);
      console.log(`  Type:      ${media.mimeType}`);
      console.log(`  Markdown:  ${media.markdown}`);
    } catch (e) {
      console.error(`Upload failed: ${(e as Error).message}`);
      process.exit(1);
    }
  });

// --- list-categories / list-tags ---
program
  .command('list-categories')
  .description('List WordPress categories')
  .option('--page <n>', 'Page number', '1')
  .option('--per-page <n>', 'Per page', '50')
  .option('--search <text>', 'Search filter')
  .action(async (opts: { page: string; perPage: string; search?: string }) => {
    const config = ensureConfig();
    const r = await listCategories(
      config,
      Number.parseInt(opts.page, 10),
      Number.parseInt(opts.perPage, 10),
      opts.search,
    );
    if (!r.categories.length) {
      console.log('No categories found.');
      return;
    }
    console.log(`Categories (${r.categories.length}/${r.total} total):\n`);
    for (const c of r.categories) {
      console.log(`  [${c.id}] ${c.name}  (slug: ${c.slug}, posts: ${c.count})`);
    }
  });

program
  .command('list-tags')
  .description('List WordPress tags')
  .option('--page <n>', 'Page number', '1')
  .option('--per-page <n>', 'Per page', '50')
  .option('--search <text>', 'Search filter')
  .action(async (opts: { page: string; perPage: string; search?: string }) => {
    const config = ensureConfig();
    const r = await listTags(
      config,
      Number.parseInt(opts.page, 10),
      Number.parseInt(opts.perPage, 10),
      opts.search,
    );
    if (!r.tags.length) {
      console.log('No tags found.');
      return;
    }
    console.log(`Tags (${r.tags.length}/${r.total} total):\n`);
    for (const t of r.tags) {
      console.log(`  [${t.id}] ${t.name}  (slug: ${t.slug}, posts: ${t.count})`);
    }
  });

// --- Category mutations ---

program
  .command('create-category <name>')
  .description('Create a new WordPress category')
  .option('--description <text>')
  .option('--slug <slug>')
  .option('--parent <id>', 'Parent category ID', (v) => Number.parseInt(v, 10))
  .action(async (name: string, opts: Record<string, string | number | undefined>) => {
    const config = ensureConfig();
    try {
      const cat = await createCategory(config, {
        name,
        description: typeof opts.description === 'string' ? opts.description : undefined,
        slug: typeof opts.slug === 'string' ? opts.slug : undefined,
        parent: typeof opts.parent === 'number' ? opts.parent : undefined,
      });
      console.log(`Created category [${cat.id}] ${cat.name} (slug: ${cat.slug})`);
    } catch (e) {
      console.error(`Failed: ${(e as Error).message}`);
      process.exit(1);
    }
  });

program
  .command('update-category <id>')
  .description('Update an existing category')
  .option('--name <name>')
  .option('--description <text>')
  .option('--slug <slug>')
  .option('--parent <id>', 'Parent category ID', (v) => Number.parseInt(v, 10))
  .action(async (id: string, opts: Record<string, string | number | undefined>) => {
    const config = ensureConfig();
    const updates: Partial<{ name: string; description: string; slug: string; parent: number }> = {};
    if (typeof opts.name === 'string') updates.name = opts.name;
    if (typeof opts.description === 'string') updates.description = opts.description;
    if (typeof opts.slug === 'string') updates.slug = opts.slug;
    if (typeof opts.parent === 'number') updates.parent = opts.parent;
    if (Object.keys(updates).length === 0) {
      console.error('Nothing to update. Pass at least one of --name / --description / --slug / --parent.');
      process.exit(1);
    }
    try {
      const cat = await updateCategory(config, Number.parseInt(id, 10), updates);
      console.log(`Updated category [${cat.id}] ${cat.name} (slug: ${cat.slug})`);
    } catch (e) {
      console.error(`Failed: ${(e as Error).message}`);
      process.exit(1);
    }
  });

program
  .command('delete-category <id>')
  .description('Delete a category (always permanent — WP does not trash terms)')
  .option('-y, --yes', 'Skip confirmation prompt')
  .action(async (id: string, opts: { yes?: boolean }) => {
    if (!opts.yes) {
      console.error(`Refusing to delete category ${id} without --yes.`);
      process.exit(1);
    }
    const config = ensureConfig();
    try {
      const r = await deleteCategory(config, Number.parseInt(id, 10));
      console.log(`Deleted category ${r.id} (permanent).`);
    } catch (e) {
      console.error(`Failed: ${(e as Error).message}`);
      process.exit(1);
    }
  });

// --- Comments ---

function printComment(c: { id: number; post: number; author: number; authorName: string; status: string; content: string; date: string; link: string }): void {
  console.log(`  [${c.id}] post=${c.post} | ${c.status} | ${c.authorName}`);
  console.log(`         ${c.date}`);
  console.log(`         ${c.content.replace(/<[^>]+>/g, '').slice(0, 120)}`);
  console.log(`         ${c.link}`);
}

program
  .command('list-comments')
  .description('List comments (optionally filter by post / status)')
  .option('--post <id>', 'Filter by post ID', (v) => Number.parseInt(v, 10))
  .option('--status <status>', 'approve | hold | spam | trash | any (default: approve)')
  .option('--page <n>', 'Page number', '1')
  .option('--per-page <n>', 'Per page', '30')
  .action(async (opts: { post?: number; status?: string; page: string; perPage: string }) => {
    const config = ensureConfig();
    const r = await listComments(config, {
      postId: opts.post,
      status: opts.status as WPCommentListStatus | undefined,
      page: Number.parseInt(opts.page, 10),
      perPage: Number.parseInt(opts.perPage, 10),
    });
    if (!r.comments.length) {
      console.log('No comments found.');
      return;
    }
    console.log(`Comments (page ${r.page}/${r.totalPages}, ${r.comments.length}/${r.total} total):\n`);
    for (const c of r.comments) {
      printComment(c);
      console.log('');
    }
  });

program
  .command('get-comment <id>')
  .description('Fetch a single comment by ID')
  .action(async (id: string) => {
    const config = ensureConfig();
    try {
      const c = await getComment(config, Number.parseInt(id, 10));
      printComment(c);
      if (c.authorEmail) console.log(`         Author email: ${c.authorEmail}`);
      if (c.authorUrl) console.log(`         Author URL:   ${c.authorUrl}`);
    } catch (e) {
      console.error(`Failed: ${(e as Error).message}`);
      process.exit(1);
    }
  });

program
  .command('create-comment <postId>')
  .description('Add a comment on a post')
  .requiredOption('--content <text>', 'Comment body (HTML or plain text)')
  .option('--parent <id>', 'Parent comment ID for threaded replies', (v) => Number.parseInt(v, 10))
  .option('--author-name <name>', 'Override display name')
  .option('--author-email <email>', 'Override email (admin)')
  .option('--author-url <url>', 'Override URL')
  .action(
    async (
      postId: string,
      opts: Record<string, string | number | undefined>,
    ) => {
      const config = ensureConfig();
      try {
        const c = await createComment(config, {
          postId: Number.parseInt(postId, 10),
          content: opts.content as string,
          parent: typeof opts.parent === 'number' ? opts.parent : undefined,
          authorName: typeof opts.authorName === 'string' ? opts.authorName : undefined,
          authorEmail: typeof opts.authorEmail === 'string' ? opts.authorEmail : undefined,
          authorUrl: typeof opts.authorUrl === 'string' ? opts.authorUrl : undefined,
        });
        console.log(`Created comment [${c.id}] on post ${c.post} (status: ${c.status})`);
        printComment(c);
      } catch (e) {
        console.error(`Failed: ${(e as Error).message}`);
        process.exit(1);
      }
    },
  );

program
  .command('update-comment <id>')
  .description('Edit a comment or change its status')
  .option('--content <text>', 'New content')
  .option('--status <status>', 'approved | hold | spam | trash')
  .action(async (id: string, opts: { content?: string; status?: string }) => {
    if (!opts.content && !opts.status) {
      console.error('Pass --content or --status.');
      process.exit(1);
    }
    const config = ensureConfig();
    try {
      const c = await updateComment(config, Number.parseInt(id, 10), {
        content: opts.content,
        status: opts.status as WPCommentStatus | undefined,
      });
      console.log(`Updated comment [${c.id}] status=${c.status}`);
      printComment(c);
    } catch (e) {
      console.error(`Failed: ${(e as Error).message}`);
      process.exit(1);
    }
  });

program
  .command('delete-comment <id>')
  .description('Delete a comment (default: trash; --force for permanent)')
  .option('-y, --yes', 'Skip confirmation prompt')
  .option('--force', 'Permanently delete (bypasses trash)')
  .action(async (id: string, opts: { yes?: boolean; force?: boolean }) => {
    if (!opts.yes) {
      console.error(`Refusing to delete comment ${id} without --yes.`);
      process.exit(1);
    }
    const config = ensureConfig();
    try {
      const r = await deleteComment(config, Number.parseInt(id, 10), opts.force === true);
      console.log(
        r.deletedPermanently
          ? `Permanently deleted comment ${r.id}.`
          : `Moved comment ${r.id} to trash. Run with --force to delete permanently.`,
      );
    } catch (e) {
      console.error(`Failed: ${(e as Error).message}`);
      process.exit(1);
    }
  });

program.parse();
