/**
 * Hashnode article publisher — high-level wrapper around hashnode-api.
 */

import {
  createDraft,
  createPost,
  loadHashnodeConfig,
  type HashnodeConfig,
  type HashnodePost,
} from './hashnode-api.js';

export interface PublishOptions {
  title: string;
  markdown: string;
  status?: 'draft' | 'published';
  subtitle?: string;
  tags?: string[];
  coverImageUrl?: string;
  canonicalUrl?: string;
  seriesId?: string;
  slug?: string;
  publishedAt?: string;
  disableComments?: boolean;
  metaTitle?: string;
  metaDescription?: string;
  metaImage?: string;
  /** Optional pre-loaded config */
  config?: HashnodeConfig;
}

export interface PublishResult {
  id: string;
  status: 'draft' | 'published';
  title: string | null;
  url: string | null;
  dashboardUrl: string | null;
  slug: string;
  readTimeInMinutes: number;
}

export async function publish(options: PublishOptions): Promise<PublishResult> {
  const config = options.config ?? loadHashnodeConfig();

  if (!config.apiKey) {
    throw new Error('YouMind API key not configured. Set youmind.api_key in config.yaml.');
  }

  if (!options.title?.trim()) {
    throw new Error('Article title is required.');
  }

  if (!options.markdown?.trim()) {
    throw new Error('Article markdown content is required.');
  }

  const payload = {
    title: options.title.trim(),
    contentMarkdown: options.markdown,
    subtitle: options.subtitle?.trim() || undefined,
    tags: options.tags?.slice(0, 5),
    coverImageUrl: options.coverImageUrl,
    canonicalUrl: options.canonicalUrl,
    seriesId: options.seriesId,
    slug: options.slug,
    publishedAt: options.publishedAt,
    disableComments: options.disableComments,
    metaTitle: options.metaTitle,
    metaDescription: options.metaDescription,
    metaImage: options.metaImage,
  };

  const result: HashnodePost =
    (options.status ?? 'draft') === 'published'
      ? await createPost(config, payload)
      : await createDraft(config, payload);

  return {
    id: result.id,
    status: result.status,
    title: result.title,
    url: result.url,
    dashboardUrl: result.dashboardUrl,
    slug: result.slug,
    readTimeInMinutes: result.readTimeInMinutes,
  };
}
