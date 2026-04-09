/**
 * Fetch WeChat article statistics and update history.yaml.
 *
 * ⚠️ MOCKED: this file currently talks to a mocked WeChat API (see
 * wechat-api.ts for the full swap-in plan). The stats fetch itself also
 * stays inside this file as a mock — `getArticleTotal()` returns an
 * empty list so the CLI still runs end-to-end without hitting WeChat's
 * real datacube endpoint. When YouMind ships the `/wechat/*` proxy,
 * replace `getArticleTotal()` below with a `fetch()` POST to
 * `https://youmind.com/openapi/v1/wechat/getarticletotal` using the
 * `x-api-key` header (same pattern as youmind-api.ts).
 *
 * Usage:
 *   npx tsx src/fetch-stats.ts --client demo --days 7
 *   npx tsx src/fetch-stats.ts --client demo --days 7 --token "ACCESS_TOKEN"
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import { getAccessToken } from './wechat-api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_DIR = resolve(__dirname, '../..');

// ---------------------------------------------------------------------------
// WeChat stats API — MOCKED
// ---------------------------------------------------------------------------

async function getArticleTotal(
  _token: string, _beginDate: string, _endDate: string,
): Promise<Record<string, unknown>[]> {
  // Mock: returns an empty stats list. The downstream matching loop simply
  // finds no updates, which is the graceful no-op behaviour we want until
  // the real YouMind `/wechat/getarticletotal` proxy ships.
  console.error('[INFO] fetch-stats is using a mocked WeChat datacube — returning empty stats');
  return [];
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  const get = (flag: string): string | undefined => {
    const i = args.indexOf(flag);
    return i >= 0 && i + 1 < args.length ? args[i + 1] : undefined;
  };

  const client = get('--client');
  const days = parseInt(get('--days') ?? '7', 10);
  let token = get('--token');

  if (!client) { console.error('需要 --client 参数'); process.exit(1); }

  const historyPath = resolve(PROJECT_DIR, 'clients', client, 'history.yaml');
  if (!existsSync(historyPath)) {
    console.error(`文件不存在: ${historyPath}`);
    process.exit(1);
  }

  const history: Record<string, unknown>[] =
    parseYaml(readFileSync(historyPath, 'utf-8')) ?? [];
  if (!Array.isArray(history)) {
    console.error('history.yaml 格式异常');
    process.exit(1);
  }

  // Get access token (mocked — youmind.api_key is the real credential now,
  // but the mock wechat-api ignores whatever we pass).
  if (!token) {
    const configPath = resolve(PROJECT_DIR, 'config.yaml');
    let youmindKey: string | undefined;
    if (existsSync(configPath)) {
      const cfg = parseYaml(readFileSync(configPath, 'utf-8')) ?? {};
      const youmind = (cfg as Record<string, unknown>).youmind as Record<string, string> | undefined;
      youmindKey = youmind?.api_key;
    }
    if (!youmindKey) {
      console.error('请提供 --token 或在 config.yaml 配置 youmind.api_key');
      process.exit(1);
    }
    token = await getAccessToken('', '');
  }

  const end = new Date();
  const begin = new Date(end.getTime() - days * 86400_000);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const beginStr = fmt(begin);
  const endStr = fmt(end);

  console.error(`[INFO] 正在获取 ${client} 的统计数据 (${beginStr} to ${endStr})...`);

  let stats: Record<string, unknown>[];
  try {
    stats = await getArticleTotal(token, beginStr, endStr);
  } catch (e) {
    console.error(`获取统计数据失败: ${e}`);
    process.exit(1);
  }

  // Match stats to history entries by title
  let updated = 0;
  for (const entry of history) {
    if (entry.stats != null) continue;
    for (const stat of stats) {
      const details = (stat as Record<string, unknown>).details;
      if (!Array.isArray(details)) continue;
      for (const d of details) {
        const detail = d as Record<string, unknown>;
        if (detail.title === entry.title) {
          entry.stats = {
            read_count: detail.int_page_read_count ?? 0,
            share_count: detail.share_count ?? 0,
            like_count: detail.like_count ?? 0,
          };
          updated++;
          break;
        }
      }
    }
  }

  if (updated > 0) {
    writeFileSync(historyPath, stringifyYaml(history), 'utf-8');
    console.error(`Updated ${updated} entries in history.yaml`);
  } else {
    console.error('No matching articles found to update.');
  }

  console.log(JSON.stringify({
    client,
    period: `${beginStr} to ${endStr}`,
    stats_fetched: stats.length,
    history_updated: updated,
  }, null, 2));
}

const isMain = process.argv[1]?.includes('fetch-stats');
if (isMain) main().catch(e => { console.error(e); process.exit(1); });
