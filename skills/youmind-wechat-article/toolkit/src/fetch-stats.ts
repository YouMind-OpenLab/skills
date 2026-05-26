/**
 * Fetch WeChat article statistics and update history.yaml.
 *
 * Calls YouMind's /wechat/getArticleStats proxy (which wraps WeChat's
 * /datacube/getarticletotal endpoint). The proxy holds the WeChat appid +
 * secret server-side and manages the access_token cache; the skill only
 * needs `youmind.api_key` in config.yaml.
 *
 * Usage:
 *   npx tsx src/fetch-stats.ts --client demo --days 7
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import { getArticleStats, type WeChatArticleStatsItem } from './wechat-api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_DIR = resolve(__dirname, '../..');

interface HistoryEntry {
  title?: string;
  stats?: { read_count: number; share_count: number; like_count?: number };
  [key: string]: unknown;
}

async function main() {
  const args = process.argv.slice(2);
  const get = (flag: string): string | undefined => {
    const i = args.indexOf(flag);
    return i >= 0 && i + 1 < args.length ? args[i + 1] : undefined;
  };

  const client = get('--client');
  const days = Number.parseInt(get('--days') ?? '7', 10);

  if (!client) {
    console.error('需要 --client 参数');
    process.exit(1);
  }

  const historyPath = resolve(PROJECT_DIR, 'clients', client, 'history.yaml');
  if (!existsSync(historyPath)) {
    console.error(`文件不存在: ${historyPath}`);
    process.exit(1);
  }

  const history: HistoryEntry[] = parseYaml(readFileSync(historyPath, 'utf-8')) ?? [];
  if (!Array.isArray(history)) {
    console.error('history.yaml 格式异常');
    process.exit(1);
  }

  const end = new Date();
  const begin = new Date(end.getTime() - days * 86_400_000);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const beginStr = fmt(begin);
  const endStr = fmt(end);

  console.error(
    `[INFO] 正在通过 YouMind /wechat/getArticleStats 获取 ${client} 的统计数据 (${beginStr} → ${endStr})...`,
  );

  // WeChat's datacube allows max 7 days per request. If the user asked for
  // more, fan out across windows and merge.
  let stats: WeChatArticleStatsItem[] = [];
  try {
    if (days <= 7) {
      stats = await getArticleStats(beginStr, endStr);
    } else {
      const cursor = new Date(begin.getTime());
      while (cursor <= end) {
        const winEnd = new Date(Math.min(cursor.getTime() + 6 * 86_400_000, end.getTime()));
        const partial = await getArticleStats(fmt(cursor), fmt(winEnd));
        stats = stats.concat(partial);
        cursor.setTime(winEnd.getTime() + 86_400_000);
      }
    }
  } catch (e) {
    console.error(`获取统计数据失败: ${(e as Error).message}`);
    process.exit(1);
  }

  // Match by title (datacube returns one row per (date, msgid)).
  let updated = 0;
  for (const entry of history) {
    if (entry.stats != null || !entry.title) continue;
    const match = stats.find((s) => s.title === entry.title);
    if (match) {
      entry.stats = {
        read_count: Number(match.intPageReadCount ?? 0),
        share_count: Number(match.shareCount ?? 0),
        like_count: 0, // WeChat datacube does not expose like counts
      };
      updated += 1;
    }
  }

  if (updated > 0) {
    writeFileSync(historyPath, stringifyYaml(history), 'utf-8');
    console.error(`Updated ${updated} entries in history.yaml`);
  } else {
    console.error('No matching articles found to update.');
  }

  console.log(
    JSON.stringify(
      {
        client,
        period: `${beginStr} to ${endStr}`,
        stats_fetched: stats.length,
        history_updated: updated,
      },
      null,
      2,
    ),
  );
}

const isMain = process.argv[1]?.includes('fetch-stats');
if (isMain) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
