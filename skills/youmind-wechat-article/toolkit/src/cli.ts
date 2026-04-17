#!/usr/bin/env tsx
/**
 * CLI entry point for YouMind WeChat Skill.
 *
 * Usage:
 *   npx tsx src/cli.ts preview article.md --theme simple --color "#3498db"
 *   npx tsx src/cli.ts publish article.md --theme decoration --color "#9b59b6"
 *   npx tsx src/cli.ts themes
 *   npx tsx src/cli.ts colors
 *   npx tsx src/cli.ts theme-preview article.md --color "#e74c3c"
 */

import { Command } from 'commander';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { WeChatConverter, previewHtml } from './converter.js';
import {
  DEFAULT_COLOR,
  DEFAULT_THEME,
  type FontFamily,
  type HeadingSize,
  type ParagraphSpacing,
  type Theme,
  type ThemeKey,
  type ThemeStyles,
  listPresetColors,
  listThemes,
} from './theme-engine.js';
import {
  countDrafts,
  deleteDraft,
  getAccessToken,
  listDrafts,
  type WeChatResultLink,
  uploadImage,
  uploadThumb,
  validateConnection,
} from './wechat-api.js';
import { createDraft } from './publisher.js';
import { loadLayeredConfig, YOUMIND_CONFIG_ERROR_HINT } from './config.js';

// --- Config Loading ---
import { dirname, join } from 'node:path';

function loadConfig(): Record<string, unknown> {
  return loadLayeredConfig();
}

function loadCustomTheme(jsonPath: string): Theme {
  const raw = JSON.parse(readFileSync(resolve(jsonPath), 'utf-8'));
  const styles: ThemeStyles = raw.styles ?? raw;
  return {
    name: raw.meta?.name ?? 'Custom Theme',
    key: 'custom' as ThemeKey,
    description: raw.meta?.description ?? 'Custom theme',
    color: raw.tokens?.color ?? DEFAULT_COLOR,
    styles,
  };
}

function printResultLinks(
  resultLinks: WeChatResultLink[] | undefined,
  options?: { indent?: string; skipUrls?: string[] },
): void {
  if (!resultLinks || resultLinks.length === 0) {
    return;
  }

  const indent = options?.indent ?? '';
  const filteredLinks = resultLinks.filter((link) => !options?.skipUrls?.includes(link.url));
  if (filteredLinks.length === 0) {
    return;
  }
  console.log(`${indent}Result links:`);
  for (const link of filteredLinks) {
    console.log(`${indent}  - [${link.label}](${link.url})`);
  }
}

// --- Commands ---

const program = new Command();

program
  .name('youmind-wechat')
  .description('YouMind WeChat: Markdown to WeChat HTML with dynamic themes')
  .version('1.0.0');

program
  .command('preview')
  .description('Generate HTML preview and open in browser')
  .argument('<input>', 'Markdown file path')
  .option('-t, --theme <key>', 'Theme: simple, center, decoration, prominent', DEFAULT_THEME)
  .option('-c, --color <hex>', 'Theme color (HEX)', DEFAULT_COLOR)
  .option('-o, --output <path>', 'Output HTML file path')
  .option('--no-open', "Don't open browser")
  .option('--font <key>', 'Font: default, optima, serif', 'default')
  .option('--font-size <n>', 'Body font size (14-18)', '16')
  .option('--heading-size <key>', 'Heading size: minus2, minus1, standard, plus1', 'standard')
  .option('--paragraph-spacing <key>', 'Paragraph spacing: compact, normal, loose', 'normal')
  .option('--custom-theme <path>', 'Custom theme JSON file path')
  .action(async (input: string, opts) => {
    const converter = new WeChatConverter({
      themeKey: opts.theme as ThemeKey,
      color: opts.color,
      fontFamily: opts.font as FontFamily,
      fontSize: parseInt(opts.fontSize),
      headingSize: opts.headingSize as HeadingSize,
      paragraphSpacing: opts.paragraphSpacing as ParagraphSpacing,
      ...(opts.customTheme ? { customTheme: loadCustomTheme(opts.customTheme) } : {}),
    });

    const result = converter.convertFile(input);
    const fullHtml = previewHtml(result.html, converter.getTheme());

    const outputPath = opts.output || input.replace(/\.md$/, '.html');
    writeFileSync(outputPath, fullHtml, 'utf-8');

    console.log(`Title: ${result.title}`);
    console.log(`Digest: ${result.digest}`);
    console.log(`Images: ${result.images.length}`);
    console.log(`Theme: ${opts.theme} | Color: ${opts.color}`);
    console.log(`Output: ${outputPath}`);

    if (opts.open !== false) {
      const { default: open } = await import('open');
      await open(`file://${resolve(outputPath)}`);
      console.log('Opened in browser.');
    }
  });

program
  .command('publish')
  .description('Convert and publish as WeChat draft')
  .argument('<input>', 'Markdown file path')
  .option('-t, --theme <key>', 'Theme key')
  .option('-c, --color <hex>', 'Theme color (HEX)')
  .option('--cover <path>', 'Cover image file path')
  .option('--title <text>', 'Override article title')
  .option('--author <name>', 'Article author')
  .option('--font <key>', 'Font: default, optima, serif', 'default')
  .option('--font-size <n>', 'Body font size (14-18)', '16')
  .option('--heading-size <key>', 'Heading size', 'standard')
  .option('--paragraph-spacing <key>', 'Paragraph spacing', 'normal')
  .option('--custom-theme <path>', 'Custom theme JSON file path')
  .action(async (input: string, opts) => {
    const cfg = loadConfig();
    const youmindCfg = (cfg.youmind as Record<string, string>) || {};

    const themeKey = (opts.theme || (cfg.theme as string) || DEFAULT_THEME) as ThemeKey;
    const color = opts.color || (cfg.theme_color as string) || DEFAULT_COLOR;
    const author = opts.author;

    if (!youmindCfg.api_key) {
      console.error(`Error: ${YOUMIND_CONFIG_ERROR_HINT}`);
      process.exit(1);
    }

    const converter = new WeChatConverter({
      themeKey,
      color,
      fontFamily: opts.font as FontFamily,
      fontSize: parseInt(opts.fontSize),
      headingSize: opts.headingSize as HeadingSize,
      paragraphSpacing: opts.paragraphSpacing as ParagraphSpacing,
      ...(opts.customTheme ? { customTheme: loadCustomTheme(opts.customTheme) } : {}),
    });

    const result = converter.convertFile(input);

    console.log(`Title: ${result.title}`);
    console.log(`Digest: ${result.digest}`);
    console.log(`Images found: ${result.images.length}`);
    console.log(`Theme: ${themeKey} | Color: ${color}`);

    const token = await getAccessToken('', '');
    console.log('Access token obtained.');

    let html = result.html;
    const mdDir = dirname(resolve(input));

    for (const imgSrc of result.images) {
      if (imgSrc.startsWith('http://') || imgSrc.startsWith('https://')) {
        console.log(`Skipping remote image: ${imgSrc}`);
        continue;
      }

      let imgPath = resolve(imgSrc);
      if (!existsSync(imgPath)) {
        imgPath = join(mdDir, imgSrc);
      }

      if (existsSync(imgPath)) {
        console.log(`Uploading image: ${imgSrc}`);
        const wechatUrl = await uploadImage(token, imgPath);
        html = html.replace(imgSrc, wechatUrl);
        console.log(`  -> ${wechatUrl}`);
      } else {
        console.log(`Warning: image not found: ${imgSrc}`);
      }
    }

    let thumbMediaId: string | undefined;
    if (opts.cover) {
      console.log(`Uploading cover: ${opts.cover}`);
      thumbMediaId = await uploadThumb(token, opts.cover);
      console.log(`  -> media_id: ${thumbMediaId}`);
    }

    const title = opts.title || result.title || input.replace(/\.md$/, '');
    const draft = await createDraft({
      accessToken: token,
      title,
      html,
      digest: result.digest,
      thumbMediaId,
      author,
    });

    console.log(`\nDraft created! media_id: ${draft.mediaId}`);
    printResultLinks(draft.resultLinks);
  });

program
  .command('validate')
  .description('Check WeChat connectivity via YouMind proxy')
  .action(async () => {
    try {
      const r = await validateConnection();
      console.log(`OK: ${r.message}`);
      console.log(`  AppID:           ${r.appid}`);
      console.log(`  Token expires:   ${r.tokenExpiresIn}s`);
    } catch (e) {
      console.error(`Validation failed: ${(e as Error).message}`);
      process.exit(1);
    }
  });

program
  .command('list-drafts')
  .description('List WeChat drafts (paginated, max 20/page)')
  .option('--offset <n>', 'Skip first N drafts', '0')
  .option('--count <n>', 'Items per page', '20')
  .option('--no-content', 'Omit content body in list (smaller payload)')
  .action(async (opts: { offset: string; count: string; content?: boolean }) => {
    try {
      const r = await listDrafts(
        Number.parseInt(opts.offset, 10),
        Number.parseInt(opts.count, 10),
        opts.content === false,
      );
      console.log(`Drafts (${r.items.length}/${r.totalCount} total):\n`);
      for (const d of r.items) {
        const titles = d.articles.map((a) => a.title).join(' / ');
        console.log(`  [${d.mediaId}] ${titles || '(no title)'}`);
        printResultLinks(d.resultLinks, { indent: '    ' });
      }
    } catch (e) {
      console.error(`list-drafts failed: ${(e as Error).message}`);
      process.exit(1);
    }
  });

program
  .command('count-drafts')
  .description('Total draft count')
  .action(async () => {
    try {
      const r = await countDrafts();
      console.log(`Total drafts: ${r.totalCount}`);
    } catch (e) {
      console.error(`count-drafts failed: ${(e as Error).message}`);
      process.exit(1);
    }
  });

program
  .command('delete-draft <mediaId>')
  .description('Delete a draft by media_id (permanent — WeChat does not trash drafts)')
  .option('-y, --yes', 'Skip confirmation prompt')
  .action(async (mediaId: string, opts: { yes?: boolean }) => {
    if (!opts.yes) {
      console.error(`Refusing to delete draft ${mediaId} without --yes.`);
      process.exit(1);
    }
    try {
      const r = await deleteDraft(mediaId);
      console.log(r.ok ? `Deleted draft ${r.id}.` : `Delete returned ok=false for ${r.id}.`);
    } catch (e) {
      console.error(`delete-draft failed: ${(e as Error).message}`);
      process.exit(1);
    }
  });

program
  .command('themes')
  .description('List available themes')
  .action(() => {
    console.log('Available themes:\n');
    for (const t of listThemes()) {
      console.log(`  ${t.key.padEnd(16)} ${t.name}  (${t.description})`);
    }
  });

program
  .command('colors')
  .description('List preset colors')
  .action(() => {
    console.log('Preset colors:\n');
    for (const [name, hex] of Object.entries(listPresetColors())) {
      console.log(`  ${name.padEnd(20)} ${hex}`);
    }
    console.log('\nYou can also use any custom HEX color with --color.');
  });

program
  .command('theme-preview')
  .description('Generate previews for all 4 themes with the given color')
  .argument('<input>', 'Markdown file path')
  .option('-c, --color <hex>', 'Theme color (HEX)', DEFAULT_COLOR)
  .option('--no-open', "Don't open browser")
  .option('--font <key>', 'Font', 'default')
  .option('--font-size <n>', 'Font size', '16')
  .action(async (input: string, opts) => {
    const themes = listThemes();

    for (const t of themes) {
      const converter = new WeChatConverter({
        themeKey: t.key,
        color: opts.color,
        fontFamily: opts.font as FontFamily,
        fontSize: parseInt(opts.fontSize),
      });

      const result = converter.convertFile(input);
      const fullHtml = previewHtml(result.html, converter.getTheme());

      const outputPath = input.replace(/\.md$/, `.${t.key}.html`);
      writeFileSync(outputPath, fullHtml, 'utf-8');
      console.log(`  ${t.key.padEnd(16)} -> ${outputPath}`);
    }

    if (opts.open !== false) {
      const firstOutput = input.replace(/\.md$/, `.${themes[0].key}.html`);
      const { default: open } = await import('open');
      await open(`file://${resolve(firstOutput)}`);
    }

    console.log(`\nGenerated ${themes.length} theme previews with color ${opts.color}.`);
  });

program.parse();
