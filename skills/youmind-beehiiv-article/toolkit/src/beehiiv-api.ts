/**
 * Beehiiv client via YouMind OpenAPI (aggregated publishing endpoints).
 *
 * 后端把 publishing 收敛成 6 个 resource 端点（connections / posts / media /
 * engagement / taxonomy / insights），body 形如 { platform, action, [action]: {...} }，
 * platform=beehiiv 通过 discriminated union 区分；insights 无 action、payload 平铺。
 * 本层的 callPublishing 仍按旧 op 名调用，由 buildPublishingRequest 重塑路由与 body。
 * 所有响应统一为 { platform, data }，本层自动解嵌套返回 data。
 *
 * 关键映射：
 *   - post.content = { format: 'html', body: bodyContent }
 *   - tags 直传 post.tags（adapter 内会改名成 contentTags）
 *   - coverImageUrl → 由 adapter 映射到 thumbnailUrl
 *   - 其他平台特有字段（subtitle / status / scheduledAt / subjectLine / previewText / postTemplateId
 *     / recipients / emailSettings / webSettings / seoSettings / customLinkTrackingEnabled
 *     / emailCaptureTypeOverride / overrideScheduledAt / socialShare / headers / customFields
 *     / newsletterListId / blocks）走 post.extras
 *   - taxonomy 走 listTaxonomy { filter: { kind: 'template' } }
 *
 * 端点契约（apps/youapi spec 016 v2，6 个 resource 端点）：
 *   POST /openapi/v1/publishing/posts      { platform, action: 'create'|'update'|'get'|'list'|'delete'|..., [action]: {...} }
 *   POST /openapi/v1/publishing/connections{ platform, action: 'list'|'validate'|..., [action]?: {...} }
 *   POST /openapi/v1/publishing/taxonomy   { platform, action: 'list'|'upsert'|..., [action]: {...} }
 *   （media / engagement / insights 同理；insights 无 action、payload 平铺）
 *   beehiiv 用到的旧 op：createPost / updatePost / getPost / listPosts / deletePost
 *     / validateConnection / listTaxonomy —— 由 buildPublishingRequest 映射到上述端点。
 */

import { loadYouMindConfig, YOUMIND_CONFIG_ERROR_HINT } from './config.js';

export interface BeehiivConfig {
  apiKey: string;
  baseUrl: string;
}

export interface BeehiivPostRecipientsChannel {
  tierIds?: string[];
  includeSegmentIds?: string[];
  excludeSegmentIds?: string[];
}

export interface BeehiivPostRecipients {
  web?: BeehiivPostRecipientsChannel;
  email?: BeehiivPostRecipientsChannel;
}

export interface BeehiivPostEmailSettings {
  fromAddress?: string;
  customLiveUrl?: string;
  displayTitleInEmail?: boolean;
  displayBylineInEmail?: boolean;
  displaySubtitleInEmail?: boolean;
  emailHeaderEngagementButtons?: string;
  emailHeaderSocialShare?: string;
  emailPreviewText?: string;
  emailSubjectLine?: string;
}

export interface BeehiivPostWebSettings {
  displayThumbnailOnWeb?: boolean;
  hideFromFeed?: boolean;
  paywallBreakPriceId?: string;
  paywallId?: string;
  slug?: string;
}

export interface BeehiivPostSeoSettings {
  defaultDescription?: string;
  defaultTitle?: string;
  ogDescription?: string;
  ogTitle?: string;
  twitterDescription?: string;
  twitterTitle?: string;
}

export interface BeehiivPost {
  id: string;
  title: string;
  subtitle?: string;
  status: string;
  subjectLine?: string;
  previewText?: string;
  slug?: string;
  thumbnailUrl?: string;
  webUrl?: string;
  audience?: string;
  platform?: string;
  contentTags?: string[];
  hiddenFromFeed?: boolean;
  enforceGatedContent?: boolean;
  emailCapturePopup?: boolean;
  authors?: string[];
  created?: number;
  publishDate?: number;
  displayedDate?: number;
  metaDefaultDescription?: string;
  metaDefaultTitle?: string;
  newsletterListId?: string;
  content?: Record<string, unknown>;
  stats?: Record<string, unknown>;
}

export interface BeehiivPostTemplate {
  id: string;
  name: string;
}

export interface BeehiivPostListResponse {
  posts: BeehiivPost[];
  limit: number;
  page: number;
  totalResults: number;
  totalPages: number;
}

export interface BeehiivPostTemplateListResponse {
  templates: BeehiivPostTemplate[];
  limit: number;
  page: number;
  totalResults: number;
  totalPages: number;
}

export interface BeehiivConnectionResult {
  ok: boolean;
  message: string;
  workspaceId?: string;
  workspaceName?: string;
  publicationId?: string;
  publicationName?: string;
}

export interface CreateBeehiivPostOptions {
  title: string;
  bodyContent?: string;
  blocks?: Record<string, unknown>[];
  subtitle?: string;
  postTemplateId?: string;
  status?: 'draft' | 'confirmed';
  scheduledAt?: string;
  customLinkTrackingEnabled?: boolean;
  emailCaptureTypeOverride?: 'none' | 'gated' | 'popup';
  overrideScheduledAt?: string;
  socialShare?: 'comments_and_likes_only' | 'with_comments_and_likes' | 'top' | 'none';
  contentTags?: string[];
  thumbnailImageUrl?: string;
  recipients?: BeehiivPostRecipients;
  emailSettings?: BeehiivPostEmailSettings;
  webSettings?: BeehiivPostWebSettings;
  seoSettings?: BeehiivPostSeoSettings;
  headers?: Record<string, string>;
  customFields?: Record<string, string>;
  newsletterListId?: string;
}

export interface UpdateBeehiivPostOptions {
  bodyContent?: string;
  blocks?: Record<string, unknown>[];
  title?: string;
  subtitle?: string;
  scheduledAt?: string;
  customLinkTrackingEnabled?: boolean;
  emailCaptureTypeOverride?: 'none' | 'gated' | 'popup';
  overrideScheduledAt?: string;
  socialShare?: 'comments_and_likes_only' | 'with_comments_and_likes' | 'top' | 'none';
  contentTags?: string[];
  thumbnailImageUrl?: string;
  emailSettings?: BeehiivPostEmailSettings;
  webSettings?: BeehiivPostWebSettings;
  seoSettings?: BeehiivPostSeoSettings;
}

export interface ListBeehiivPostsOptions {
  page?: number;
  limit?: number;
  status?: 'draft' | 'confirmed' | 'archived' | 'all';
  audience?: 'free' | 'premium' | 'all';
  platform?: 'web' | 'email' | 'both' | 'all';
  contentTags?: string[];
  slugs?: string[];
  authors?: string[];
  premiumTiers?: string[];
  expand?: string[];
  orderBy?: 'created' | 'publish_date' | 'displayed_date' | 'publishDate' | 'displayedDate';
  direction?: 'asc' | 'desc';
  hiddenFromFeed?: 'all' | 'true' | 'false';
}

export interface ListBeehiivPostTemplatesOptions {
  page?: number;
  limit?: number;
  order?: 'asc' | 'desc';
  orderBy?: string;
}

interface OpenApiErrorDetail {
  connectUrl?: string;
  upgradeUrl?: string;
  hint?: string;
  upstreamMessage?: string;
  retryAfter?: string | null;
}

interface OpenApiErrorResponse {
  message?: string;
  code?: string;
  detail?: OpenApiErrorDetail;
}

export function loadBeehiivConfig(): BeehiivConfig {
  const { apiKey, baseUrl } = loadYouMindConfig();
  return { apiKey, baseUrl };
}

async function postJson<T = unknown>(
  endpoint: string,
  body: Record<string, unknown> = {},
  config?: BeehiivConfig,
): Promise<T> {
  const cfg = config ?? loadBeehiivConfig();
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
      `YouMind Beehiiv API ${endpoint} failed (${response.status}): ${formatOpenApiError(parsed, text)}`,
    );
  }

  return response.json() as Promise<T>;
}

// ─── 6-endpoint adapter: 后端把 26 个 publishing op 合并成 6 个 resource 端点 ───
// 每个端点 body = { platform, action, [actionKey]: <payload> }；insights 无 action（payload 平铺）。
const PUBLISHING_OP_MAP: Record<
  string,
  { route: string; action: string | null; key: string | null }
> = {
  // connections
  listConnections: { route: 'connections', action: 'list', key: 'list' },
  validateConnection: { route: 'connections', action: 'validate', key: null },
  disconnect: { route: 'connections', action: 'disconnect', key: 'disconnect' },
  authenticate: { route: 'connections', action: 'authenticate', key: 'authenticate' },
  getCredentials: { route: 'connections', action: 'getCredentials', key: null },
  // posts
  createPost: { route: 'posts', action: 'create', key: 'create' },
  updatePost: { route: 'posts', action: 'update', key: 'update' },
  getPost: { route: 'posts', action: 'get', key: 'get' },
  listPosts: { route: 'posts', action: 'list', key: 'list' },
  deletePost: { route: 'posts', action: 'delete', key: 'delete' },
  transitionPostState: { route: 'posts', action: 'transition', key: 'transition' },
  getPublishJob: { route: 'posts', action: 'getJob', key: 'getJob' },
  manageQueue: { route: 'posts', action: 'manageQueue', key: 'manageQueue' },
  // media
  uploadMedia: { route: 'media', action: 'upload', key: 'upload' },
  listMedia: { route: 'media', action: 'list', key: 'list' },
  deleteMedia: { route: 'media', action: 'delete', key: 'delete' },
  // engagement
  listEngagement: { route: 'engagement', action: 'list', key: 'list' },
  upsertEngagement: { route: 'engagement', action: 'upsert', key: 'upsert' },
  deleteEngagement: { route: 'engagement', action: 'delete', key: 'delete' },
  listSocial: { route: 'engagement', action: 'listSocial', key: 'listSocial' },
  setSocialAction: { route: 'engagement', action: 'setSocialAction', key: 'setSocialAction' },
  // taxonomy
  listTaxonomy: { route: 'taxonomy', action: 'list', key: 'list' },
  upsertTaxonomy: { route: 'taxonomy', action: 'upsert', key: 'upsert' },
  deleteTaxonomy: { route: 'taxonomy', action: 'delete', key: 'delete' },
  attachPostToTaxonomy: { route: 'taxonomy', action: 'attachPost', key: 'attachPost' },
  // insights（单操作，无 action 区分符）
  getInsights: { route: 'insights', action: null, key: null },
};

// 把旧的 { platform, ...payload } 调用重塑成新的 6-端点 body：{ platform, action, [key]: rest }。
function buildPublishingRequest(
  op: string,
  payload: Record<string, unknown>,
): { route: string; body: Record<string, unknown> } {
  const mapping = PUBLISHING_OP_MAP[op];
  if (!mapping) {
    throw new Error('Unknown publishing op: ' + op);
  }
  const { platform, ...rest } = payload;
  if (mapping.action === null) {
    // insights：scope / postId / dateRange 平铺，无 action
    return { route: mapping.route, body: { platform, ...rest } };
  }
  if (mapping.key === null) {
    // validate / getCredentials：仅需 platform + action，无 sub-payload
    return { route: mapping.route, body: { platform, action: mapping.action } };
  }
  return { route: mapping.route, body: { platform, action: mapping.action, [mapping.key]: rest } };
}

// 聚合层调用：包一层自动从 { platform, data } 解出 data，对外保持旧接口形状
async function callPublishing<T = unknown>(
  op: string,
  payload: Record<string, unknown>,
  config?: BeehiivConfig,
): Promise<T> {
  // 调用方已在 payload 内携带 platform（caller-includes），直接交给 adapter 重塑路由与 body
  const { route, body } = buildPublishingRequest(op, payload);
  const wrapped = await postJson<{ platform: string; data: T }>(
    `/publishing/${route}`,
    body,
    config,
  );
  return wrapped.data;
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
    parts.push(`Connect beehiiv: ${parsed.detail.connectUrl}`);
  }
  if (parsed.detail?.upgradeUrl) {
    parts.push(`Upgrade plan: ${parsed.detail.upgradeUrl}`);
  }
  if (parsed.detail?.upstreamMessage) {
    parts.push(`beehiiv said: ${parsed.detail.upstreamMessage}`);
  }
  if (parsed.detail?.retryAfter) {
    parts.push(`Retry-After: ${parsed.detail.retryAfter}`);
  }

  return parts.join(' | ') || rawText.slice(0, 300);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }
  const items = value.filter((item): item is string => typeof item === 'string');
  return items.length ? items : undefined;
}

function normalizePost(post: Record<string, unknown>): BeehiivPost {
  return {
    id: String(post.id ?? ''),
    title: String(post.title ?? ''),
    subtitle: (post.subtitle as string | undefined) ?? undefined,
    status: String(post.status ?? ''),
    subjectLine:
      (post.subjectLine as string | undefined) ??
      (post.subject_line as string | undefined),
    previewText:
      (post.previewText as string | undefined) ??
      (post.preview_text as string | undefined),
    slug: (post.slug as string | undefined) ?? undefined,
    thumbnailUrl:
      (post.thumbnailUrl as string | undefined) ??
      (post.thumbnail_image_url as string | undefined) ??
      (post.thumbnail_url as string | undefined),
    webUrl: (post.webUrl as string | undefined) ?? (post.web_url as string | undefined),
    audience: (post.audience as string | undefined) ?? undefined,
    platform: (post.platform as string | undefined) ?? undefined,
    contentTags: normalizeStringArray(post.contentTags) ?? normalizeStringArray(post.content_tags),
    hiddenFromFeed:
      typeof post.hiddenFromFeed === 'boolean'
        ? post.hiddenFromFeed
        : typeof post.hidden_from_feed === 'boolean'
          ? post.hidden_from_feed
          : undefined,
    enforceGatedContent:
      typeof post.enforceGatedContent === 'boolean'
        ? post.enforceGatedContent
        : typeof post.enforce_gated_content === 'boolean'
          ? post.enforce_gated_content
          : undefined,
    emailCapturePopup:
      typeof post.emailCapturePopup === 'boolean'
        ? post.emailCapturePopup
        : typeof post.email_capture_popup === 'boolean'
          ? post.email_capture_popup
          : undefined,
    authors: normalizeStringArray(post.authors),
    created: typeof post.created === 'number' ? post.created : undefined,
    publishDate:
      typeof post.publishDate === 'number'
        ? post.publishDate
        : typeof post.publish_date === 'number'
          ? post.publish_date
          : undefined,
    displayedDate:
      typeof post.displayedDate === 'number'
        ? post.displayedDate
        : typeof post.displayed_date === 'number'
          ? post.displayed_date
          : undefined,
    metaDefaultDescription:
      (post.metaDefaultDescription as string | undefined) ??
      (post.meta_default_description as string | undefined),
    metaDefaultTitle:
      (post.metaDefaultTitle as string | undefined) ??
      (post.meta_default_title as string | undefined),
    newsletterListId:
      (post.newsletterListId as string | undefined) ??
      (post.newsletter_list_id as string | undefined),
    content: isPlainObject(post.content) ? post.content : undefined,
    stats: isPlainObject(post.stats) ? post.stats : undefined,
  };
}

function normalizePostTemplate(template: Record<string, unknown>): BeehiivPostTemplate {
  return {
    id: String(template.id ?? ''),
    name: String(template.name ?? ''),
  };
}

// 把 SDK 旧的扁平 create options 折叠成聚合层 UnifiedPost
function toUnifiedCreatePost(options: CreateBeehiivPostOptions): Record<string, unknown> {
  const post: Record<string, unknown> = {
    title: options.title,
  };
  if (options.bodyContent !== undefined) {
    post.content = { format: 'html', body: options.bodyContent };
  }
  if (options.contentTags?.length) post.tags = options.contentTags;
  if (options.thumbnailImageUrl !== undefined) post.coverImageUrl = options.thumbnailImageUrl;
  if (options.scheduledAt !== undefined) post.scheduledAt = options.scheduledAt;
  if (options.status === 'draft') post.state = 'draft';
  else if (options.status === 'confirmed') post.state = 'published';

  // 平台特有字段进 extras——adapter 内的 toNative 会把它们展开回 native payload
  const extras: Record<string, unknown> = {};
  if (options.subtitle !== undefined) extras.subtitle = options.subtitle;
  if (options.postTemplateId !== undefined) extras.postTemplateId = options.postTemplateId;
  if (options.blocks !== undefined) extras.blocks = options.blocks;
  if (options.customLinkTrackingEnabled !== undefined) {
    extras.customLinkTrackingEnabled = options.customLinkTrackingEnabled;
  }
  if (options.emailCaptureTypeOverride !== undefined) {
    extras.emailCaptureTypeOverride = options.emailCaptureTypeOverride;
  }
  if (options.overrideScheduledAt !== undefined) extras.overrideScheduledAt = options.overrideScheduledAt;
  if (options.socialShare !== undefined) extras.socialShare = options.socialShare;
  if (options.recipients !== undefined) extras.recipients = options.recipients;
  if (options.emailSettings !== undefined) extras.emailSettings = options.emailSettings;
  if (options.webSettings !== undefined) extras.webSettings = options.webSettings;
  if (options.seoSettings !== undefined) extras.seoSettings = options.seoSettings;
  if (options.headers !== undefined) extras.headers = options.headers;
  if (options.customFields !== undefined) extras.customFields = options.customFields;
  if (options.newsletterListId !== undefined) extras.newsletterListId = options.newsletterListId;
  // status 同时也放 extras——某些 native 路径仍读 status 字段
  if (options.status !== undefined) extras.status = options.status;
  if (Object.keys(extras).length > 0) post.extras = extras;

  return post;
}

function toUnifiedUpdatePost(options: UpdateBeehiivPostOptions): Record<string, unknown> {
  const post: Record<string, unknown> = {};
  if (options.title !== undefined) post.title = options.title;
  if (options.bodyContent !== undefined) {
    post.content = { format: 'html', body: options.bodyContent };
  }
  if (options.contentTags !== undefined) post.tags = options.contentTags;
  if (options.thumbnailImageUrl !== undefined) post.coverImageUrl = options.thumbnailImageUrl;
  if (options.scheduledAt !== undefined) post.scheduledAt = options.scheduledAt;

  const extras: Record<string, unknown> = {};
  if (options.subtitle !== undefined) extras.subtitle = options.subtitle;
  if (options.blocks !== undefined) extras.blocks = options.blocks;
  if (options.customLinkTrackingEnabled !== undefined) {
    extras.customLinkTrackingEnabled = options.customLinkTrackingEnabled;
  }
  if (options.emailCaptureTypeOverride !== undefined) {
    extras.emailCaptureTypeOverride = options.emailCaptureTypeOverride;
  }
  if (options.overrideScheduledAt !== undefined) extras.overrideScheduledAt = options.overrideScheduledAt;
  if (options.socialShare !== undefined) extras.socialShare = options.socialShare;
  if (options.emailSettings !== undefined) extras.emailSettings = options.emailSettings;
  if (options.webSettings !== undefined) extras.webSettings = options.webSettings;
  if (options.seoSettings !== undefined) extras.seoSettings = options.seoSettings;
  if (Object.keys(extras).length > 0) post.extras = extras;

  return post;
}

export async function validateConnection(
  config?: BeehiivConfig,
): Promise<BeehiivConnectionResult> {
  return callPublishing<BeehiivConnectionResult>(
    'validateConnection',
    { platform: 'beehiiv' },
    config,
  );
}

export async function createPost(
  config: BeehiivConfig,
  options: CreateBeehiivPostOptions,
): Promise<BeehiivPost> {
  const data = await callPublishing<Record<string, unknown>>(
    'createPost',
    { platform: 'beehiiv', post: toUnifiedCreatePost(options) },
    config,
  );
  return normalizePost(data);
}

export async function updatePost(
  config: BeehiivConfig,
  id: string,
  options: UpdateBeehiivPostOptions,
): Promise<BeehiivPost> {
  const post = { postId: id, ...toUnifiedUpdatePost(options) };
  const data = await callPublishing<Record<string, unknown>>(
    'updatePost',
    { platform: 'beehiiv', post },
    config,
  );
  return normalizePost(data);
}

export async function getPost(config: BeehiivConfig, id: string): Promise<BeehiivPost> {
  const data = await callPublishing<Record<string, unknown>>(
    'getPost',
    { platform: 'beehiiv', postId: id },
    config,
  );
  return normalizePost(data);
}

export async function deletePost(
  config: BeehiivConfig,
  id: string,
): Promise<{ ok: boolean; id: string }> {
  const data = await callPublishing<Record<string, unknown>>(
    'deletePost',
    { platform: 'beehiiv', postId: id },
    config,
  );
  return {
    ok: Boolean(data.ok ?? true),
    id: String(data.id ?? id),
  };
}

export async function listPosts(
  config: BeehiivConfig,
  options: ListBeehiivPostsOptions = {},
): Promise<BeehiivPostListResponse> {
  const normalizedOrderBy =
    options.orderBy === 'publishDate'
      ? 'publish_date'
      : options.orderBy === 'displayedDate'
        ? 'displayed_date'
        : options.orderBy;

  // beehiiv adapter 只把 filter.paging 直传给底层 list 服务；
  // 所有 beehiiv 原生分页/过滤参数都打包进 paging
  const paging: Record<string, unknown> = {};
  if (options.page !== undefined) paging.page = options.page;
  if (options.limit !== undefined) paging.limit = options.limit;
  if (options.status) paging.status = options.status;
  if (options.audience) paging.audience = options.audience;
  if (options.platform) paging.platform = options.platform;
  if (options.contentTags?.length) paging.contentTags = options.contentTags;
  if (options.slugs?.length) paging.slugs = options.slugs;
  if (options.authors?.length) paging.authors = options.authors;
  if (options.premiumTiers?.length) paging.premiumTiers = options.premiumTiers;
  if (options.expand?.length) paging.expand = options.expand;
  if (normalizedOrderBy) paging.orderBy = normalizedOrderBy;
  if (options.direction) paging.direction = options.direction;
  if (options.hiddenFromFeed) paging.hiddenFromFeed = options.hiddenFromFeed;

  const data = await callPublishing<BeehiivPostListResponse>(
    'listPosts',
    { platform: 'beehiiv', filter: { paging } },
    config,
  );

  return {
    ...data,
    posts: (data.posts ?? []).map((post) =>
      normalizePost(post as unknown as Record<string, unknown>),
    ),
  };
}

export async function listPostTemplates(
  config: BeehiivConfig,
  options: ListBeehiivPostTemplatesOptions = {},
): Promise<BeehiivPostTemplateListResponse> {
  const paging: Record<string, unknown> = {};
  if (options.page !== undefined) paging.page = options.page;
  if (options.limit !== undefined) paging.limit = options.limit;
  if (options.order) paging.order = options.order;
  if (options.orderBy) paging.orderBy = options.orderBy;

  const data = await callPublishing<BeehiivPostTemplateListResponse>(
    'listTaxonomy',
    {
      platform: 'beehiiv',
      filter: { kind: 'template', paging },
    },
    config,
  );

  return {
    ...data,
    templates: (data.templates ?? []).map((template) =>
      normalizePostTemplate(template as unknown as Record<string, unknown>),
    ),
  };
}
