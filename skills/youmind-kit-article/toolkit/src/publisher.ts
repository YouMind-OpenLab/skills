/**
 * Kit publisher: converts Markdown and publishes through YouMind OpenAPI.
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  createBroadcast,
  loadKitConfig,
  type KitConfig,
} from './kit-api.js';
import { adaptForKit } from './content-adapter.js';

const KIT_CAMPAIGNS_URL = 'https://app.kit.com/campaigns';

export interface PublishOptions {
  input: string;
  isFile?: boolean;
  subject?: string;
  description?: string;
  previewText?: string;
  isPublic?: boolean;
  publishedAt?: string;
  sendAt?: string | null;
  thumbnailUrl?: string;
  thumbnailAlt?: string;
  emailTemplateId?: number;
  emailAddress?: string;
  subscriberFilter?: Record<string, unknown>[];
  config?: KitConfig;
}

export interface PublishResult {
  id: number;
  subject: string;
  publicUrl?: string | null;
  resultUrl: string;
  dashboardUrl?: string | null;
  message?: string;
  isPublic: boolean;
  previewText: string;
  publishedAt?: string | null;
  sendAt?: string | null;
}

export async function publish(options: PublishOptions): Promise<PublishResult> {
  const config = options.config ?? loadKitConfig();

  if (!config.apiKey) {
    throw new Error('YouMind API key not set. Configure ~/.youmind/config.yaml.');
  }

  const markdown =
    options.isFile !== false && existsSync(resolve(options.input))
      ? readFileSync(resolve(options.input), 'utf-8')
      : options.input;

  const adapted = await adaptForKit({
    markdown,
    subject: options.subject,
    description: options.description,
    previewText: options.previewText,
    thumbnailUrl: options.thumbnailUrl,
    thumbnailAlt: options.thumbnailAlt,
  });

  const broadcast = await createBroadcast(config, {
    subject: adapted.subject,
    content: adapted.html,
    description: adapted.description,
    previewText: adapted.previewText,
    isPublic: options.isPublic ?? true,
    publishedAt: options.publishedAt,
    sendAt: options.sendAt ?? null,
    thumbnailUrl: adapted.thumbnailUrl,
    thumbnailAlt: adapted.thumbnailAlt,
    emailTemplateId: options.emailTemplateId,
    emailAddress: options.emailAddress,
    subscriberFilter: options.subscriberFilter,
  });

  return {
    id: broadcast.id,
    subject: adapted.subject,
    publicUrl: broadcast.publicUrl,
    resultUrl: broadcast.publicUrl ?? KIT_CAMPAIGNS_URL,
    dashboardUrl: broadcast.publicUrl ? null : KIT_CAMPAIGNS_URL,
    message: broadcast.publicUrl
      ? undefined
      : `You can also inspect the broadcast in ${KIT_CAMPAIGNS_URL}.`,
    isPublic: broadcast.isPublic,
    previewText: adapted.previewText,
    publishedAt: broadcast.publishedAt,
    sendAt: broadcast.sendAt,
  };
}
