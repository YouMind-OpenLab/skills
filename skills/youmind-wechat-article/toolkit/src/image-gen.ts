/**
 * AI image generation via YouMind chat API (Nano Banana Pro).
 *
 * Fallback chain: YouMind chat → Nano Banana Pro library match →
 * CDN predefined covers → prompt-only output.
 *
 * Usage:
 *   npx tsx src/image-gen.ts --prompt "..." --output cover.jpg --size cover
 *   npx tsx src/image-gen.ts --search "tech futuristic" --output img.jpg
 *   npx tsx src/image-gen.ts --fallback-cover --color "#3498db" --output cover.jpg
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';
import { COVER_PALETTE, COLOR_HUE_MAP, type CoverMeta } from './cover-assets.js';
import { loadLayeredConfig } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_DIR = resolve(__dirname, '../..');
const NANO_BANANA_REFS = resolve(
  PROJECT_DIR, 'toolkit', '.claude', 'skills',
  'nano-banana-pro-prompts-recommend-skill', 'references',
);

// ---------------------------------------------------------------------------
// Size mapping
// ---------------------------------------------------------------------------

const SIZE_MAP: Record<string, Record<string, string>> = {
  cover: {
    youmind: '1536x1024',
  },
  article: {
    youmind: '1536x1024',
  },
};

// COVER_PALETTE and COLOR_HUE_MAP imported from cover-assets.ts

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

interface ProviderConfig {
  api_key?: string;
  model?: string;
  base_url?: string;
}

// Kept as an (empty-ish) shape for minimal disruption to existing call sites.
interface ImageConfig {
  // no fields — multi-provider selection has been removed.
}

function loadConfig(): { image: ImageConfig; youmind?: { api_key?: string } } {
  const raw = loadLayeredConfig();
  const youmind =
    raw.youmind && typeof raw.youmind === 'object' && !Array.isArray(raw.youmind)
      ? (raw.youmind as { api_key?: string })
      : undefined;
  return { image: {}, youmind };
}

function resolveProvider(
  config: { image: ImageConfig; youmind?: { api_key?: string } },
  _explicit?: string,
): [string, ProviderConfig] {
  // Single-provider world: if youmind.api_key is set, use it. Otherwise
  // return ['', {}] so the caller falls through to the Nano Banana Pro
  // library → CDN cover → prompt-only chain.
  const youmindKey = config.youmind?.api_key;
  if (youmindKey) {
    return ['youmind', { api_key: youmindKey }];
  }
  return ['', {}];
}

// ---------------------------------------------------------------------------
// HTTP helper
// ---------------------------------------------------------------------------

async function httpRetry(
  url: string,
  init: RequestInit,
  retries = 3,
  timeoutMs = 120_000,
): Promise<Response> {
  for (let i = 1; i <= retries; i++) {
    try {
      const resp = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${await resp.text().then(t => t.slice(0, 300))}`);
      return resp;
    } catch (e) {
      if (i === retries) throw e;
      const wait = 2 ** (i - 1) * 1000;
      console.error(`[WARN] 请求失败 (${i}/${retries}): ${e} — ${wait / 1000}s 后重试`);
      await new Promise(r => setTimeout(r, wait));
    }
  }
  throw new Error('unreachable');
}

// ---------------------------------------------------------------------------
// Image generation
// ---------------------------------------------------------------------------

type GenerateFn = (prompt: string, apiKey: string, sizeOrRatio: string, model?: string, baseUrl?: string) => Promise<Buffer>;

/**
 * YouMind 生图：通过 Chat API（createChat）调用 AI 生图/搜图能力。
 * AI 会自动选择可用的生图工具或联网搜索匹配图片。
 */
async function generateYouMind(
  prompt: string, _apiKey: string, _size: string,
  _model?: string, _baseUrl?: string,
): Promise<Buffer> {
  // 动态导入 youmind-api 的 chatGenerateImage
  const { chatGenerateImage } = await import('./youmind-api.js');
  const result = await chatGenerateImage(prompt);

  if (!result.imageUrls.length) {
    throw new Error('YouMind Chat 未返回图片 URL');
  }

  // 尝试获取高清原图 URL（去掉 /thumbnails/ /small/ 等缩略图路径）
  const fullSizeUrls = result.imageUrls.map(url => {
    let u = url;
    // vecteezy: /thumbnails/xxx/small/ → /previews/xxx/
    u = u.replace('/thumbnails/', '/previews/').replace(/\/small\//, '/');
    // pexels: ?w=500 → ?w=1280
    u = u.replace(/[?&]w=\d+/, '?w=1280');
    // unsplash: ?w=xxx → ?w=1280
    u = u.replace(/[?&]w=\d+/, '?w=1280');
    return u;
  });

  // 下载第一张图片（优先原图，失败则回退到缩略图）
  const allUrls = [...new Set([...fullSizeUrls, ...result.imageUrls])];
  for (const url of allUrls) {
    try {
      const resp = await httpRetry(url, {}, 1, 30_000);
      const buf = Buffer.from(await resp.arrayBuffer());
      if (buf.length > 1024) { // 至少 1KB 才算有效图片
        console.error(`[INFO] YouMind Chat 返回图片: ${url.slice(0, 80)}... (${(buf.length / 1024).toFixed(1)} KB)`);
        return buf;
      }
    } catch (e) {
      console.error(`[WARN] 下载图片失败 ${url.slice(0, 60)}: ${e}`);
    }
  }

  throw new Error(`YouMind Chat 返回了 ${result.imageUrls.length} 个图片 URL 但全部下载失败`);
}

const GENERATORS: Record<string, GenerateFn> = {
  youmind: (p, k, s) => generateYouMind(p, k, s),
};

// ---------------------------------------------------------------------------
// Nano Banana Pro library search
// ---------------------------------------------------------------------------

interface NanaBananaPrompt {
  id?: string;
  title?: string;
  content?: string;
  description?: string;
  sourceMedia?: string[];
}

function searchNanoBanana(keywords: string, maxResults = 3): NanaBananaPrompt[] {
  const manifestPath = resolve(NANO_BANANA_REFS, 'manifest.json');
  if (!existsSync(manifestPath)) return [];

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
  const terms = keywords.toLowerCase().split(/\s+/).filter(t => t.length > 1);
  if (!terms.length) return [];

  const scored: [number, NanaBananaPrompt][] = [];

  for (const cat of manifest.categories ?? []) {
    const catFile = resolve(NANO_BANANA_REFS, cat.file);
    if (!existsSync(catFile)) continue;
    try {
      const prompts: NanaBananaPrompt[] = JSON.parse(readFileSync(catFile, 'utf-8'));
      for (const p of prompts) {
        if (!p?.sourceMedia?.length) continue;
        const searchable = `${p.content ?? ''} ${p.title ?? ''} ${p.description ?? ''}`.toLowerCase();
        const score = terms.reduce((s, t) => s + (searchable.includes(t) ? 2 : 0), 0);
        if (score > 0) scored.push([score, p]);
      }
    } catch { /* skip bad files */ }
  }

  scored.sort((a, b) => b[0] - a[0]);
  return scored.slice(0, maxResults).map(([, p]) => p);
}

async function downloadNanaBananaImage(url: string, output: string): Promise<boolean> {
  try {
    const resp = await httpRetry(url, {}, 1, 30_000);
    const buf = Buffer.from(await resp.arrayBuffer());
    writeFileSync(output, buf);
    console.error(`[INFO] 从 Nano Banana Pro 库下载图片: ${basename(output)} (${(buf.length / 1024).toFixed(1)} KB)`);
    return true;
  } catch (e) {
    console.error(`[WARN] 下载 Nano Banana Pro 图片失败: ${e}`);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Fallback cover
// ---------------------------------------------------------------------------

function selectFallbackCover(color = '#3498db', mood = ''): string | null {
  const targetHue = COLOR_HUE_MAP[color.toLowerCase()] ?? 'blue';

  const candidates: [number, string][] = [];
  for (const [, meta] of Object.entries(COVER_PALETTE)) {
    let score = 0;
    if (meta.hue === targetHue) score += 3;
    if (mood && meta.mood === mood) score += 2;
    if (meta.tone === (['orange', 'warm'].includes(targetHue) ? 'warm' : 'cool')) score += 1;
    candidates.push([score, meta.url]);
  }

  if (!candidates.length) return null;
  candidates.sort((a, b) => b[0] - a[0]);
  return candidates[0][1];
}

async function downloadFallbackCover(url: string, output: string): Promise<boolean> {
  try {
    const resp = await httpRetry(url, {}, 2, 30_000);
    const buf = Buffer.from(await resp.arrayBuffer());
    writeFileSync(output, buf);
    console.error(`[INFO] 下载预制封面: ${basename(output)} (${(buf.length / 1024).toFixed(1)} KB)`);
    return true;
  } catch (e) {
    console.error(`[WARN] 下载预制封面失败: ${e}`);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

interface CliArgs {
  prompt?: string;
  search?: string;
  output: string;
  size: 'cover' | 'article';
  provider?: string;
  fallbackCover: boolean;
  color: string;
  mood: string;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const get = (flag: string): string | undefined => {
    const i = args.indexOf(flag);
    return i >= 0 && i + 1 < args.length ? args[i + 1] : undefined;
  };
  const has = (flag: string) => args.includes(flag);

  const output = get('--output') ?? get('-o');
  if (!output) { console.error('需要 --output 参数'); process.exit(1); }

  return {
    prompt: get('--prompt'),
    search: get('--search'),
    output,
    size: (get('--size') ?? 'cover') as 'cover' | 'article',
    provider: get('--provider'),
    fallbackCover: has('--fallback-cover'),
    color: get('--color') ?? '#3498db',
    mood: get('--mood') ?? '',
  };
}

function output(data: Record<string, unknown>) {
  console.log(JSON.stringify(data, null, 2));
}

async function main() {
  const args = parseArgs();
  mkdirSync(dirname(resolve(args.output)), { recursive: true });

  // --- Mode 1: Fallback cover ---
  if (args.fallbackCover) {
    const cover = selectFallbackCover(args.color, args.mood);
    if (cover && await downloadFallbackCover(cover, args.output)) {
      output({ status: 'ok', source: 'fallback', file: args.output });
    } else {
      output({ status: 'error', message: '无匹配的预制封面' });
      process.exit(1);
    }
    return;
  }

  // --- Mode 2: Nano Banana Pro library search ---
  if (args.search) {
    const results = searchNanoBanana(args.search);
    for (const r of results) {
      if (r.sourceMedia?.[0] && await downloadNanaBananaImage(r.sourceMedia[0], args.output)) {
        output({
          status: 'ok', source: 'nano-banana-library', file: args.output,
          prompt_title: r.title ?? '', prompt_id: r.id,
          original_prompt: (r.content ?? '').slice(0, 200),
        });
        return;
      }
    }
    // Fallback to predefined cover
    if (args.size === 'cover') {
      const cover = selectFallbackCover(args.color, args.mood);
      if (cover && await downloadFallbackCover(cover, args.output)) {
        output({ status: 'ok', source: 'fallback', file: args.output });
        return;
      }
    }
    output({ status: 'no_match', search: args.search, message: '库中无匹配，请尝试 --prompt 配合 API 生图' });
    return;
  }

  // --- Mode 3: API generation ---
  if (!args.prompt) {
    console.error('需要 --prompt 或 --search 参数');
    process.exit(1);
  }

  const config = loadConfig();
  const [providerName, providerCfg] = resolveProvider(config, args.provider);

  if (!providerCfg.api_key) {
    console.error('[WARN] 无可用的 API key，尝试降级方案...');
    // Fallback 1: search Nano Banana Pro library
    const searchTerms = args.prompt.replace(/[,，。.!！?？"'\-—()（）[\]]/g, ' ');
    const results = searchNanoBanana(searchTerms);
    if (results.length && results[0].sourceMedia?.[0]) {
      if (await downloadNanaBananaImage(results[0].sourceMedia[0], args.output)) {
        output({
          status: 'ok', source: 'nano-banana-library', file: args.output,
          message: '无 API key，已从 Nano Banana Pro 库匹配示例图', prompt_id: results[0].id,
        });
        return;
      }
    }
    // Fallback 2: predefined cover
    if (args.size === 'cover') {
      const cover = selectFallbackCover(args.color, args.mood);
      if (cover && await downloadFallbackCover(cover, args.output)) {
        output({ status: 'ok', source: 'fallback', file: args.output, prompt: args.prompt });
        return;
      }
    }
    // Fallback 3: prompt only
    output({
      status: 'prompt_only', prompt: args.prompt,
      message: 'No API key available. Configure ~/.youmind/config.yaml.',
    });
    return;
  }

  const genFn = GENERATORS[providerName];
  if (!genFn) {
    console.error(`未知 provider: ${providerName} (仅支持: youmind)`);
    process.exit(1);
  }

  const sizeVal = SIZE_MAP[args.size][providerName] ?? SIZE_MAP[args.size].youmind;

  try {
    const imageBytes = await genFn(
      args.prompt, providerCfg.api_key!, sizeVal,
      providerCfg.model, providerCfg.base_url,
    );
    writeFileSync(args.output, imageBytes);
    console.error(`[INFO] 图片已保存: ${args.output} (${(imageBytes.length / 1024).toFixed(1)} KB)`);
    output({ status: 'ok', source: providerName, file: args.output });
  } catch (e) {
    console.error(`[ERROR] ${providerName} 生图失败: ${e}`);
    // Fallback to Nano Banana Pro library
    const searchTerms = args.prompt.replace(/[,，。.!！?？"'\-—()（）[\]]/g, ' ');
    const results = searchNanoBanana(searchTerms);
    if (results.length && results[0].sourceMedia?.[0]) {
      if (await downloadNanaBananaImage(results[0].sourceMedia[0], args.output)) {
        output({ status: 'ok', source: 'nano-banana-library', file: args.output, api_error: String(e) });
        return;
      }
    }
    if (args.size === 'cover') {
      const cover = selectFallbackCover(args.color, args.mood);
      if (cover && await downloadFallbackCover(cover, args.output)) {
        output({ status: 'ok', source: 'fallback', file: args.output, api_error: String(e) });
        return;
      }
    }
    output({ status: 'error', message: String(e), prompt: args.prompt });
    process.exit(1);
  }
}

// Export for module usage
export {
  generateYouMind,
  searchNanoBanana, selectFallbackCover, downloadFallbackCover, resolveProvider,
  GENERATORS, SIZE_MAP,
};
export { COVER_PALETTE, COLOR_HUE_MAP } from './cover-assets.js';

const isMain = process.argv[1]?.includes('image-gen');
if (isMain) main().catch(e => { console.error(e); process.exit(1); });
