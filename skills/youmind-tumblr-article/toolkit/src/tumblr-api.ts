/**
 * Tumblr client via YouMind OpenAPI (aggregated publishing endpoints).
 *
 * 后端统一在 /openapi/v1/publishing/<op>，platform=tumblr 通过 discriminated union 区分。
 * 所有响应统一为 { platform, data }，本层自动解嵌套返回 data。
 *
 * 端点契约（apps/youapi spec 016 v2）：
 *   POST /openapi/v1/publishing/createPost      body: { platform:'tumblr', post: UnifiedPost }
 *   POST /openapi/v1/publishing/deletePost      body: { platform:'tumblr', postId }
 *   POST /openapi/v1/publishing/listPosts       body: { platform:'tumblr', filter: { state, blogIdentifier, paging } }
 *   POST /openapi/v1/publishing/listEngagement  body: { platform:'tumblr', filter: { postId, kind } }
 *   POST /openapi/v1/publishing/listSocial      body: { platform:'tumblr', kind: 'follower'|'activity' }
 *   POST /openapi/v1/publishing/manageQueue     body: { platform:'tumblr', action: 'reorder'|'shuffle', postId?, afterPostId? }
 *   POST /openapi/v1/publishing/getInsights     body: { platform:'tumblr', scope: 'account' }
 */
import { loadYouMindConfig, YOUMIND_CONFIG_ERROR_HINT } from './config.js';

export interface TumblrConfig {
  apiKey: string;
  baseUrl: string;
}

export type TumblrPostState = 'published' | 'draft' | 'queue' | 'private';
export type TumblrListState = 'published' | 'draft' | 'queue' | 'submission';
export type TumblrNotesMode =
  | 'all'
  | 'likes'
  | 'conversation'
  | 'rollup'
  | 'reblogs_with_tags';

export interface CreateTumblrPostOptions {
  title: string;
  content: string;
  tags?: string[];
  coverImageUrl?: string;
  blogIdentifier?: string;
  state?: TumblrPostState;
  publishOn?: string;
  date?: string;
  slug?: string;
}

export interface CreateTumblrPhotoPostOptions {
  sourceUrl: string;
  caption?: string;
  link?: string;
  tags?: string[];
  blogIdentifier?: string;
  state?: TumblrPostState;
  publishOn?: string;
  date?: string;
  slug?: string;
}

export interface TumblrPost {
  postId: string;
  blogIdentifier: string;
  title: string;
  url?: string;
  state?: string;
}

export interface TumblrPhotoPost {
  postId: string;
  blogIdentifier: string;
  url?: string;
  caption?: string;
  state?: string;
}

export interface TumblrPostListItem {
  postId: string;
  title: string;
  summary?: string;
  url: string;
  state: string;
  slug?: string;
  tags: string[];
  date?: string;
  noteCount?: number;
}

export interface TumblrPostList {
  blogIdentifier: string;
  state: TumblrListState;
  limit: number;
  offset: number;
  totalPosts?: number;
  posts: TumblrPostListItem[];
}

export interface TumblrNote {
  type: string;
  timestamp: number;
  blogName?: string;
  blogUrl?: string;
  followed?: boolean;
  postId?: string;
  bodyText?: string;
  tags: string[];
  details: Record<string, unknown>;
}

export interface TumblrNoteList {
  blogIdentifier: string;
  postId: string;
  mode: TumblrNotesMode;
  totalNotes?: number;
  totalLikes?: number;
  totalReblogs?: number;
  nextBeforeTimestamp?: number;
  notes: TumblrNote[];
  rollupNotes: TumblrNote[];
}

export interface TumblrNotification {
  id?: string;
  type: string;
  timestamp?: number;
  blogName?: string;
  blogUrl?: string;
  postId?: string;
  details: Record<string, unknown>;
}

export interface TumblrNotificationList {
  blogIdentifier: string;
  nextBefore?: number;
  notifications: TumblrNotification[];
}

export interface TumblrFollower {
  name: string;
  following?: boolean;
  url?: string;
  updated?: number;
}

export interface TumblrFollowerList {
  blogIdentifier: string;
  totalUsers?: number;
  limit: number;
  offset: number;
  users: TumblrFollower[];
}

export interface TumblrLimitItem {
  key: string;
  description?: string;
  limit?: number;
  remaining?: number;
  resetAt?: number;
}

export interface TumblrLimits {
  limits: TumblrLimitItem[];
}

export interface ListTumblrPostsOptions {
  state?: TumblrListState;
  blogIdentifier?: string;
  limit?: number;
  offset?: number;
  notesInfo?: boolean;
}

export interface ListTumblrNotesOptions {
  postId: string;
  blogIdentifier?: string;
  mode?: TumblrNotesMode;
  beforeTimestamp?: number;
}

export interface ListTumblrNotificationsOptions {
  blogIdentifier?: string;
  before?: number;
  types?: string[];
  rollups?: boolean;
  omitPostIds?: string[];
}

export interface ListTumblrFollowersOptions {
  blogIdentifier?: string;
  limit?: number;
  offset?: number;
}

export interface DeleteTumblrPostOptions {
  postId: string;
  blogIdentifier?: string;
}

export interface DeleteTumblrPostResult {
  ok: boolean;
  postId: string;
  blogIdentifier: string;
}

export interface ReorderTumblrQueueOptions {
  postId: string;
  insertAfter?: string;
  blogIdentifier?: string;
}

export interface ReorderTumblrQueueResult {
  ok: boolean;
  blogIdentifier: string;
  postId: string;
  insertAfter: string;
}

export interface ShuffleTumblrQueueOptions {
  blogIdentifier?: string;
}

export interface ShuffleTumblrQueueResult {
  ok: boolean;
  blogIdentifier: string;
}

interface OpenApiErrorDetail {
  connectUrl?: string;
  upgradeUrl?: string;
  hint?: string;
}

interface OpenApiErrorResponse {
  message?: string;
  code?: string;
  detail?: OpenApiErrorDetail;
}

export function loadTumblrConfig(): TumblrConfig {
  const { apiKey, baseUrl } = loadYouMindConfig();
  return { apiKey, baseUrl };
}

async function postJson<T = unknown>(
  endpoint: string,
  body: Record<string, unknown> = {},
  config?: TumblrConfig,
): Promise<T> {
  const cfg = config ?? loadTumblrConfig();
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
      `YouMind Tumblr API ${endpoint} failed (${response.status}): ${formatOpenApiError(parsed, text)}`,
    );
  }

  return response.json() as Promise<T>;
}

// 聚合层调用：包一层自动从 { platform, data } 解出 data，对外保持旧接口形状
async function callPublishing<T = unknown>(
  op: string,
  payload: Record<string, unknown>,
  config?: TumblrConfig,
): Promise<T> {
  const wrapped = await postJson<{ platform: string; data: T }>(
    `/publishing/${op}`,
    payload,
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
    parts.push(`Connect Tumblr: ${parsed.detail.connectUrl}`);
  }

  if (parsed.detail?.upgradeUrl) {
    parts.push(`Upgrade plan: ${parsed.detail.upgradeUrl}`);
  }

  return parts.join(' | ') || rawText.slice(0, 300);
}

// Tumblr 旧 state ('queue') → 统一 PostState ('queued')，其余原样下放
function toUnifiedPostState(state?: TumblrPostState): string | undefined {
  if (!state) return undefined;
  return state === 'queue' ? 'queued' : state;
}

// listPosts 的 state 多了 'submission'；保持透传，后端不识别会自然 422
function toUnifiedListState(state?: TumblrListState): string | undefined {
  if (!state) return undefined;
  return state === 'queue' ? 'queued' : state;
}

function normalizePost(raw: Record<string, unknown>): TumblrPost {
  return {
    postId: String(raw.postId ?? raw.post_id ?? ''),
    blogIdentifier: String(raw.blogIdentifier ?? raw.blog_identifier ?? ''),
    title: String(raw.title ?? ''),
    url: typeof raw.url === 'string' ? raw.url : undefined,
    state: typeof raw.state === 'string' ? raw.state : undefined,
  };
}

function normalizePhotoPost(raw: Record<string, unknown>): TumblrPhotoPost {
  return {
    postId: String(raw.postId ?? raw.post_id ?? ''),
    blogIdentifier: String(raw.blogIdentifier ?? raw.blog_identifier ?? ''),
    url: typeof raw.url === 'string' ? raw.url : undefined,
    caption: typeof raw.caption === 'string' ? raw.caption : undefined,
    state: typeof raw.state === 'string' ? raw.state : undefined,
  };
}

function normalizeListItem(raw: Record<string, unknown>): TumblrPostListItem {
  return {
    postId: String(raw.postId ?? raw.post_id ?? ''),
    title: String(raw.title ?? ''),
    summary: typeof raw.summary === 'string' ? raw.summary : undefined,
    url: String(raw.url ?? ''),
    state: String(raw.state ?? ''),
    slug: typeof raw.slug === 'string' ? raw.slug : undefined,
    tags: Array.isArray(raw.tags)
      ? raw.tags.filter((item): item is string => typeof item === 'string')
      : [],
    date: typeof raw.date === 'string' ? raw.date : undefined,
    noteCount: typeof raw.noteCount === 'number' ? raw.noteCount : undefined,
  };
}

function normalizePostList(raw: Record<string, unknown>): TumblrPostList {
  return {
    blogIdentifier: String(raw.blogIdentifier ?? raw.blog_identifier ?? ''),
    state: String(raw.state ?? 'published') as TumblrListState,
    limit: Number(raw.limit ?? 20),
    offset: Number(raw.offset ?? 0),
    totalPosts: typeof raw.totalPosts === 'number' ? raw.totalPosts : undefined,
    posts: Array.isArray(raw.posts)
      ? raw.posts
          .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
          .map(normalizeListItem)
      : [],
  };
}

function normalizeNote(raw: Record<string, unknown>): TumblrNote {
  return {
    type: String(raw.type ?? ''),
    timestamp: Number(raw.timestamp ?? 0),
    blogName: typeof raw.blogName === 'string' ? raw.blogName : undefined,
    blogUrl: typeof raw.blogUrl === 'string' ? raw.blogUrl : undefined,
    followed: typeof raw.followed === 'boolean' ? raw.followed : undefined,
    postId: typeof raw.postId === 'string' ? raw.postId : undefined,
    bodyText: typeof raw.bodyText === 'string' ? raw.bodyText : undefined,
    tags: Array.isArray(raw.tags)
      ? raw.tags.filter((item): item is string => typeof item === 'string')
      : [],
    details:
      typeof raw.details === 'object' && raw.details !== null
        ? (raw.details as Record<string, unknown>)
        : {},
  };
}

function normalizeNotes(raw: Record<string, unknown>): TumblrNoteList {
  return {
    blogIdentifier: String(raw.blogIdentifier ?? raw.blog_identifier ?? ''),
    postId: String(raw.postId ?? raw.post_id ?? ''),
    mode: String(raw.mode ?? 'all') as TumblrNotesMode,
    totalNotes: typeof raw.totalNotes === 'number' ? raw.totalNotes : undefined,
    totalLikes: typeof raw.totalLikes === 'number' ? raw.totalLikes : undefined,
    totalReblogs: typeof raw.totalReblogs === 'number' ? raw.totalReblogs : undefined,
    nextBeforeTimestamp:
      typeof raw.nextBeforeTimestamp === 'number' ? raw.nextBeforeTimestamp : undefined,
    notes: Array.isArray(raw.notes)
      ? raw.notes
          .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
          .map(normalizeNote)
      : [],
    rollupNotes: Array.isArray(raw.rollupNotes)
      ? raw.rollupNotes
          .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
          .map(normalizeNote)
      : [],
  };
}

function normalizeNotification(raw: Record<string, unknown>): TumblrNotification {
  return {
    id: typeof raw.id === 'string' ? raw.id : undefined,
    type: String(raw.type ?? ''),
    timestamp: typeof raw.timestamp === 'number' ? raw.timestamp : undefined,
    blogName: typeof raw.blogName === 'string' ? raw.blogName : undefined,
    blogUrl: typeof raw.blogUrl === 'string' ? raw.blogUrl : undefined,
    postId: typeof raw.postId === 'string' ? raw.postId : undefined,
    details:
      typeof raw.details === 'object' && raw.details !== null
        ? (raw.details as Record<string, unknown>)
        : {},
  };
}

function normalizeNotifications(raw: Record<string, unknown>): TumblrNotificationList {
  return {
    blogIdentifier: String(raw.blogIdentifier ?? raw.blog_identifier ?? ''),
    nextBefore: typeof raw.nextBefore === 'number' ? raw.nextBefore : undefined,
    notifications: Array.isArray(raw.notifications)
      ? raw.notifications
          .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
          .map(normalizeNotification)
      : [],
  };
}

function normalizeFollower(raw: Record<string, unknown>): TumblrFollower {
  return {
    name: String(raw.name ?? ''),
    following: typeof raw.following === 'boolean' ? raw.following : undefined,
    url: typeof raw.url === 'string' ? raw.url : undefined,
    updated: typeof raw.updated === 'number' ? raw.updated : undefined,
  };
}

function normalizeFollowers(raw: Record<string, unknown>): TumblrFollowerList {
  return {
    blogIdentifier: String(raw.blogIdentifier ?? raw.blog_identifier ?? ''),
    totalUsers: typeof raw.totalUsers === 'number' ? raw.totalUsers : undefined,
    limit: Number(raw.limit ?? 20),
    offset: Number(raw.offset ?? 0),
    users: Array.isArray(raw.users)
      ? raw.users
          .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
          .map(normalizeFollower)
      : [],
  };
}

function normalizeLimits(raw: Record<string, unknown>): TumblrLimits {
  return {
    limits: Array.isArray(raw.limits)
      ? raw.limits
          .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
          .map((item) => ({
            key: String(item.key ?? ''),
            description: typeof item.description === 'string' ? item.description : undefined,
            limit: typeof item.limit === 'number' ? item.limit : undefined,
            remaining: typeof item.remaining === 'number' ? item.remaining : undefined,
            resetAt: typeof item.resetAt === 'number' ? item.resetAt : undefined,
          }))
      : [],
  };
}

export async function createTumblrPost(
  config: TumblrConfig,
  options: CreateTumblrPostOptions,
): Promise<TumblrPost> {
  // Article 内容是 HTML 富文本（content-adapter 输出），后端 adapter 直接下放给 Tumblr API
  const post: Record<string, unknown> = {
    postType: 'text',
    title: options.title,
    content: { format: 'html', body: options.content },
  };
  if (options.tags?.length) post.tags = options.tags;
  if (options.coverImageUrl) post.coverImageUrl = options.coverImageUrl;
  if (options.blogIdentifier) post.blogIdentifier = options.blogIdentifier;
  const state = toUnifiedPostState(options.state);
  if (state) post.state = state;
  if (options.publishOn) post.publishOn = options.publishOn;
  if (options.date) post.scheduledAt = options.date;
  if (options.slug) post.slug = options.slug;

  const data = await callPublishing<Record<string, unknown>>(
    'createPost',
    { platform: 'tumblr', post },
    config,
  );
  return normalizePost(data);
}

export async function createTumblrPhotoPost(
  config: TumblrConfig,
  options: CreateTumblrPhotoPostOptions,
): Promise<TumblrPhotoPost> {
  const post: Record<string, unknown> = {
    postType: 'photo',
    mediaUrls: [options.sourceUrl],
  };
  if (options.caption) post.content = { format: 'html', body: options.caption };
  if (options.link) post.canonicalUrl = options.link;
  if (options.tags?.length) post.tags = options.tags;
  if (options.blogIdentifier) post.blogIdentifier = options.blogIdentifier;
  const state = toUnifiedPostState(options.state);
  if (state) post.state = state;
  if (options.publishOn) post.publishOn = options.publishOn;
  if (options.date) post.scheduledAt = options.date;
  if (options.slug) post.slug = options.slug;

  const data = await callPublishing<Record<string, unknown>>(
    'createPost',
    { platform: 'tumblr', post },
    config,
  );
  return normalizePhotoPost(data);
}

export async function listTumblrPosts(
  config: TumblrConfig,
  options: ListTumblrPostsOptions = {},
): Promise<TumblrPostList> {
  const filter: Record<string, unknown> = {};
  const state = toUnifiedListState(options.state);
  if (state) filter.state = state;
  if (options.blogIdentifier) filter.blogIdentifier = options.blogIdentifier;

  const paging: Record<string, unknown> = {};
  if (typeof options.limit === 'number') paging.limit = options.limit;
  if (typeof options.offset === 'number') paging.offset = options.offset;
  if (Object.keys(paging).length > 0) filter.paging = paging;

  // notesInfo 通过 filter.paging 透传——adapter 会 spread 进 svc dto
  if (typeof options.notesInfo === 'boolean') paging.notesInfo = options.notesInfo;

  const payload: Record<string, unknown> = { platform: 'tumblr' };
  if (Object.keys(filter).length > 0) payload.filter = filter;

  const data = await callPublishing<Record<string, unknown>>('listPosts', payload, config);
  return normalizePostList(data);
}

export async function listTumblrNotes(
  config: TumblrConfig,
  options: ListTumblrNotesOptions,
): Promise<TumblrNoteList> {
  const filter: Record<string, unknown> = { postId: options.postId };
  if (options.mode) filter.kind = options.mode;
  if (options.blogIdentifier) filter.blogIdentifier = options.blogIdentifier;
  if (options.beforeTimestamp) filter.beforeTimestamp = options.beforeTimestamp;

  const data = await callPublishing<Record<string, unknown>>(
    'listEngagement',
    { platform: 'tumblr', filter },
    config,
  );
  return normalizeNotes(data);
}

export async function listTumblrNotifications(
  config: TumblrConfig,
  options: ListTumblrNotificationsOptions = {},
): Promise<TumblrNotificationList> {
  const payload: Record<string, unknown> = { platform: 'tumblr', kind: 'activity' };
  if (options.blogIdentifier) payload.blogIdentifier = options.blogIdentifier;
  if (options.before) payload.before = options.before;
  if (options.types) payload.types = options.types;
  if (typeof options.rollups === 'boolean') payload.rollups = options.rollups;
  if (options.omitPostIds) payload.omitPostIds = options.omitPostIds;

  const data = await callPublishing<Record<string, unknown>>('listSocial', payload, config);
  return normalizeNotifications(data);
}

export async function listTumblrFollowers(
  config: TumblrConfig,
  options: ListTumblrFollowersOptions = {},
): Promise<TumblrFollowerList> {
  const payload: Record<string, unknown> = { platform: 'tumblr', kind: 'follower' };
  if (options.blogIdentifier) payload.blogIdentifier = options.blogIdentifier;
  if (typeof options.limit === 'number') payload.limit = options.limit;
  if (typeof options.offset === 'number') payload.offset = options.offset;

  const data = await callPublishing<Record<string, unknown>>('listSocial', payload, config);
  return normalizeFollowers(data);
}

export async function getTumblrLimits(config: TumblrConfig): Promise<TumblrLimits> {
  const data = await callPublishing<Record<string, unknown>>(
    'getInsights',
    { platform: 'tumblr', scope: 'account' },
    config,
  );
  return normalizeLimits(data);
}

export async function reorderTumblrQueue(
  config: TumblrConfig,
  options: ReorderTumblrQueueOptions,
): Promise<ReorderTumblrQueueResult> {
  const payload: Record<string, unknown> = {
    platform: 'tumblr',
    action: 'reorder',
    postId: options.postId,
  };
  if (options.insertAfter) payload.afterPostId = options.insertAfter;
  if (options.blogIdentifier) payload.blogIdentifier = options.blogIdentifier;

  const data = await callPublishing<Record<string, unknown>>('manageQueue', payload, config);
  return {
    ok: Boolean(data.ok ?? true),
    blogIdentifier: String(data.blogIdentifier ?? data.blog_identifier ?? ''),
    postId: String(data.postId ?? data.post_id ?? options.postId),
    insertAfter: String(data.insertAfter ?? data.after_post_id ?? options.insertAfter ?? '0'),
  };
}

export async function shuffleTumblrQueue(
  config: TumblrConfig,
  options: ShuffleTumblrQueueOptions = {},
): Promise<ShuffleTumblrQueueResult> {
  const payload: Record<string, unknown> = { platform: 'tumblr', action: 'shuffle' };
  if (options.blogIdentifier) payload.blogIdentifier = options.blogIdentifier;

  const data = await callPublishing<Record<string, unknown>>('manageQueue', payload, config);
  return {
    ok: Boolean(data.ok ?? true),
    blogIdentifier: String(data.blogIdentifier ?? data.blog_identifier ?? ''),
  };
}

export async function deleteTumblrPost(
  config: TumblrConfig,
  options: DeleteTumblrPostOptions,
): Promise<DeleteTumblrPostResult> {
  const payload: Record<string, unknown> = { platform: 'tumblr', postId: options.postId };
  if (options.blogIdentifier) payload.blogIdentifier = options.blogIdentifier;

  const data = await callPublishing<Record<string, unknown>>('deletePost', payload, config);
  return {
    ok: Boolean(data.ok ?? true),
    postId: String(data.postId ?? data.post_id ?? options.postId),
    blogIdentifier: String(data.blogIdentifier ?? data.blog_identifier ?? ''),
  };
}
