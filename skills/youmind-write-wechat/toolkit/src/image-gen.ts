/**
 * AI image generation — multi-provider + Nano Banana Pro library search + fallback covers.
 *
 * Providers: youmind | gemini | openai | doubao
 * Fallback chain: API → Nano Banana Pro library match → predefined covers → prompt-only output
 *
 * Usage:
 *   npx tsx src/image-gen.ts --prompt "..." --output cover.jpg --size cover
 *   npx tsx src/image-gen.ts --prompt "..." --output img.jpg --provider gemini
 *   npx tsx src/image-gen.ts --search "tech futuristic" --output img.jpg
 *   npx tsx src/image-gen.ts --fallback-cover --color "#3498db" --output cover.jpg
 */

import { readFileSync, writeFileSync, existsSync, copyFileSync } from 'node:fs';
import { resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';
import { parse as parseYaml } from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_DIR = resolve(__dirname, '../..');
const COVER_DIR = resolve(PROJECT_DIR, 'cover');
const NANO_BANANA_REFS = resolve(
  PROJECT_DIR, 'toolkit', '.claude', 'skills',
  'nano-banana-pro-prompts-recommend-skill', 'references',
);

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
// Predefined cover palette
// ---------------------------------------------------------------------------

interface CoverMeta { hue: string; tone: string; mood: string }

const COVER_PALETTE: Record<string, CoverMeta> = {
  'blue-clouds-oil.jpg': { hue: 'blue', tone: 'warm', mood: 'artistic' },
  'blue-light-wave.jpg': { hue: 'blue', tone: 'cool', mood: 'tech' },
  'city-skyline-painting.jpg': { hue: 'warm', tone: 'warm', mood: 'atmospheric' },
  'cyan-gradient.jpg': { hue: 'cyan', tone: 'cool', mood: 'clean' },
  'green-gradient.jpg': { hue: 'green', tone: 'cool', mood: 'fresh' },
  'lavender-silk.jpg': { hue: 'purple', tone: 'cool', mood: 'elegant' },
  'orange-warm.jpg': { hue: 'orange', tone: 'warm', mood: 'energetic' },
  'pink-blue-diagonal.jpg': { hue: 'pink', tone: 'cool', mood: 'modern' },
  'purple-teal-diagonal.jpg': { hue: 'purple', tone: 'cool', mood: 'tech' },
  'sunset-watercolor.jpg': { hue: 'orange', tone: 'warm', mood: 'artistic' },
  'warm-colorful-blur.jpg': { hue: 'warm', tone: 'warm', mood: 'energetic' },
};

const COLOR_HUE_MAP: Record<string, string> = {
  '#3498db': 'blue', '#2980b9': 'blue', '#1abc9c': 'cyan',
  '#e74c3c': 'warm', '#c0392b': 'warm', '#e91e63': 'pink',
  '#2ecc71': 'green', '#27ae60': 'green',
  '#9b59b6': 'purple', '#8e44ad': 'purple',
  '#f39c12': 'orange', '#f1c40f': 'orange',
  '#34495e': 'blue', '#2c3e50': 'blue',
};

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

interface ProviderConfig {
  api_key?: string;
  model?: string;
  base_url?: string;
}

interface ImageConfig {
  default_provider?: string;
  providers?: Record<string, ProviderConfig>;
}

function loadConfig(): { image: ImageConfig; youmind?: { api_key?: string } } {
  for (const name of ['config.yaml', 'config.example.yaml']) {
    const p = resolve(PROJECT_DIR, name);
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

  // youmind provider 可从顶层 youmind.api_key 继承
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

/**
 * YouMind 生图：通过 Chat API（createChat）调用 AI 生图/搜图能力。
 * AI 会自动选择可用的生图工具或联网搜索匹配图片。
 */
async function generateYouMind(
  prompt: string, apiKey: string, _size: string,
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
  if (!existsSync(COVER_DIR)) return null;
  const targetHue = COLOR_HUE_MAP[color.toLowerCase()] ?? 'blue';

  const candidates: [number, string][] = [];
  for (const [filename, meta] of Object.entries(COVER_PALETTE)) {
    const fp = resolve(COVER_DIR, filename);
    if (!existsSync(fp)) continue;
    let score = 0;
    if (meta.hue === targetHue) score += 3;
    if (mood && meta.mood === mood) score += 2;
    if (meta.tone === (['orange', 'warm'].includes(targetHue) ? 'warm' : 'cool')) score += 1;
    candidates.push([score, fp]);
  }

  if (!candidates.length) return null;
  candidates.sort((a, b) => b[0] - a[0]);
  return candidates[0][1];
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
    if (cover) {
      copyFileSync(cover, args.output);
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
      if (cover) {
        copyFileSync(cover, args.output);
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
      if (cover) {
        copyFileSync(cover, args.output);
        output({ status: 'ok', source: 'fallback', file: args.output, prompt: args.prompt });
        return;
      }
    }
    // Fallback 3: prompt only
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
      if (cover) {
        copyFileSync(cover, args.output);
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
  generateGemini, generateOpenAI, generateDoubao,
  searchNanoBanana, selectFallbackCover, resolveProvider,
  GENERATORS, SIZE_MAP,
};

const isMain = process.argv[1]?.includes('image-gen');
if (isMain) main().catch(e => { console.error(e); process.exit(1); });
