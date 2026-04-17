/**
 * Beehiiv publisher: converts Markdown and publishes through YouMind OpenAPI.
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  createPost,
  loadBeehiivConfig,
  type BeehiivConfig,
} from './beehiiv-api.js';
import { adaptForBeehiiv } from './content-adapter.js';

export interface PublishOptions {
  input: string;
  isFile?: boolean;
  status?: 'draft' | 'confirmed';
  scheduledAt?: string;
  contentTags?: string[];
  thumbnailImageUrl?: string;
  title?: string;
  subtitle?: string;
  config?: BeehiivConfig;
}

export interface PublishResult {
  id: string;
  webUrl?: string;
  status: string;
  title: string;
  subtitle?: string;
  previewText: string;
}

export async function publish(options: PublishOptions): Promise<PublishResult> {
  const config = options.config ?? loadBeehiivConfig();

  if (!config.apiKey) {
    throw new Error('YouMind API key not set. Configure ~/.youmind/config.yaml.');
  }

  const markdown =
    options.isFile !== false && existsSync(resolve(options.input))
      ? readFileSync(resolve(options.input), 'utf-8')
      : options.input;

  const adapted = await adaptForBeehiiv({
    markdown,
    title: options.title,
    subtitle: options.subtitle,
    contentTags: options.contentTags,
    thumbnailImageUrl: options.thumbnailImageUrl,
  });

  const post = await createPost(config, {
    title: adapted.title,
    bodyContent: adapted.html,
    subtitle: adapted.subtitle,
    status: options.status ?? (options.scheduledAt ? 'confirmed' : 'draft'),
    scheduledAt: options.scheduledAt,
    contentTags: adapted.contentTags.length ? adapted.contentTags : undefined,
    thumbnailImageUrl: adapted.thumbnailImageUrl,
  });

  return {
    id: post.id,
    webUrl: post.webUrl,
    status: post.status,
    title: adapted.title,
    subtitle: adapted.subtitle,
    previewText: adapted.previewText,
  };
}
