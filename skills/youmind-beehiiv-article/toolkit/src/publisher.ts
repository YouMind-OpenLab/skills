/**
 * Beehiiv publisher: converts Markdown and publishes through YouMind OpenAPI.
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  createPost,
  loadBeehiivConfig,
  type BeehiivPostEmailSettings,
  type BeehiivPostRecipients,
  type BeehiivPostSeoSettings,
  type BeehiivPostWebSettings,
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
  postTemplateId?: string;
  customLinkTrackingEnabled?: boolean;
  emailCaptureTypeOverride?: 'none' | 'gated' | 'popup';
  overrideScheduledAt?: string;
  socialShare?: 'comments_and_likes_only' | 'with_comments_and_likes' | 'top' | 'none';
  recipients?: BeehiivPostRecipients;
  emailSettings?: BeehiivPostEmailSettings;
  webSettings?: BeehiivPostWebSettings;
  seoSettings?: BeehiivPostSeoSettings;
  headers?: Record<string, string>;
  customFields?: Record<string, string>;
  newsletterListId?: string;
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
    postTemplateId: options.postTemplateId,
    status: options.status ?? (options.scheduledAt ? 'confirmed' : 'draft'),
    scheduledAt: options.scheduledAt,
    customLinkTrackingEnabled: options.customLinkTrackingEnabled,
    emailCaptureTypeOverride: options.emailCaptureTypeOverride,
    overrideScheduledAt: options.overrideScheduledAt,
    socialShare: options.socialShare,
    contentTags: adapted.contentTags.length ? adapted.contentTags : undefined,
    thumbnailImageUrl: adapted.thumbnailImageUrl,
    recipients: options.recipients,
    emailSettings: options.emailSettings,
    webSettings: options.webSettings,
    seoSettings: options.seoSettings,
    headers: options.headers,
    customFields: options.customFields,
    newsletterListId: options.newsletterListId,
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
