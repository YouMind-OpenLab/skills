/**
 * Fetch WeChat article statistics and update history.yaml.
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
// HTTP with retry
// ---------------------------------------------------------------------------

async function httpRetry(
  method: string, url: string, body?: unknown, retries = 3,
): Promise<Record<string, unknown>> {
  for (let i = 1; i <= retries; i++) {
    try {
      const init: RequestInit = { method, headers: { 'Content-Type': 'application/json' } };
      if (body) init.body = JSON.stringify(body);
      const resp = await fetch(url, init);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return await resp.json() as Record<string, unknown>;
    } catch (e) {
      if (i === retries) throw e;
      const wait = 2 ** i * 1000;
      console.error(`[WARN] 请求失败 (${i}/${retries}): ${e} — ${wait / 1000}s 后重试`);
      await new Promise(r => setTimeout(r, wait));
    }
  }
  throw new Error('unreachable');
}

// ---------------------------------------------------------------------------
// WeChat stats API
// ---------------------------------------------------------------------------

async function getArticleTotal(
  token: string, beginDate: string, endDate: string,
): Promise<Record<string, unknown>[]> {
  const url = `https://api.weixin.qq.com/datacube/getarticletotal?access_token=${token}`;
  const data = await httpRetry('POST', url, { begin_date: beginDate, end_date: endDate });

  if (data.errcode && data.errcode !== 0) {
    throw new Error(`WeChat datacube error: errcode=${data.errcode}, errmsg=${data.errmsg}`);
  }

  const list = data.list;
  if (!Array.isArray(list)) {
    console.error(`[WARN] API 返回中缺少 'list' 字段`);
    return [];
  }
  return list;
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

  // Get access token
  if (!token) {
    const configPath = resolve(PROJECT_DIR, 'config.yaml');
    if (existsSync(configPath)) {
      const cfg = parseYaml(readFileSync(configPath, 'utf-8')) ?? {};
      const wechat = (cfg as Record<string, unknown>).wechat as Record<string, string> | undefined;
      if (wechat?.appid && wechat?.secret) {
        token = await getAccessToken(wechat.appid, wechat.secret);
      }
    }
    if (!token) {
      console.error('请提供 --token 或在 config.yaml 配置 wechat.appid/secret');
      process.exit(1);
    }
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
