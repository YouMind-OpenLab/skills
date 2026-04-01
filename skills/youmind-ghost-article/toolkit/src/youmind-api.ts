/**
 * YouMind OpenAPI client — knowledge mining, search, web search, and article archiving.
 *
 * Usage (CLI):
 *   npx tsx src/youmind-api.ts search "AI 大模型" --top-k 10
 *   npx tsx src/youmind-api.ts web-search "今日AI热点" --freshness day
 *   npx tsx src/youmind-api.ts list-boards
 *   npx tsx src/youmind-api.ts list-materials <board_id>
 *   npx tsx src/youmind-api.ts list-crafts <board_id>
 *   npx tsx src/youmind-api.ts get-material <id>
 *   npx tsx src/youmind-api.ts get-craft <id>
 *   npx tsx src/youmind-api.ts save-article <board_id> --title "..." --file article.md
 *   npx tsx src/youmind-api.ts mine-topics "AI,产品设计" --board <board_id> --top-k 5
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_DIR = resolve(__dirname, '../..');

interface YouMindConfig {
  apiKey: string;
  baseUrl: string;
}

const YOUMIND_OPENAPI_BASE_URLS = [
  'https://youmind.com/openapi/v1',
];

function loadConfig(): YouMindConfig {
  for (const name of ['config.yaml', 'config.example.yaml']) {
    const p = resolve(PROJECT_DIR, name);
    if (existsSync(p)) {
      const raw = parseYaml(readFileSync(p, 'utf-8')) ?? {};
      const ym = raw.youmind ?? {};
      // 兼容: 也从 image.providers.youmind 读取 api_key
      const imgYm = raw.image?.providers?.youmind ?? {};
      return {
        apiKey: ym.api_key || imgYm.api_key || '',
        baseUrl: ym.base_url || YOUMIND_OPENAPI_BASE_URLS[0],
      };
    }
  }
  return { apiKey: '', baseUrl: YOUMIND_OPENAPI_BASE_URLS[0] };
}

// ---------------------------------------------------------------------------
// HTTP helper
// ---------------------------------------------------------------------------

async function post<T = unknown>(
  endpoint: string,
  body: Record<string, unknown> = {},
  config?: YouMindConfig,
): Promise<T> {
  const cfg = config ?? loadConfig();
  if (!cfg.apiKey) {
    throw new Error('YouMind API key 未配置。请在 config.yaml 的 youmind.api_key 中设置。');
  }

  // 尝试配置的 baseUrl，失败后尝试备选地址
  const baseUrls = [cfg.baseUrl, ...YOUMIND_OPENAPI_BASE_URLS.filter(u => u !== cfg.baseUrl)];
  let lastError: Error | null = null;

  for (const base of baseUrls) {
    try {
      const url = `${base}${endpoint}`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': cfg.apiKey,
        },
        body: JSON.stringify(body),
        // createChat 需要等 AI 响应，给 120s；其他 API 15s 足够
        signal: AbortSignal.timeout(endpoint.includes('Chat') || endpoint.includes('Message') ? 120_000 : 15_000),
      });

      if (!resp.ok) {
        const text = await resp.text().catch(() => '');
        throw new Error(`YouMind API ${endpoint} 失败 (${resp.status}): ${text.slice(0, 300)}`);
      }

      return resp.json() as Promise<T>;
    } catch (e) {
      lastError = e as Error;
      if (base !== baseUrls[baseUrls.length - 1]) {
        console.error(`[WARN] ${base}${endpoint} 失败: ${(e as Error).message?.slice(0, 100)}, 尝试备选地址...`);
      }
    }
  }

  throw lastError ?? new Error(`YouMind API ${endpoint} 所有地址均失败`);
}

// ---------------------------------------------------------------------------
// Public API — Search
// ---------------------------------------------------------------------------

export interface SearchResult {
  entity_id?: string;
  entity_type?: string;
  metadata?: { title?: string; content?: string; [k: string]: unknown };
  // normalized fields (filled by search())
  id?: string;
  title?: string;
  content?: string;
  type?: string;
  score?: number;
  [key: string]: unknown;
}

export interface SearchResponse {
  results: SearchResult[];
  [key: string]: unknown;
}

export interface SearchOptions {
  query: string;
  topK?: number;
  filterTypes?: ('article' | 'note' | 'page')[];
  filterSourceIds?: string[];
  filterFields?: ('title' | 'content')[];
  filterUpdatedAt?: { from?: number; to?: number };
}

export async function search(opts: SearchOptions, config?: YouMindConfig): Promise<SearchResponse> {
  const body: Record<string, unknown> = { query: opts.query, scope: 'library' };
  if (opts.topK) body.top_k = opts.topK;
  if (opts.filterTypes) body.filter_types = opts.filterTypes;
  if (opts.filterSourceIds) body.filter_source_ids = opts.filterSourceIds;
  if (opts.filterFields) body.filter_fields = opts.filterFields;
  if (opts.filterUpdatedAt) body.filter_updated_at = opts.filterUpdatedAt;

  const raw = await post<SearchResponse>('/search', body, config);
  // Normalize: API returns entity_id/entity_type/metadata, map to flat fields
  if (raw.results) {
    for (const r of raw.results) {
      r.id = r.id ?? r.entity_id;
      r.type = r.type ?? r.entity_type;
      r.title = r.title ?? r.metadata?.title;
      r.content = r.content ?? r.metadata?.content;
    }
  }
  return raw;
}

// ---------------------------------------------------------------------------
// Public API — Web Search
// ---------------------------------------------------------------------------

export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
  date_published?: string | null;
  [key: string]: unknown;
}

export interface WebSearchResponse {
  results: WebSearchResult[];
  formatted_context?: string | null;
  total_results?: number | null;
  [key: string]: unknown;
}

export interface WebSearchOptions {
  query: string;
  freshness?: 'day' | 'week' | 'month' | 'year';
  includeDomains?: string[];
  excludeDomains?: string[];
}

export async function webSearch(opts: WebSearchOptions, config?: YouMindConfig): Promise<WebSearchResponse> {
  const body: Record<string, unknown> = { query: opts.query };
  if (opts.freshness) body.freshness = opts.freshness;
  if (opts.includeDomains) body.include_domains = opts.includeDomains;
  if (opts.excludeDomains) body.exclude_domains = opts.excludeDomains;
  return post<WebSearchResponse>('/webSearch', body, config);
}

// ---------------------------------------------------------------------------
// Public API — Boards
// ---------------------------------------------------------------------------

export interface Board {
  id: string;
  name: string;
  type?: string;
  count?: number;
  [key: string]: unknown;
}

export async function listBoards(config?: YouMindConfig): Promise<Board[]> {
  return post<Board[]>('/listBoards', {}, config);
}

export async function getBoard(id: string, config?: YouMindConfig): Promise<Board> {
  return post<Board>('/getBoard', { id }, config);
}

// ---------------------------------------------------------------------------
// Public API — Materials
// ---------------------------------------------------------------------------

export interface Material {
  id: string;
  title?: string;
  content?: string;
  type?: string;
  board_id?: string;
  url?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export async function listMaterials(boardId: string, groupId?: string, config?: YouMindConfig): Promise<Material[]> {
  const body: Record<string, unknown> = { board_id: boardId };
  if (groupId) body.group_id = groupId;
  return post<Material[]>('/listMaterials', body, config);
}

export async function getMaterial(id: string, config?: YouMindConfig): Promise<Material> {
  return post<Material>('/getMaterial', { id }, config);
}

// ---------------------------------------------------------------------------
// Public API — Crafts (Documents)
// ---------------------------------------------------------------------------

export interface Craft {
  id: string;
  title?: string;
  content?: string;
  type?: string;
  board_id?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export async function listCrafts(boardId: string, groupId?: string, config?: YouMindConfig): Promise<Craft[]> {
  const body: Record<string, unknown> = { board_id: boardId };
  if (groupId) body.group_id = groupId;
  return post<Craft[]>('/listCrafts', body, config);
}

export async function getCraft(id: string, config?: YouMindConfig): Promise<Craft> {
  return post<Craft>('/getCraft', { id }, config);
}

// ---------------------------------------------------------------------------
// Public API — Save article to YouMind
// ---------------------------------------------------------------------------

export interface SavedDocument {
  id: string;
  title: string;
  board_id: string;
  [key: string]: unknown;
}

export async function saveArticle(
  boardId: string,
  title: string,
  markdownContent: string,
  config?: YouMindConfig,
): Promise<SavedDocument> {
  return post<SavedDocument>('/createDocumentByMarkdown', {
    board_id: boardId,
    title,
    content: markdownContent,
  }, config);
}

// ---------------------------------------------------------------------------
// Public API — Knowledge Mining (composite)
// ---------------------------------------------------------------------------

export interface MinedContent {
  source: 'search' | 'material' | 'craft';
  id: string;
  title: string;
  snippet: string;
  relevance?: number;
  updatedAt?: string;
}

export interface MineTopicsOptions {
  topics: string[];
  boardIds?: string[];
  topK?: number;
}

/**
 * 从用户的 YouMind 知识库中挖掘与选题相关的素材。
 * 组合语义搜索 + board 浏览，返回去重后的相关内容摘要。
 */
export async function mineTopics(opts: MineTopicsOptions, config?: YouMindConfig): Promise<MinedContent[]> {
  const cfg = config ?? loadConfig();
  const results: MinedContent[] = [];
  const seenIds = new Set<string>();
  const topK = opts.topK ?? 5;

  // 1. 对每个 topic 做语义搜索
  const searchPromises = opts.topics.map(topic =>
    search({ query: topic, topK, filterTypes: ['article', 'note', 'page'] }, cfg)
      .catch(e => { console.error(`搜索 "${topic}" 失败:`, e.message); return null; })
  );

  const searchResults = await Promise.all(searchPromises);
  for (const res of searchResults) {
    if (!res?.results) continue;
    for (const item of res.results) {
      const id = item.id ?? '';
      if (!id || seenIds.has(id)) continue;
      seenIds.add(id);
      results.push({
        source: 'search',
        id,
        title: item.title ?? '(无标题)',
        snippet: String(item.content ?? '').slice(0, 300),
        relevance: item.score,
        updatedAt: item.updated_at as string | undefined,
      });
    }
  }

  // 2. 浏览指定 board 的最新内容
  if (opts.boardIds?.length) {
    const boardPromises = opts.boardIds.flatMap(bid => [
      listMaterials(bid, undefined, cfg).catch(() => [] as Material[]),
      listCrafts(bid, undefined, cfg).catch(() => [] as Craft[]),
    ]);

    const boardResults = await Promise.all(boardPromises);
    for (const items of boardResults) {
      if (!Array.isArray(items)) continue;
      for (const item of items.slice(0, 20)) {
        const id = item.id ?? '';
        if (!id || seenIds.has(id)) continue;
        seenIds.add(id);
        const isCraft = 'board_id' in item && ('type' in item && (item as Craft).type === 'page');
        results.push({
          source: isCraft ? 'craft' : 'material',
          id,
          title: item.title ?? '(无标题)',
          snippet: String(item.content ?? '').slice(0, 300),
          updatedAt: item.updated_at as string | undefined,
        });
      }
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// Public API — Chat-based Image Generation
// ---------------------------------------------------------------------------

export interface ChatImageResult {
  chatId: string;
  imageUrls: string[];
  text: string;
}

/**
 * 通过 YouMind Chat API (agent 模式) AI 生图。
 * 流程: createChat(agent) → agent 自动加载 imageGenerate 工具并生图
 *       → 轮询 listMessages 等待 cdn.gooo.ai 图片 URL 出现。
 */
export async function chatGenerateImage(
  prompt: string, config?: YouMindConfig,
): Promise<ChatImageResult> {
  const cfg = config ?? loadConfig();

  // Step 1: createChat 以 agent 模式启动
  const createResp = await post<Record<string, unknown>>('/createChat', {
    message: `请加载生图工具并生成一张图片：${prompt}`,
    message_mode: 'agent',
  }, cfg);

  const chatId = (createResp.id as string) ?? '';
  if (!chatId) throw new Error('createChat 未返回 chat_id');

  // 先检查 createChat 响应是否已经包含生成的图
  let imageUrls = extractImageUrls(createResp);
  if (imageUrls.length) {
    return { chatId, imageUrls, text: '' };
  }

  // Step 2: 轮询 listMessages 等待图片生成完成（最多 120 秒）
  const maxWait = 120_000;
  const interval = 3_000;
  const start = Date.now();

  while (Date.now() - start < maxWait) {
    await new Promise(r => setTimeout(r, interval));

    const msgResp = await post<Record<string, unknown>>('/listMessages', { chat_id: chatId }, cfg);
    imageUrls = extractImageUrls(msgResp);
    if (imageUrls.length) {
      return { chatId, imageUrls, text: '' };
    }

    // 检查 agent 是否已结束（所有 message status != pending）
    const messages = (msgResp.messages ?? []) as Record<string, unknown>[];
    const lastAst = [...messages].reverse().find(m => m.role === 'assistant');
    if (lastAst && lastAst.status === 'success') {
      // agent 已完成但没有生成图片
      break;
    }
  }

  throw new Error('YouMind AI 生图超时或未生成图片');
}

/** 从 chat 响应的所有 messages/blocks 中提取 AI 生成的图片 URL (cdn.gooo.ai) */
function extractImageUrls(resp: Record<string, unknown>): string[] {
  const urls: string[] = [];
  const seen = new Set<string>();
  const raw = JSON.stringify(resp);

  // 只匹配 cdn.gooo.ai 的 AI 生成图片，不要搜索来的图
  for (const m of raw.matchAll(/https?:\/\/cdn\.gooo\.ai\/gen-images\/[a-f0-9]+\.(?:jpg|jpeg|png|webp)/gi)) {
    if (!seen.has(m[0])) { seen.add(m[0]); urls.push(m[0]); }
  }

  return urls;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

async function cli() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === '--help') {
    console.log(`YouMind API CLI

Commands:
  search <query> [--top-k N] [--types article,note,page] [--board <id>]
  web-search <query> [--freshness day|week|month|year]
  list-boards
  list-materials <board_id>
  list-crafts <board_id>
  get-material <id>
  get-craft <id>
  save-article <board_id> --title "..." --file article.md
  mine-topics "topic1,topic2" [--board <id>] [--top-k N]
  generate-image "prompt description"`);
    return;
  }

  const getArg = (flag: string): string | undefined => {
    const i = args.indexOf(flag);
    return i >= 0 && i + 1 < args.length ? args[i + 1] : undefined;
  };

  const output = (data: unknown) => console.log(JSON.stringify(data, null, 2));

  switch (command) {
    case 'search': {
      const query = args[1];
      if (!query) { console.error('缺少 query 参数'); process.exit(1); }
      const topK = parseInt(getArg('--top-k') ?? '10', 10);
      const types = getArg('--types')?.split(',') as ('article' | 'note' | 'page')[] | undefined;
      const boardId = getArg('--board');
      const res = await search({
        query, topK, filterTypes: types,
        filterSourceIds: boardId ? [boardId] : undefined,
      });
      output(res);
      break;
    }

    case 'web-search': {
      const query = args[1];
      if (!query) { console.error('缺少 query 参数'); process.exit(1); }
      const freshness = getArg('--freshness') as WebSearchOptions['freshness'];
      const res = await webSearch({ query, freshness });
      output(res);
      break;
    }

    case 'list-boards': {
      output(await listBoards());
      break;
    }

    case 'list-materials': {
      const boardId = args[1];
      if (!boardId) { console.error('缺少 board_id 参数'); process.exit(1); }
      output(await listMaterials(boardId));
      break;
    }

    case 'list-crafts': {
      const boardId = args[1];
      if (!boardId) { console.error('缺少 board_id 参数'); process.exit(1); }
      output(await listCrafts(boardId));
      break;
    }

    case 'get-material': {
      const id = args[1];
      if (!id) { console.error('缺少 id 参数'); process.exit(1); }
      output(await getMaterial(id));
      break;
    }

    case 'get-craft': {
      const id = args[1];
      if (!id) { console.error('缺少 id 参数'); process.exit(1); }
      output(await getCraft(id));
      break;
    }

    case 'save-article': {
      const boardId = args[1];
      const title = getArg('--title');
      const file = getArg('--file');
      if (!boardId || !title || !file) {
        console.error('用法: save-article <board_id> --title "..." --file article.md');
        process.exit(1);
      }
      const content = readFileSync(resolve(process.cwd(), file), 'utf-8');
      output(await saveArticle(boardId, title, content));
      break;
    }

    case 'mine-topics': {
      const topicsStr = args[1];
      if (!topicsStr) { console.error('缺少 topics 参数 (逗号分隔)'); process.exit(1); }
      const topics = topicsStr.split(',').map(s => s.trim()).filter(Boolean);
      const boardId = getArg('--board');
      const topK = parseInt(getArg('--top-k') ?? '5', 10);
      const res = await mineTopics({
        topics,
        boardIds: boardId ? [boardId] : undefined,
        topK,
      });
      output(res);
      break;
    }

    case 'generate-image': {
      const prompt = args[1];
      if (!prompt) { console.error('缺少 prompt 参数'); process.exit(1); }
      const res = await chatGenerateImage(prompt);
      output(res);
      break;
    }

    default:
      console.error(`未知命令: ${command}`);
      process.exit(1);
  }
}

// Run CLI if invoked directly
const isMain = process.argv[1]?.endsWith('youmind-api.ts') ||
  process.argv[1]?.endsWith('youmind-api.js');
if (isMain) {
  cli().catch(e => { console.error(e.message); process.exit(1); });
}
