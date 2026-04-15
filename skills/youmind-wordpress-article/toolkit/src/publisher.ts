/**
 * WordPress publisher — converts Markdown and publishes via YouMind proxy.
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
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
  /** Override title */
  title?: string;
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
    throw new Error('youmind.api_key not set in config.yaml');
  }

  let markdown: string;
  if (options.isFile !== false && existsSync(resolve(options.input))) {
    markdown = readFileSync(resolve(options.input), 'utf-8');
  } else {
    markdown = options.input;
  }

  const adapted = adaptForWordPress({ markdown, title: options.title });

  let featuredMedia: number | undefined;
  if (options.featuredImage && existsSync(resolve(options.featuredImage))) {
    try {
      const media = await uploadMedia(config, { filePath: options.featuredImage });
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
    status: options.status ?? 'draft',
    tags: options.tags?.length ? options.tags : undefined,
    categories: options.categories?.length ? options.categories : undefined,
    featuredMedia,
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
