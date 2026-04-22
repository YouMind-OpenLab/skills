/**
 * Kit API client via YouMind OpenAPI.
 */

import { loadYouMindConfig, YOUMIND_CONFIG_ERROR_HINT } from './config.js';

export interface KitConfig {
  apiKey: string;
  baseUrl: string;
}

export interface KitEmailTemplate {
  id: number;
  name: string;
  isDefault?: boolean;
  category?: string;
}

export interface KitBroadcast {
  id: number;
  publicationId: number;
  createdAt: string;
  subject?: string | null;
  previewText?: string | null;
  description?: string | null;
  content?: string | null;
  isPublic: boolean;
  publishedAt?: string | null;
  sendAt?: string | null;
  thumbnailAlt?: string | null;
  thumbnailUrl?: string | null;
  publicUrl?: string | null;
  emailAddress?: string | null;
  emailTemplate?: KitEmailTemplate | null;
  subscriberFilter?: Record<string, unknown>[];
}

export interface KitPagination {
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  startCursor?: string | null;
  endCursor?: string | null;
  perPage: number;
  totalCount?: number;
}

export interface KitBroadcastListResponse {
  broadcasts: KitBroadcast[];
  pagination: KitPagination;
}

export interface KitConnectionResult {
  ok: boolean;
  message: string;
  accountId?: string;
  accountName?: string;
  planType?: string;
  primaryEmailAddress?: string;
  creatorProfileUrl?: string;
  imageUrl?: string;
}

export interface KitEmailTemplateListResponse {
  emailTemplates: KitEmailTemplate[];
  pagination: KitPagination;
}

export interface CreateKitBroadcastOptions {
  subject: string;
  content: string;
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
}

interface OpenApiErrorDetail {
  connectUrl?: string;
  upgradeUrl?: string;
  hint?: string;
  upstreamMessage?: string;
}

interface OpenApiErrorResponse {
  message?: string;
  code?: string;
  detail?: OpenApiErrorDetail;
}

export function loadKitConfig(): KitConfig {
  const { apiKey, baseUrl } = loadYouMindConfig();
  return { apiKey, baseUrl };
}

async function postJson<T = unknown>(
  endpoint: string,
  body: Record<string, unknown> = {},
  config?: KitConfig,
): Promise<T> {
  const cfg = config ?? loadKitConfig();
  if (!cfg.apiKey) {
    throw new Error(`YouMind API key not configured. ${YOUMIND_CONFIG_ERROR_HINT}`);
  }

  const response = await fetch(`${cfg.baseUrl}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': cfg.apiKey,
      'x-use-camel-case': 'true',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    const parsed = parseOpenApiError(text);
    throw new Error(
      `YouMind Kit API ${endpoint} failed (${response.status}): ${formatOpenApiError(parsed, text)}`,
    );
  }

  return response.json() as Promise<T>;
}

function parseOpenApiError(text: string): OpenApiErrorResponse | null {
  try {
    return JSON.parse(text) as OpenApiErrorResponse;
  } catch {
    return null;
  }
}

function formatOpenApiError(parsed: OpenApiErrorResponse | null, rawText: string): string {
  if (!parsed) {
    return rawText.slice(0, 300);
  }

  const parts = [parsed.message, parsed.code, parsed.detail?.hint].filter(
    (value): value is string => typeof value === 'string' && value.length > 0,
  );

  if (parsed.detail?.connectUrl) {
    parts.push(`Connect Kit: ${parsed.detail.connectUrl}`);
  }
  if (parsed.detail?.upgradeUrl) {
    parts.push(`Upgrade plan: ${parsed.detail.upgradeUrl}`);
  }
  if (parsed.detail?.upstreamMessage) {
    parts.push(`Kit said: ${parsed.detail.upstreamMessage}`);
  }

  return parts.join(' | ') || rawText.slice(0, 300);
}

function normalizeBroadcast(broadcast: Record<string, unknown>): KitBroadcast {
  const isPublic =
    typeof broadcast.isPublic === 'boolean'
      ? broadcast.isPublic
      : Boolean(broadcast.public);
  const publicUrl = normalizePublicUrl(
    (broadcast.publicUrl as string | null | undefined) ??
      (broadcast.public_url as string | null | undefined) ??
      null,
    isPublic,
  );

  const emailTemplateRaw = broadcast.emailTemplate ?? broadcast.email_template;

  return {
    id: Number(broadcast.id ?? 0),
    publicationId: Number(broadcast.publicationId ?? broadcast.publication_id ?? 0),
    createdAt: String(broadcast.createdAt ?? broadcast.created_at ?? ''),
    subject: (broadcast.subject as string | null | undefined) ?? null,
    previewText:
      (broadcast.previewText as string | null | undefined) ??
      (broadcast.preview_text as string | null | undefined) ??
      null,
    description: (broadcast.description as string | null | undefined) ?? null,
    content: (broadcast.content as string | null | undefined) ?? null,
    isPublic,
    publishedAt:
      (broadcast.publishedAt as string | null | undefined) ??
      (broadcast.published_at as string | null | undefined) ??
      null,
    sendAt:
      (broadcast.sendAt as string | null | undefined) ??
      (broadcast.send_at as string | null | undefined) ??
      null,
    thumbnailAlt:
      (broadcast.thumbnailAlt as string | null | undefined) ??
      (broadcast.thumbnail_alt as string | null | undefined) ??
      null,
    thumbnailUrl:
      (broadcast.thumbnailUrl as string | null | undefined) ??
      (broadcast.thumbnail_url as string | null | undefined) ??
      null,
    publicUrl,
    emailAddress:
      (broadcast.emailAddress as string | null | undefined) ??
      (broadcast.email_address as string | null | undefined) ??
      null,
    emailTemplate:
      emailTemplateRaw && typeof emailTemplateRaw === 'object'
        ? {
            id: Number((emailTemplateRaw as Record<string, unknown>).id ?? 0),
            name: String((emailTemplateRaw as Record<string, unknown>).name ?? ''),
          }
        : null,
    subscriberFilter: Array.isArray(broadcast.subscriberFilter)
      ? (broadcast.subscriberFilter as Record<string, unknown>[])
      : Array.isArray(broadcast.subscriber_filter)
        ? (broadcast.subscriber_filter as Record<string, unknown>[])
        : undefined,
  };
}

function normalizePublicUrl(value: string | null | undefined, isPublic: boolean): string | null {
  if (!isPublic || typeof value !== 'string' || value.trim().length === 0) {
    return null;
  }

  const trimmed = value.trim();
  if (/\/posts\/?$/.test(trimmed)) {
    return null;
  }

  return trimmed;
}

export async function validateConnection(config?: KitConfig): Promise<KitConnectionResult> {
  return postJson<KitConnectionResult>('/kit/validateConnection', {}, config);
}

export async function createBroadcast(
  config: KitConfig,
  options: CreateKitBroadcastOptions,
): Promise<KitBroadcast> {
  const broadcast = await postJson<Record<string, unknown>>(
    '/kit/createBroadcast',
    { ...options },
    config,
  );
  return normalizeBroadcast(broadcast);
}

export async function updateBroadcast(
  config: KitConfig,
  id: number,
  options: Partial<CreateKitBroadcastOptions>,
): Promise<KitBroadcast> {
  const broadcast = await postJson<Record<string, unknown>>(
    '/kit/updateBroadcast',
    { id, ...options },
    config,
  );
  return normalizeBroadcast(broadcast);
}

export async function getBroadcast(config: KitConfig, id: number): Promise<KitBroadcast> {
  const broadcast = await postJson<Record<string, unknown>>('/kit/getBroadcast', { id }, config);
  return normalizeBroadcast(broadcast);
}

export async function deleteBroadcast(
  config: KitConfig,
  id: number,
): Promise<{ ok: boolean; id: number }> {
  return postJson<{ ok: boolean; id: number }>('/kit/deleteBroadcast', { id }, config);
}

export async function listBroadcasts(
  config: KitConfig,
  params: {
    after?: string;
    before?: string;
    perPage?: number;
    includeTotalCount?: boolean;
  } = {},
): Promise<KitBroadcastListResponse> {
  const response = await postJson<KitBroadcastListResponse>(
    '/kit/listBroadcasts',
    params,
    config,
  );

  return {
    broadcasts: response.broadcasts.map((item) =>
      normalizeBroadcast(item as unknown as Record<string, unknown>),
    ),
    pagination: response.pagination,
  };
}

export async function listEmailTemplates(
  config: KitConfig,
  params: {
    after?: string;
    before?: string;
    perPage?: number;
    includeTotalCount?: boolean;
  } = {},
): Promise<KitEmailTemplateListResponse> {
  const response = await postJson<KitEmailTemplateListResponse>(
    '/kit/listEmailTemplates',
    params,
    config,
  );

  return {
    emailTemplates: response.emailTemplates.map((item) => ({
      id: Number(item.id ?? 0),
      name: String(item.name ?? ''),
      isDefault: Boolean(item.isDefault),
      category: typeof item.category === 'string' ? item.category : undefined,
    })),
    pagination: response.pagination,
  };
}
