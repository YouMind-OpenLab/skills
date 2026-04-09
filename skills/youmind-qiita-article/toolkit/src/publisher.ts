/**
 * Qiita article publisher — high-level wrapper around qiita-api.
 */

import { createItem, type QiitaConfig, type QiitaItem, type QiitaTag } from './qiita-api.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PublishOptions {
  config: QiitaConfig;
  title: string;
  markdown: string;
  tags: QiitaTag[];
  private?: boolean;
  tweet?: boolean;
  slide?: boolean;
  organizationUrlName?: string | null;
}

export interface PublishResult {
  id: string;
  url: string;
  title: string;
  private: boolean;
}

// ---------------------------------------------------------------------------
// Publish
// ---------------------------------------------------------------------------

/**
 * Publish an article to Qiita.
 *
 * By default publishes as private (limited sharing).
 * Pass `private: false` to publish publicly.
 */
export async function publish(options: PublishOptions): Promise<PublishResult> {
  const {
    config,
    title,
    markdown,
    tags,
    private: isPrivate = true,
    tweet = false,
    slide = false,
    organizationUrlName,
  } = options;

  if (!config.apiKey) {
    throw new Error('youmind.api_key not set in config.yaml');
  }

  if (!title || !title.trim()) {
    throw new Error('Article title is required.');
  }

  if (!markdown || !markdown.trim()) {
    throw new Error('Article markdown content is required.');
  }

  if (tags.length === 0) {
    throw new Error('At least one tag is required for Qiita articles.');
  }

  const item: QiitaItem = await createItem(config, {
    title: title.trim(),
    body: markdown,
    tags,
    private: isPrivate,
    tweet,
    slide,
    organization_url_name: organizationUrlName ?? null,
  });

  return {
    id: item.id,
    url: item.url,
    title: item.title,
    private: item.private,
  };
}
