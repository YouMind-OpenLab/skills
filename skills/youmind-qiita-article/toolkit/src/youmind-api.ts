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
 *   npx tsx src/youmind-api.ts mine-topics "AI,産品設計" --board <board_id> --top-k 5
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

function loadCentralCredentials(): Record<string, unknown> {
  const home = process.env.HOME || process.env.USERPROFILE || '';
  const p = resolve(home, '.youmind-skill', 'credentials.yaml');
  if (existsSync(p)) {
    return parseYaml(readFileSync(p, 'utf-8')) ?? {};
  }
  return {};
}

function loadLocalConfig(): Record<string, unknown> {
  for (const name of ['config.yaml', 'config.example.yaml']) {
    const p = resolve(PROJECT_DIR, name);
    if (existsSync(p)) {
      return parseYaml(readFileSync(p, 'utf-8')) ?? {};
    }
  }
  return {};
}

function loadConfig(): YouMindConfig {
  const central = loadCentralCredentials();
  const local = loadLocalConfig();
  const ym = { ...(central.youmind as Record<string, unknown> ?? {}), ...(local.youmind as Record<string, unknown> ?? {}) };
  for (const [k, v] of Object.entries(ym)) {
    if (v === '' && (central.youmind as Record<string, unknown>)?.[k]) {
      ym[k] = (central.youmind as Record<string, unknown>)[k];
    }
  }
  const imgYm = (local as any).image?.providers?.youmind ?? {};
  return {
    apiKey: (ym.api_key as string) || (imgYm.api_key as string) || '',
    baseUrl: (ym.base_url as string) || YOUMIND_OPENAPI_BASE_URLS[0],
  };
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
    throw new Error('YouMind API key not configured. Set youmind.api_key in config.yaml.');
  }

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
        signal: AbortSignal.timeout(endpoint.includes('Chat') || endpoint.includes('Message') ? 120_000 : 15_000),
      });

      if (!resp.ok) {
        const text = await resp.text().catch(() => '');
        throw new Error(`YouMind API ${endpoint} failed (${resp.status}): ${text.slice(0, 300)}`);
      }

      return resp.json() as Promise<T>;
    } catch (e) {
      lastError = e as Error;
      if (base !== baseUrls[baseUrls.length - 1]) {
        console.error(`[WARN] ${base}${endpoint} failed: ${(e as Error).message?.slice(0, 100)}, trying fallback...`);
      }
    }
  }

  throw lastError ?? new Error(`YouMind API ${endpoint} all endpoints failed`);
}

// ---------------------------------------------------------------------------
// Public API — Search
// ---------------------------------------------------------------------------

export interface SearchResult {
  entity_id?: string;
  entity_type?: string;
  metadata?: { title?: string; content?: string; [k: string]: unknown };
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

export async function mineTopics(opts: MineTopicsOptions, config?: YouMindConfig): Promise<MinedContent[]> {
  const cfg = config ?? loadConfig();
  const results: MinedContent[] = [];
  const seenIds = new Set<string>();
  const topK = opts.topK ?? 5;

  const searchPromises = opts.topics.map(topic =>
    search({ query: topic, topK, filterTypes: ['article', 'note', 'page'] }, cfg)
      .catch(e => { console.error(`Search "${topic}" failed:`, e.message); return null; })
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
        title: item.title ?? '(untitled)',
        snippet: String(item.content ?? '').slice(0, 300),
        relevance: item.score,
        updatedAt: item.updated_at as string | undefined,
      });
    }
  }

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
          title: item.title ?? '(untitled)',
          snippet: String(item.content ?? '').slice(0, 300),
          updatedAt: item.updated_at as string | undefined,
        });
      }
    }
  }

  return results;
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
  mine-topics "topic1,topic2" [--board <id>] [--top-k N]`);
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
      if (!query) { console.error('Missing query argument'); process.exit(1); }
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
      if (!query) { console.error('Missing query argument'); process.exit(1); }
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
      if (!boardId) { console.error('Missing board_id argument'); process.exit(1); }
      output(await listMaterials(boardId));
      break;
    }

    case 'list-crafts': {
      const boardId = args[1];
      if (!boardId) { console.error('Missing board_id argument'); process.exit(1); }
      output(await listCrafts(boardId));
      break;
    }

    case 'get-material': {
      const id = args[1];
      if (!id) { console.error('Missing id argument'); process.exit(1); }
      output(await getMaterial(id));
      break;
    }

    case 'get-craft': {
      const id = args[1];
      if (!id) { console.error('Missing id argument'); process.exit(1); }
      output(await getCraft(id));
      break;
    }

    case 'save-article': {
      const boardId = args[1];
      const title = getArg('--title');
      const file = getArg('--file');
      if (!boardId || !title || !file) {
        console.error('Usage: save-article <board_id> --title "..." --file article.md');
        process.exit(1);
      }
      const content = readFileSync(resolve(process.cwd(), file), 'utf-8');
      output(await saveArticle(boardId, title, content));
      break;
    }

    case 'mine-topics': {
      const topicsStr = args[1];
      if (!topicsStr) { console.error('Missing topics argument (comma-separated)'); process.exit(1); }
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

    default:
      console.error(`Unknown command: ${command}`);
      process.exit(1);
  }
}

const isMain = process.argv[1]?.endsWith('youmind-api.ts') ||
  process.argv[1]?.endsWith('youmind-api.js');
if (isMain) {
  cli().catch(e => { console.error(e.message); process.exit(1); });
}
