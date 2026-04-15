/**
 * Qiita article publisher — high-level wrapper around qiita-api.
 */

import {
  createItem,
  type QiitaConfig,
  type QiitaItem,
  type QiitaTag,
  type QiitaTagInput,
} from './qiita-api.js';

export interface PublishOptions {
  config: QiitaConfig;
  title: string;
  markdown: string;
  tags: Array<QiitaTag | QiitaTagInput>;
  private?: boolean;
  tweet?: boolean;
  slide?: boolean;
}

export interface PublishResult {
  id: string;
  url: string;
  title: string;
  private: boolean;
}

/**
 * Publish an article to Qiita via YouMind OpenAPI.
 *
 * Defaults to public publication. Pass `private: true` for limited sharing.
 */
export async function publish(options: PublishOptions): Promise<PublishResult> {
  const {
    config,
    title,
    markdown,
    tags,
    private: isPrivate = false,
    tweet = false,
    slide = false,
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
  });

  return {
    id: item.id,
    url: item.url,
    title: item.title,
    private: item.private,
  };
}
