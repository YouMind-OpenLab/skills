/**
 * AI image generation — multi-provider + Nano Banana Pro library search + CDN fallback covers.
 *
 * Providers: youmind | gemini | openai | doubao
 * Fallback chain: API -> Nano Banana Pro library match -> CDN predefined covers -> prompt-only output
 *
 * Usage:
 *   npx tsx src/image-gen.ts --prompt "..." --output cover.jpg --size cover
 *   npx tsx src/image-gen.ts --prompt "..." --output img.jpg --provider gemini
 *   npx tsx src/image-gen.ts --search "tech futuristic" --output img.jpg
 *   npx tsx src/image-gen.ts --fallback-cover --color "#3498db" --output cover.jpg
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname, basename } from 'node:path';
import { mkdirSync } from 'node:fs';
import { parse as parseYaml } from 'yaml';
import { COVER_PALETTE, COLOR_HUE_MAP, type CoverMeta } from './cover-assets.js';
import type { ProviderConfig, ImageConfig } from './types.js';

export { CoverMeta, COVER_PALETTE, COLOR_HUE_MAP } from './cover-assets.js';

// ---------------------------------------------------------------------------
// Size mapping
// ---------------------------------------------------------------------------

const SIZE_MAP: Record<string, Record<string, string>> = {
  cover: {
    youmind: '1536x1024', gemini: '16:9', openai: '1536x1024', doubao: '1280x544',
  },
  article: {
    youmind: '1536x1024', gemini: '16:9', openai: '1536x1024', doubao: '1280x720',
  },
};

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

function loadImageConfig(projectDir?: string): { image: ImageConfig; youmind?: { api_key?: string } } {
  const baseDir = projectDir ?? process.cwd();
  for (const name of ['config.yaml', 'config.example.yaml']) {
    const p = resolve(baseDir, name);
    if (existsSync(p)) {
      const raw = parseYaml(readFileSync(p, 'utf-8')) ?? {};
      return { image: raw.image ?? {}, youmind: raw.youmind };
    }
  }
  return { image: {} };
}

function resolveProvider(
  config: { image: ImageConfig; youmind?: { api_key?: string } },
  explicit?: string,
): [string, ProviderConfig] {
  const img = config.image;
  const providers = img.providers ?? {};

  if (providers.youmind && !providers.youmind.api_key && config.youmind?.api_key) {
    providers.youmind.api_key = config.youmind.api_key;
  }

  if (explicit) {
    const p = providers[explicit];
    if (p?.api_key) return [explicit, p];
    console.error(`[WARN] 指定的 provider '${explicit}' 未配置 api_key`);
    return [explicit, p ?? {}];
  }

  const defaultP = img.default_provider;
  if (defaultP && providers[defaultP]?.api_key) return [defaultP, providers[defaultP]];

  for (const [name, cfg] of Object.entries(providers)) {
    if (cfg.api_key) {
      console.error(`[INFO] 自动选择 provider: ${name}`);
      return [name, cfg];
    }
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
// Providers
// ---------------------------------------------------------------------------

async function generateGemini(
  prompt: string, apiKey: string, aspectRatio: string, model = 'imagen-3.0-generate-002',
): Promise<Buffer> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict?key=${apiKey}`;
  const resp = await httpRetry(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      instances: [{ prompt }],
      parameters: { sampleCount: 1, aspectRatio },
    }),
  }, 3, 90_000);

  const data = await resp.json() as Record<string, unknown>;
  const predictions = (data.predictions ?? []) as Record<string, string>[];
  const b64 = predictions[0]?.bytesBase64Encoded;
  if (!b64) throw new Error(`Gemini API 无返回: ${JSON.stringify(data).slice(0, 200)}`);
  return Buffer.from(b64, 'base64');
}

async function generateOpenAI(
  prompt: string, apiKey: string, size: string,
  model = 'gpt-image-1', baseUrl = 'https://api.openai.com/v1',
): Promise<Buffer> {
  const url = `${baseUrl}/images/generations`;
  const resp = await httpRetry(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt, size, n: 1, quality: 'medium' }),
  }, 3, 120_000);

  const data = await resp.json() as Record<string, unknown>;
  const items = (data.data ?? []) as Record<string, string>[];
  if (!items.length) throw new Error(`OpenAI API 无返回: ${JSON.stringify(data).slice(0, 200)}`);

  if (items[0].b64_json) return Buffer.from(items[0].b64_json, 'base64');
  if (items[0].url) {
    const imgResp = await httpRetry(items[0].url, {}, 1, 30_000);
    return Buffer.from(await imgResp.arrayBuffer());
  }
  throw new Error('OpenAI API 未返回图片数据');
}

async function generateDoubao(
  prompt: string, apiKey: string, size: string,
  model = 'doubao-seedream-5-0-260128', baseUrl = 'https://ark.cn-beijing.volces.com/api/v3',
): Promise<Buffer> {
  const url = `${baseUrl}/images/generations`;
  const resp = await httpRetry(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt, size, n: 1, response_format: 'b64_json' }),
  }, 3, 60_000);

  const data = await resp.json() as Record<string, unknown>;
  const items = (data.data ?? []) as Record<string, string>[];
  if (!items.length) throw new Error(`豆包 API 无返回: ${JSON.stringify(data).slice(0, 200)}`);

  if (items[0].b64_json) return Buffer.from(items[0].b64_json, 'base64');
  if (items[0].url?.startsWith('http')) {
    const imgResp = await httpRetry(items[0].url, {}, 1, 30_000);
    return Buffer.from(await imgResp.arrayBuffer());
  }
  throw new Error('豆包 API 未返回图片数据');
}

type GenerateFn = (prompt: string, apiKey: string, sizeOrRatio: string, model?: string, baseUrl?: string) => Promise<Buffer>;

async function generateYouMind(
  prompt: string, apiKey: string, _size: string,
  _model?: string, _baseUrl?: string,
): Promise<Buffer> {
  const { chatGenerateImage } = await import('./youmind-api.js');
  const result = await chatGenerateImage(prompt);

  if (!result.imageUrls.length) {
    throw new Error('YouMind Chat 未返回图片 URL');
  }

  const fullSizeUrls = result.imageUrls.map(url => {
    let u = url;
    u = u.replace('/thumbnails/', '/previews/').replace(/\/small\//, '/');
    u = u.replace(/[?&]w=\d+/, '?w=1280');
    return u;
  });

  const allUrls = [...new Set([...fullSizeUrls, ...result.imageUrls])];
  for (const url of allUrls) {
    try {
      const resp = await httpRetry(url, {}, 1, 30_000);
      const buf = Buffer.from(await resp.arrayBuffer());
      if (buf.length > 1024) {
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
  gemini: (p, k, s, m) => generateGemini(p, k, s, m),
  openai: (p, k, s, m, b) => generateOpenAI(p, k, s, m, b),
  doubao: (p, k, s, m, b) => generateDoubao(p, k, s, m, b),
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

function searchNanoBanana(keywords: string, maxResults = 3, projectDir?: string): NanaBananaPrompt[] {
  const baseDir = projectDir ?? process.cwd();
  const refsDir = resolve(
    baseDir, 'toolkit', '.claude', 'skills',
    'nano-banana-pro-prompts-recommend-skill', 'references',
  );
  const manifestPath = resolve(refsDir, 'manifest.json');
  if (!existsSync(manifestPath)) return [];

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
  const terms = keywords.toLowerCase().split(/\s+/).filter(t => t.length > 1);
  if (!terms.length) return [];

  const scored: [number, NanaBananaPrompt][] = [];

  for (const cat of manifest.categories ?? []) {
    const catFile = resolve(refsDir, cat.file);
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
  projectDir?: string;
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
    projectDir: get('--project-dir'),
  };
}

function output(data: Record<string, unknown>) {
  console.log(JSON.stringify(data, null, 2));
}

async function main() {
  const args = parseArgs();
  mkdirSync(dirname(resolve(args.output)), { recursive: true });

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

  if (args.search) {
    const results = searchNanoBanana(args.search, 3, args.projectDir);
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

  if (!args.prompt) {
    console.error('需要 --prompt 或 --search 参数');
    process.exit(1);
  }

  const config = loadImageConfig(args.projectDir);
  const [providerName, providerCfg] = resolveProvider(config, args.provider);

  if (!providerCfg.api_key) {
    console.error('[WARN] 无可用的 API key，尝试降级方案...');
    const searchTerms = args.prompt.replace(/[,，。.!！?？"'\-—()（）[\]]/g, ' ');
    const results = searchNanoBanana(searchTerms, 3, args.projectDir);
    if (results.length && results[0].sourceMedia?.[0]) {
      if (await downloadNanaBananaImage(results[0].sourceMedia[0], args.output)) {
        output({
          status: 'ok', source: 'nano-banana-library', file: args.output,
          message: '无 API key，已从 Nano Banana Pro 库匹配示例图', prompt_id: results[0].id,
        });
        return;
      }
    }
    if (args.size === 'cover') {
      const cover = selectFallbackCover(args.color, args.mood);
      if (cover && await downloadFallbackCover(cover, args.output)) {
        output({ status: 'ok', source: 'fallback', file: args.output, prompt: args.prompt });
        return;
      }
    }
    output({
      status: 'prompt_only', prompt: args.prompt,
      message: '无可用 API key。请在 config.yaml 中配置 image.providers 的 api_key',
    });
    return;
  }

  const genFn = GENERATORS[providerName];
  if (!genFn) {
    console.error(`未知 provider: ${providerName} (支持: youmind, gemini, openai, doubao)`);
    process.exit(1);
  }

  const sizeVal = SIZE_MAP[args.size][providerName] ?? SIZE_MAP[args.size].openai;

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
    const searchTerms = args.prompt.replace(/[,，。.!！?？"'\-—()（）[\]]/g, ' ');
    const results = searchNanoBanana(searchTerms, 3, args.projectDir);
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

export {
  generateGemini, generateOpenAI, generateDoubao,
  searchNanoBanana, selectFallbackCover, downloadFallbackCover, resolveProvider,
  GENERATORS, SIZE_MAP,
};

const isMain = process.argv[1]?.includes('image-gen');
if (isMain) main().catch(e => { console.error(e); process.exit(1); });
