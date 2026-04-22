/**
 * WordPress publisher — converts Markdown and publishes via YouMind proxy.
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { adaptForWordPress } from './content-adapter.js';
import {
  createPost,
  loadWordPressConfig,
  uploadMedia,
  type WordPressConfig,
  type WPPostStatus,
} from './wordpress-api.js';

export interface PublishOptions {
  /** Path to Markdown file, or raw Markdown string */
  input: string;
  /** Whether input is a file path (true) or raw Markdown (false) */
  isFile?: boolean;
  status?: WPPostStatus;
  /** Tag names — server resolves and auto-creates missing */
  tags?: string[];
  /** Category names — server resolves; errors if missing */
  categories?: string[];
  /** Local file path of featured image — uploaded then attached */
  featuredImage?: string;
  featuredImageAlt?: string;
  featuredImageCaption?: string;
  excerpt?: string;
  /** Override title */
  title?: string;
  slug?: string;
  date?: string;
  format?: 'standard' | 'aside' | 'chat' | 'gallery' | 'link' | 'image' | 'quote' | 'status' | 'video' | 'audio';
  config?: WordPressConfig;
}

export interface PublishResult {
  id: number;
  url: string;
  adminUrl?: string | null;
  slug: string;
  status: string;
  title: string;
  excerpt: string;
}

export async function publish(options: PublishOptions): Promise<PublishResult> {
  const config = options.config ?? loadWordPressConfig();
  if (!config.apiKey) {
    throw new Error('youmind.api_key not set. Configure ~/.youmind/config.yaml.');
  }

  let markdown: string;
  const resolvedInputPath = resolve(options.input);
  const inputPath =
    options.isFile !== false && existsSync(resolvedInputPath) ? resolvedInputPath : undefined;
  const inputDir = inputPath ? dirname(inputPath) : process.cwd();

  if (inputPath) {
    markdown = readFileSync(inputPath, 'utf-8');
  } else {
    markdown = options.input;
  }

  const adapted = adaptForWordPress({
    markdown,
    title: options.title,
    excerpt: options.excerpt,
    tags: options.tags,
    categories: options.categories,
    featuredImage: options.featuredImage,
    featuredImageAlt: options.featuredImageAlt,
    featuredImageCaption: options.featuredImageCaption,
    status: options.status,
    slug: options.slug,
    date: options.date,
    format: options.format,
  });

  let featuredMedia: number | undefined;
  let adaptedFeaturedImagePath: string | undefined;
  if (adapted.featuredImage) {
    adaptedFeaturedImagePath =
      adapted.featuredImage === options.featuredImage
        ? resolve(adapted.featuredImage)
        : resolve(inputDir, adapted.featuredImage);
  }

  if (adaptedFeaturedImagePath && existsSync(adaptedFeaturedImagePath)) {
    try {
      const media = await uploadMedia(config, {
        filePath: adaptedFeaturedImagePath,
        altText: adapted.featuredImageAlt,
        caption: adapted.featuredImageCaption,
      });
      featuredMedia = media.id;
      console.log(`Featured image uploaded: ID=${media.id}, URL=${media.sourceUrl}`);
    } catch (e) {
      console.error(`Failed to upload featured image: ${(e as Error).message}`);
      console.error('Continuing without featured image...');
    }
  }

  const post = await createPost(config, {
    title: adapted.title,
    content: adapted.html,
    excerpt: adapted.excerpt,
    status: adapted.status ?? 'draft',
    tags: adapted.tags,
    categories: adapted.categories,
    featuredMedia,
    slug: adapted.slug,
    date: adapted.date,
    format: adapted.format,
  });

  return {
    id: post.id,
    url: post.link,
    adminUrl: post.adminUrl,
    slug: post.slug,
    status: post.status,
    title: post.title || adapted.title,
    excerpt: adapted.excerpt,
  };
}
