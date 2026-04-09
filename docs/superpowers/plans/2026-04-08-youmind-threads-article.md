# YouMind Threads Article Skill 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**目标:** 按照 `docs/superpowers/specs/2026-04-08-youmind-threads-article-design.md` 实现 `youmind-threads-article` skill，让用户通过 YouMind 代理发布单帖和 thread chain 到 Meta Threads 平台。

**架构:** 遵循现有 `youmind-facebook-article` 的模块分层（`cli.ts` / `publisher.ts` / `threads-api.ts` / `content-adapter.ts` / `youmind-api.ts`），新增 `profile-manager.ts` 做 voice/history/lessons 沉淀。Skill 只持有 YouMind API key，所有 Threads 操作通过 YouMind `/threads/*` 代理端点完成。Agent（从 `references/*.md` 读取运行时指令）负责内容创作、分段和从 diff 中学习；CLI 只做 IO、校验、编排和发布。

**技术栈:** TypeScript (strict, nodenext), Node.js ≥ 18, commander, yaml, 原生 fetch。不引入测试框架——与现有 11 个 article skill 保持一致，依赖 `tsc` 严格类型检查 + 最终 CLI smoke test。

**参考规范:** `docs/superpowers/specs/2026-04-08-youmind-threads-article-design.md`（"spec"），`docs/superpowers/specs/2026-04-01-centralized-credentials-design.md`（中心凭证设计）。

---

## 目录结构总览

执行完本计划后，生成如下结构：

```text
skills/youmind-threads-article/
├── SKILL.md
├── README.md
├── README_CN.md
├── .gitignore
├── .clawhubignore
├── config.example.yaml
├── profiles/
│   └── _index.json            (提交到仓库；运行时生成的 profiles/<name>/ 被 git-ignored)
├── references/
│   ├── pipeline.md
│   ├── writing-guide.md
│   ├── chain-splitting.md
│   ├── voice-template.md
│   ├── content-adaptation.md
│   └── api-reference.md
└── toolkit/
    ├── package.json
    ├── tsconfig.json
    └── src/
        ├── cli.ts
        ├── publisher.ts
        ├── content-adapter.ts
        ├── profile-manager.ts
        ├── threads-api.ts
        └── youmind-api.ts     (从 youmind-facebook-article 原样拷贝)
```

**边界规则（来自 spec）：** `cli.ts` 不直接 import `youmind-api.ts`；`publisher.ts` 不发 HTTP 请求；`threads-api.ts` 不写业务规则；`content-adapter.ts` 不接触网络——但 `validateImageUrl` / `validateVideoUrl` 会发 HEAD，是唯一例外（纯校验工具）。

---

### Task 1: 项目脚手架与配置文件

**文件:**
- 新建: `skills/youmind-threads-article/` (目录)
- 新建: `skills/youmind-threads-article/toolkit/` (目录)
- 新建: `skills/youmind-threads-article/toolkit/src/` (目录)
- 新建: `skills/youmind-threads-article/profiles/` (目录)
- 新建: `skills/youmind-threads-article/references/` (目录)
- 新建: `skills/youmind-threads-article/toolkit/package.json`
- 新建: `skills/youmind-threads-article/toolkit/tsconfig.json`
- 新建: `skills/youmind-threads-article/.gitignore`
- 新建: `skills/youmind-threads-article/.clawhubignore`
- 新建: `skills/youmind-threads-article/config.example.yaml`
- 新建: `skills/youmind-threads-article/profiles/_index.json`

- [ ] **Step 1: 创建目录骨架**

```bash
mkdir -p "$(git rev-parse --show-toplevel)"/skills/youmind-threads-article/toolkit/src \
         "$(git rev-parse --show-toplevel)"/skills/youmind-threads-article/profiles \
         "$(git rev-parse --show-toplevel)"/skills/youmind-threads-article/references
```

- [ ] **Step 2: 写 `toolkit/package.json`**

```json
{
  "name": "youmind-threads-toolkit",
  "version": "1.0.0",
  "description": "YouMind Threads: AI-powered Meta Threads publisher",
  "type": "module",
  "main": "dist/cli.js",
  "bin": {
    "youmind-threads": "dist/cli.js"
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsx src/cli.ts",
    "publish": "tsx src/cli.ts publish",
    "preview": "tsx src/cli.ts preview",
    "validate": "tsx src/cli.ts validate",
    "list": "tsx src/cli.ts list"
  },
  "dependencies": {
    "commander": "^12.0.0",
    "yaml": "^2.3.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "tsx": "^4.7.0",
    "typescript": "^5.3.0"
  }
}
```

注：facebook skill 里有 `node-fetch` 和 `form-data`，本 skill 只用 Node 18+ 原生 `fetch`（不发 multipart），所以不需要这两个依赖。

- [ ] **Step 3: 写 `toolkit/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "nodenext",
    "moduleResolution": "nodenext",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 4: 写 `.gitignore`**

关键点：`profiles/<name>/` 要被忽略（运行时生成，含用户隐私），但 `profiles/_index.json` 必须保留（作为目录占位符提交）。

```gitignore
node_modules/
dist/
config.yaml
output/
.env
toolkit/package-lock.json
profiles/*/
!profiles/_index.json
```

- [ ] **Step 5: 写 `.clawhubignore`**

发布时忽略构建产物和依赖：

```gitignore
toolkit/package-lock.json
toolkit/node_modules/
toolkit/dist/
```

- [ ] **Step 6: 写 `config.example.yaml`**

Spec 要求本地 config 只包含 YouMind key + base_url，不含 Threads token（token 在 YouMind 服务端）：

```yaml
youmind:
  api_key: ""
  base_url: "https://youmind.com/openapi/v1"
```

- [ ] **Step 7: 写 `profiles/_index.json`**

作为目录占位符（`profiles/` 必须存在于仓库以便 skill 加载路径正确，但实际 profile 目录运行时生成）：

```json
[]
```

- [ ] **Step 8: 验证目录结构**

运行 `ls` 确认：

```bash
ls -la "$(git rev-parse --show-toplevel)"/skills/youmind-threads-article/
ls -la "$(git rev-parse --show-toplevel)"/skills/youmind-threads-article/toolkit/
ls -la "$(git rev-parse --show-toplevel)"/skills/youmind-threads-article/profiles/
```

预期输出包含以上所有文件。

- [ ] **Step 9: 安装依赖**

```bash
cd "$(git rev-parse --show-toplevel)/skills/youmind-threads-article/toolkit" && npm install
```

预期：`node_modules/` 被创建，`package-lock.json` 出现。

- [ ] **Step 10: 提交**

```bash
git add skills/youmind-threads-article/
git commit -m "feat(threads): scaffold youmind-threads-article skill"
```

---

### Task 2: 拷贝共享 `youmind-api.ts`

Spec 明确说 "从 `youmind-facebook-article/toolkit/src/youmind-api.ts` 原样拷贝"。这个文件已经包含了中心凭证加载逻辑 (`loadCentralCredentials`) 和 OpenAPI 客户端（search、webSearch、mineTopics、saveArticle 等），本 skill 的 research 步骤会用到。

**文件:**
- 新建: `skills/youmind-threads-article/toolkit/src/youmind-api.ts`

- [ ] **Step 1: 拷贝文件**

```bash
cp "$(git rev-parse --show-toplevel)"/skills/youmind-facebook-article/toolkit/src/youmind-api.ts \
   "$(git rev-parse --show-toplevel)"/skills/youmind-threads-article/toolkit/src/youmind-api.ts
```

- [ ] **Step 2: 确认文件内容一致**

```bash
diff "$(git rev-parse --show-toplevel)"/skills/youmind-facebook-article/toolkit/src/youmind-api.ts \
     "$(git rev-parse --show-toplevel)"/skills/youmind-threads-article/toolkit/src/youmind-api.ts
```

预期：无输出（完全一致）。

- [ ] **Step 3: 编译验证**

```bash
cd "$(git rev-parse --show-toplevel)/skills/youmind-threads-article/toolkit" && npx tsc --noEmit
```

预期：通过（但此时只有 `youmind-api.ts`，其他模块还未写，不应该有类型错误报出）。

注：这一步可能因 `cli.ts` 等尚未创建而 `tsc` 报找不到任何文件——那样也算通过（tsc 在 include 匹配到至少一个文件时才检查）。如果 tsc 报 "No inputs were found"，属正常，继续下一步。

- [ ] **Step 4: 提交**

```bash
git add skills/youmind-threads-article/toolkit/src/youmind-api.ts
git commit -m "feat(threads): copy youmind-api.ts from facebook skill"
```

---

### Task 3: 实现 `content-adapter.ts`

纯函数模块，不接业务规则。按 spec 第 "模块接口" 章节的 `content-adapter.ts` 签名实现。

**文件:**
- 新建: `skills/youmind-threads-article/toolkit/src/content-adapter.ts`

- [ ] **Step 1: 写完整文件**

```typescript
/**
 * Content adapter — text cleaning, segment validation, hashtag application, media URL validation.
 *
 * Pure utilities. The agent uses these at write-time to ensure segments are valid
 * before passing them to the publisher. Only validateImageUrl / validateVideoUrl
 * touch the network (HEAD requests to check Content-Type and Content-Length).
 *
 * Threads constraints (from Meta official docs):
 *   Text:  ≤ 500 chars per post, ≤ 5 URLs per post
 *   Image: JPEG/PNG, ≤ 8 MB
 *   Video: MP4/MOV, ≤ 1 GB
 */

// ---------------------------------------------------------------------------
// Constants — Meta Threads hard limits
// ---------------------------------------------------------------------------

const MAX_CHARS_PER_POST = 500;
const MAX_URLS_PER_POST = 5;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;          // 8 MB
const MAX_VIDEO_BYTES = 1024 * 1024 * 1024;       // 1 GB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime']; // quicktime = .mov

// URL extraction pattern (simple but covers http/https)
const URL_REGEX = /https?:\/\/\S+/gi;

// ---------------------------------------------------------------------------
// cleanText — strip markdown/HTML, collapse whitespace
// ---------------------------------------------------------------------------

/**
 * Strip markdown/HTML markup and collapse whitespace.
 * Does NOT split — returns a single cleaned string.
 */
export function cleanText(raw: string): string {
  let result = raw;

  // HTML tags
  result = result.replace(/<[^>]+>/g, '');

  // Headings (keep text)
  result = result.replace(/^#{1,6}\s+/gm, '');

  // Bold / italic
  result = result.replace(/\*\*\*(.*?)\*\*\*/g, '$1');
  result = result.replace(/\*\*(.*?)\*\*/g, '$1');
  result = result.replace(/\*(.*?)\*/g, '$1');
  result = result.replace(/___(.*?)___/g, '$1');
  result = result.replace(/__(.*?)__/g, '$1');
  result = result.replace(/_(.*?)_/g, '$1');

  // Inline code
  result = result.replace(/`([^`]+)`/g, '$1');

  // Fenced code blocks
  result = result.replace(/```[\s\S]*?```/g, '');

  // Images — keep alt text
  result = result.replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1');

  // Links — "text (url)"
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)');

  // Blockquotes
  result = result.replace(/^>\s*/gm, '');

  // Horizontal rules
  result = result.replace(/^[-*_]{3,}\s*$/gm, '');

  // List markers
  result = result.replace(/^\s*[-*+]\s+/gm, '');
  result = result.replace(/^\s*\d+\.\s+/gm, '');

  // Collapse 3+ blank lines to 2
  result = result.replace(/\n{3,}/g, '\n\n');

  // Collapse runs of spaces/tabs (but keep newlines)
  result = result.replace(/[ \t]+/g, ' ');

  return result.trim();
}

// ---------------------------------------------------------------------------
// validateSegment — check ≤500 chars, ≤5 URLs
// ---------------------------------------------------------------------------

export interface SegmentValidation {
  ok: boolean;
  error?: string;
}

/**
 * Check a single segment against Threads per-post limits.
 * Meta counts characters by code units (UTF-16), which matches
 * JavaScript's String.prototype.length for most content including emoji pairs.
 * For grapheme-perfect counting we'd need Intl.Segmenter — out of scope for v1.
 */
export function validateSegment(text: string): SegmentValidation {
  const len = text.length;
  if (len === 0) {
    return { ok: false, error: 'Segment is empty' };
  }
  if (len > MAX_CHARS_PER_POST) {
    return { ok: false, error: `Segment is ${len} chars, max is ${MAX_CHARS_PER_POST}` };
  }

  const urlMatches = text.match(URL_REGEX);
  const urlCount = urlMatches?.length ?? 0;
  if (urlCount > MAX_URLS_PER_POST) {
    return { ok: false, error: `Segment has ${urlCount} URLs, max is ${MAX_URLS_PER_POST}` };
  }

  return { ok: true };
}

// ---------------------------------------------------------------------------
// appendHashtags — inline / trailing / none
// ---------------------------------------------------------------------------

export type HashtagStrategy = 'inline' | 'trailing' | 'none';

/**
 * Append hashtags to a final segment according to the profile's strategy.
 *
 * - 'none':     return text unchanged, ignore hashtags
 * - 'trailing': append hashtags on a new line at the end
 * - 'inline':   weave the first hashtag into the end of the last sentence,
 *               append the rest trailing
 */
export function appendHashtags(
  text: string,
  hashtags: string[],
  strategy: HashtagStrategy,
): string {
  if (strategy === 'none' || hashtags.length === 0) {
    return text;
  }

  const normalized = hashtags.map(h => (h.startsWith('#') ? h : `#${h}`));

  if (strategy === 'trailing') {
    return `${text}\n\n${normalized.join(' ')}`;
  }

  // inline: first tag at end of last sentence, rest trailing
  const [first, ...rest] = normalized;
  const inlined = `${text} ${first}`;
  if (rest.length === 0) {
    return inlined;
  }
  return `${inlined}\n\n${rest.join(' ')}`;
}

// ---------------------------------------------------------------------------
// validateImageUrl / validateVideoUrl — HEAD request checks
// ---------------------------------------------------------------------------

export interface MediaValidation {
  ok: boolean;
  error?: string;
}

async function headRequest(url: string): Promise<{ contentType: string; contentLength: number }> {
  const resp = await fetch(url, {
    method: 'HEAD',
    signal: AbortSignal.timeout(10_000),
  });
  if (!resp.ok) {
    throw new Error(`HEAD ${url} failed with status ${resp.status}`);
  }
  const contentType = (resp.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
  const contentLengthRaw = resp.headers.get('content-length');
  const contentLength = contentLengthRaw ? parseInt(contentLengthRaw, 10) : NaN;
  return { contentType, contentLength };
}

/**
 * Validate an image URL against Meta Threads client-detectable constraints:
 * format (JPEG/PNG) and file size (≤ 8 MB). Cannot check pixel dimensions
 * or aspect ratio client-side — those are enforced server-side by Meta.
 */
export async function validateImageUrl(url: string): Promise<MediaValidation> {
  try {
    const { contentType, contentLength } = await headRequest(url);

    if (!contentType) {
      return { ok: false, error: 'Image URL did not return a Content-Type header' };
    }
    if (!ALLOWED_IMAGE_TYPES.includes(contentType)) {
      return {
        ok: false,
        error: `Image format ${contentType} not supported. Threads requires JPEG or PNG.`,
      };
    }
    if (Number.isFinite(contentLength) && contentLength > MAX_IMAGE_BYTES) {
      return {
        ok: false,
        error: `Image is ${Math.round(contentLength / 1024 / 1024)} MB, max is 8 MB.`,
      };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: `Image URL check failed: ${(e as Error).message}` };
  }
}

/**
 * Validate a video URL against client-detectable constraints: container
 * (MP4/MOV) and file size (≤ 1 GB). Duration, frame rate, and resolution
 * are enforced server-side by Meta.
 */
export async function validateVideoUrl(url: string): Promise<MediaValidation> {
  try {
    const { contentType, contentLength } = await headRequest(url);

    if (!contentType) {
      return { ok: false, error: 'Video URL did not return a Content-Type header' };
    }
    if (!ALLOWED_VIDEO_TYPES.includes(contentType)) {
      return {
        ok: false,
        error: `Video format ${contentType} not supported. Threads requires MP4 or MOV.`,
      };
    }
    if (Number.isFinite(contentLength) && contentLength > MAX_VIDEO_BYTES) {
      return {
        ok: false,
        error: `Video is ${Math.round(contentLength / 1024 / 1024)} MB, max is 1 GB.`,
      };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: `Video URL check failed: ${(e as Error).message}` };
  }
}
```

- [ ] **Step 2: 编译验证**

```bash
cd "$(git rev-parse --show-toplevel)/skills/youmind-threads-article/toolkit" && npx tsc --noEmit
```

预期：通过。若报类型错误，按错误信息修复。

- [ ] **Step 3: 写内联 smoke 脚本验证纯函数**

在 toolkit 目录下临时写一个 `.ts` 文件，用 `tsx` 运行，跑完即删。这样避免 `npx tsx -e` 的 shell 转义问题。

```bash
cd "$(git rev-parse --show-toplevel)/skills/youmind-threads-article/toolkit"

cat > _smoke-adapter.ts <<'EOF'
import { cleanText, validateSegment, appendHashtags } from './src/content-adapter.js';

// cleanText — strip markup
const cleaned = cleanText('# Title\n\n**bold** and `code` and [link](https://e.com)\n\n- item');
if (cleaned.includes('**') || cleaned.includes('##') || cleaned.includes('`')) {
  throw new Error(`cleanText failed: ${JSON.stringify(cleaned)}`);
}

// validateSegment — OK
if (!validateSegment('Hello world').ok) throw new Error('valid short segment rejected');

// validateSegment — too long
if (validateSegment('a'.repeat(501)).ok) throw new Error('501-char segment accepted');

// validateSegment — empty
if (validateSegment('').ok) throw new Error('empty segment accepted');

// validateSegment — too many URLs
const manyUrls = Array.from({ length: 6 }, (_, i) => `https://e${i}.com`).join(' ');
if (validateSegment(manyUrls).ok) throw new Error('6-URL segment accepted');

// appendHashtags — trailing
const trailing = appendHashtags('text', ['foo', 'bar'], 'trailing');
if (!trailing.includes('#foo #bar')) throw new Error(`trailing strategy wrong: ${trailing}`);

// appendHashtags — none
if (appendHashtags('text', ['foo'], 'none') !== 'text') throw new Error('none strategy wrong');

// appendHashtags — inline
const inline = appendHashtags('hello world', ['foo', 'bar'], 'inline');
if (!inline.startsWith('hello world #foo')) throw new Error(`inline strategy wrong: ${inline}`);

console.log('All content-adapter smoke tests passed');
EOF

npx tsx _smoke-adapter.ts
rm _smoke-adapter.ts
```

预期输出：`All content-adapter smoke tests passed`

若任何 `throw` 触发，修复 `content-adapter.ts` 对应函数，然后重跑 Step 3。

- [ ] **Step 4: 提交**

```bash
git add skills/youmind-threads-article/toolkit/src/content-adapter.ts
git commit -m "feat(threads): add content-adapter with text cleanup and validators"
```

---

### Task 4: 实现 `threads-api.ts`

YouMind `/threads/*` 端点的 HTTP 包装器。严格对应 spec "模块接口 / threads-api.ts" 里的签名。

**文件:**
- 新建: `skills/youmind-threads-article/toolkit/src/threads-api.ts`

- [ ] **Step 1: 写完整文件**

```typescript
/**
 * threads-api.ts — HTTP wrapper around YouMind /threads/* proxy endpoints.
 *
 * This module is the ONLY place that touches the network for Threads operations.
 * It does not know about Meta directly — all calls go through YouMind's server
 * which holds the long-lived Meta token and refreshes it automatically.
 *
 * Config loading matches the facebook skill's pattern:
 *   central credentials at ~/.youmind-skill/credentials.yaml
 *   merged with local config.yaml (local non-empty values win)
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ThreadsConfig {
  apiKey: string;
  baseUrl: string;
}

export interface BindingStatus {
  bound: boolean;
  username?: string;
  /** ISO 8601; when <7 days remaining, caller should warn user */
  expires_at?: string;
}

export interface ThreadsPost {
  id: string;
  permalink: string;
  text?: string;
  created_time?: string;
}

export interface PublishingLimits {
  /** 24h rolling, ceiling 250 */
  quota_posts_remaining: number;
  /** 24h rolling, ceiling 1000 */
  quota_replies_remaining: number;
  /** ISO 8601 when the 24h window rolls over */
  reset_at: string;
}

export interface CreateContainerInput {
  text: string;
  mediaType: 'TEXT' | 'IMAGE' | 'VIDEO';
  imageUrl?: string;
  videoUrl?: string;
  /** If set, this container becomes a reply to the given Threads post id */
  replyToId?: string;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_DIR = resolve(__dirname, '../..');

const YOUMIND_OPENAPI_BASE_URLS = [
  'https://youmind.com/openapi/v1',
];

function loadCentralCredentials(): Record<string, unknown> {
  const home = process.env.HOME || process.env.USERPROFILE || '';
  const p = resolve(home, '.youmind-skill', 'credentials.yaml');
  if (existsSync(p)) {
    return (parseYaml(readFileSync(p, 'utf-8')) ?? {}) as Record<string, unknown>;
  }
  return {};
}

function loadLocalConfig(): Record<string, unknown> {
  for (const name of ['config.yaml', 'config.example.yaml']) {
    const p = resolve(PROJECT_DIR, name);
    if (existsSync(p)) {
      return (parseYaml(readFileSync(p, 'utf-8')) ?? {}) as Record<string, unknown>;
    }
  }
  return {};
}

export function loadThreadsConfig(): ThreadsConfig {
  const central = loadCentralCredentials();
  const local = loadLocalConfig();
  const ym = {
    ...((central.youmind as Record<string, unknown>) ?? {}),
    ...((local.youmind as Record<string, unknown>) ?? {}),
  };
  // Filter empty strings locally so they don't override central values
  for (const [k, v] of Object.entries(ym)) {
    if (v === '' && (central.youmind as Record<string, unknown> | undefined)?.[k]) {
      ym[k] = (central.youmind as Record<string, unknown>)[k];
    }
  }
  return {
    apiKey: (ym.api_key as string) || '',
    baseUrl: (ym.base_url as string) || YOUMIND_OPENAPI_BASE_URLS[0],
  };
}

// ---------------------------------------------------------------------------
// HTTP helper
// ---------------------------------------------------------------------------

async function post<T = unknown>(
  endpoint: string,
  body: Record<string, unknown>,
  cfg: ThreadsConfig,
): Promise<T> {
  if (!cfg.apiKey) {
    throw new Error('YouMind API key 未配置。请在 config.yaml 的 youmind.api_key 中设置。');
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
        signal: AbortSignal.timeout(30_000),
      });

      if (!resp.ok) {
        const text = await resp.text().catch(() => '');
        throw new Error(`YouMind ${endpoint} failed (${resp.status}): ${text.slice(0, 300)}`);
      }

      return (await resp.json()) as T;
    } catch (e) {
      lastError = e as Error;
      if (base !== baseUrls[baseUrls.length - 1]) {
        console.error(`[WARN] ${base}${endpoint} failed: ${(e as Error).message?.slice(0, 100)}, trying fallback...`);
      }
    }
  }

  throw lastError ?? new Error(`YouMind ${endpoint} all base URLs failed`);
}

// ---------------------------------------------------------------------------
// Public API — wrapped YouMind endpoints
// ---------------------------------------------------------------------------

/** Check whether the user has bound their Threads account on YouMind. */
export async function getBindingStatus(cfg: ThreadsConfig): Promise<BindingStatus> {
  return post<BindingStatus>('/threads/status', {}, cfg);
}

/** Query Meta's per-user publishing quota (proxied by YouMind). */
export async function getPublishingLimits(cfg: ThreadsConfig): Promise<PublishingLimits> {
  return post<PublishingLimits>('/threads/limits', {}, cfg);
}

/** Create a Threads container. Container must be published within ~15 minutes. */
export async function createContainer(
  cfg: ThreadsConfig,
  input: CreateContainerInput,
): Promise<{ container_id: string }> {
  const body: Record<string, unknown> = {
    text: input.text,
    media_type: input.mediaType,
  };
  if (input.imageUrl) body.image_url = input.imageUrl;
  if (input.videoUrl) body.video_url = input.videoUrl;
  if (input.replyToId) body.reply_to_id = input.replyToId;
  return post<{ container_id: string }>('/threads/createContainer', body, cfg);
}

/** Publish a previously created container. Returns the Threads post id + permalink. */
export async function publishContainer(
  cfg: ThreadsConfig,
  containerId: string,
): Promise<{ id: string; permalink: string }> {
  return post<{ id: string; permalink: string }>(
    '/threads/publishContainer',
    { container_id: containerId },
    cfg,
  );
}

/** List the user's recent Threads posts. */
export async function listPosts(
  cfg: ThreadsConfig,
  limit: number,
): Promise<{ data: ThreadsPost[] }> {
  return post<{ data: ThreadsPost[] }>('/threads/listPosts', { limit }, cfg);
}
```

- [ ] **Step 2: 编译验证**

```bash
cd "$(git rev-parse --show-toplevel)/skills/youmind-threads-article/toolkit" && npx tsc --noEmit
```

预期：通过。

- [ ] **Step 3: 提交**

```bash
git add skills/youmind-threads-article/toolkit/src/threads-api.ts
git commit -m "feat(threads): add threads-api wrapping YouMind proxy endpoints"
```

---

### Task 5: 实现 `profile-manager.ts`

Voice/history/lessons 沉淀的 IO 模块。严格对应 spec 接口。**不执行用户交互**（spec 明确要求 onboarding 放在 `cli.ts`）。

**文件:**
- 新建: `skills/youmind-threads-article/toolkit/src/profile-manager.ts`

- [ ] **Step 1: 写完整文件**

```typescript
/**
 * profile-manager.ts — voice/history/lessons persistence for Threads profiles.
 *
 * IO-only module. Does not prompt users or make decisions about profile contents.
 * Onboarding (first-time profile creation) lives in cli.ts.
 *
 * Storage layout (all under skill root):
 *   profiles/
 *     _index.json          (committed marker, this module ignores it)
 *     <name>/
 *       voice.yaml         (VoiceProfile)
 *       history.yaml       (HistoryEntry[], append-only list)
 *       lessons.md         (markdown, append-only)
 */

import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
} from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface VoiceProfile {
  name: string;
  created_at: string;
  tone: string;
  persona: string;
  pov: string;
  chain: {
    length_preference: 'short' | 'medium' | 'long';
    hook_style: string;
    payoff_required: boolean;
  };
  hashtags: {
    strategy: 'inline' | 'trailing' | 'none';
    max_count: number;
  };
  reference_threads: string[];
  blacklist_words: string[];
}

export interface HistoryEntry {
  date: string;
  topic: string;
  segments: number;
  char_total: number;
  posts: Array<{ index: number; id: string; permalink: string }>;
  stats: null | { likes?: number; reposts?: number; replies?: number };
}

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_DIR = resolve(__dirname, '../..');
const PROFILES_DIR = resolve(PROJECT_DIR, 'profiles');

function profileDir(name: string): string {
  return resolve(PROFILES_DIR, name);
}

function ensureProfileDir(name: string): string {
  const d = profileDir(name);
  if (!existsSync(d)) {
    mkdirSync(d, { recursive: true });
  }
  return d;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** List profile names found on disk (excludes _index.json marker). */
export function listProfiles(): string[] {
  if (!existsSync(PROFILES_DIR)) return [];
  return readdirSync(PROFILES_DIR)
    .filter(name => {
      if (name.startsWith('_') || name.startsWith('.')) return false;
      const full = resolve(PROFILES_DIR, name);
      return statSync(full).isDirectory();
    })
    .sort();
}

/** Load a voice profile, or null if not found. */
export function loadProfile(name: string): VoiceProfile | null {
  const p = resolve(profileDir(name), 'voice.yaml');
  if (!existsSync(p)) return null;
  const parsed = parseYaml(readFileSync(p, 'utf-8'));
  if (!parsed || typeof parsed !== 'object') return null;
  return parsed as VoiceProfile;
}

/** Write (create or overwrite) voice.yaml. */
export function saveProfile(profile: VoiceProfile): void {
  ensureProfileDir(profile.name);
  const p = resolve(profileDir(profile.name), 'voice.yaml');
  writeFileSync(p, stringifyYaml(profile), 'utf-8');
}

/** Append a history entry. Creates history.yaml if missing. */
export function appendHistory(profileName: string, entry: HistoryEntry): void {
  ensureProfileDir(profileName);
  const p = resolve(profileDir(profileName), 'history.yaml');
  let existing: HistoryEntry[] = [];
  if (existsSync(p)) {
    const parsed = parseYaml(readFileSync(p, 'utf-8'));
    if (Array.isArray(parsed)) {
      existing = parsed as HistoryEntry[];
    }
  }
  existing.push(entry);
  writeFileSync(p, stringifyYaml(existing), 'utf-8');
}

/** Load lessons.md content, or empty string if missing. */
export function loadLessons(profileName: string): string {
  const p = resolve(profileDir(profileName), 'lessons.md');
  if (!existsSync(p)) return '';
  return readFileSync(p, 'utf-8');
}

/** Append markdown to lessons.md. Creates the file if missing. */
export function appendLessons(profileName: string, markdown: string): void {
  ensureProfileDir(profileName);
  const p = resolve(profileDir(profileName), 'lessons.md');
  const prefix = existsSync(p) ? '\n\n' : '';
  const current = existsSync(p) ? readFileSync(p, 'utf-8') : '';
  writeFileSync(p, current + prefix + markdown.trimEnd() + '\n', 'utf-8');
}
```

- [ ] **Step 2: 编译验证**

```bash
cd "$(git rev-parse --show-toplevel)/skills/youmind-threads-article/toolkit" && npx tsc --noEmit
```

预期：通过。

- [ ] **Step 3: Smoke test — 验证 IO**

用相同的临时 `.ts` 文件方案跑 smoke test：

```bash
cd "$(git rev-parse --show-toplevel)/skills/youmind-threads-article/toolkit"

cat > _smoke-profile.ts <<'EOF'
import {
  saveProfile, loadProfile, appendHistory,
  appendLessons, loadLessons, listProfiles,
  type VoiceProfile,
} from './src/profile-manager.js';

const profile: VoiceProfile = {
  name: 'test-smoke',
  created_at: '2026-04-08',
  tone: 'casual',
  persona: 'tester',
  pov: 'first person',
  chain: { length_preference: 'short', hook_style: 'question', payoff_required: true },
  hashtags: { strategy: 'none', max_count: 0 },
  reference_threads: [],
  blacklist_words: [],
};

saveProfile(profile);
const loaded = loadProfile('test-smoke');
if (!loaded || loaded.name !== 'test-smoke') throw new Error('saveProfile/loadProfile failed');

appendHistory('test-smoke', {
  date: '2026-04-08T00:00:00Z',
  topic: 'smoke',
  segments: 1,
  char_total: 5,
  posts: [{ index: 1, id: 'fake', permalink: 'https://example.com' }],
  stats: null,
});

appendLessons('test-smoke', '## 2026-04-08\n\n- lesson one');
const lessons = loadLessons('test-smoke');
if (!lessons.includes('lesson one')) throw new Error('appendLessons/loadLessons failed');

const profiles = listProfiles();
if (!profiles.includes('test-smoke')) throw new Error('listProfiles failed');

console.log('profile-manager smoke tests passed. Profiles found:', profiles);
EOF

npx tsx _smoke-profile.ts
rm _smoke-profile.ts
```

预期输出：`profile-manager smoke tests passed. Profiles found: [ 'test-smoke' ]`

- [ ] **Step 4: 清理 smoke 产物**

```bash
rm -rf "$(git rev-parse --show-toplevel)"/skills/youmind-threads-article/profiles/test-smoke
```

确认只剩 `profiles/_index.json`：

```bash
ls "$(git rev-parse --show-toplevel)"/skills/youmind-threads-article/profiles/
```

预期输出：`_index.json`

- [ ] **Step 5: 提交**

```bash
git add skills/youmind-threads-article/toolkit/src/profile-manager.ts
git commit -m "feat(threads): add profile-manager for voice/history/lessons IO"
```

---

### Task 6: 实现 `publisher.ts`

发布编排器。实现 spec 里 `publish()` 的完整 Step 6 逻辑：binding 检查 → quota 检查 → chain 循环 → partial failure → history 追加 → quota 警告。

**文件:**
- 新建: `skills/youmind-threads-article/toolkit/src/publisher.ts`

- [ ] **Step 1: 写完整文件**

```typescript
/**
 * publisher.ts — Threads publishing orchestration.
 *
 * Implements the Step 6 "publish" flow from the design spec:
 *   1. Check binding (return upsell if not bound)
 *   2. Check quota (reject if insufficient)
 *   3. Chain loop (create+publish each segment, chaining via reply_to_id)
 *   4. On mid-chain failure, persist remaining segments as a resumable draft
 *   5. Append history entry (best-effort)
 *   6. Return quota warning if near the daily cap
 *
 * This module performs NO HTTP directly — all network calls go through threads-api.ts.
 */

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  loadThreadsConfig,
  getBindingStatus,
  getPublishingLimits,
  createContainer,
  publishContainer,
  type ThreadsConfig,
  type CreateContainerInput,
} from './threads-api.js';
import { appendHistory } from './profile-manager.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ThreadsSegment {
  text: string;
  index: number;
  total: number;
}

export interface PublishRequest {
  segments: ThreadsSegment[];
  profileName: string;
  /** Attached only to the first segment. */
  imageUrl?: string;
  /** Attached only to the first segment. */
  videoUrl?: string;
  /** If set, the chain starts as a reply to this existing Threads post id. */
  replyToExisting?: string;
  /** Optional; used in the history entry. */
  topic?: string;
  /**
   * If the caller has already persisted a draft to disk, pass its slug so
   * that on partial failure the remaining draft file is named consistently.
   */
  draftSlug?: string;
}

export interface PublishedPost {
  index: number;
  id: string;
  permalink: string;
}

export interface PublishResult {
  bound: boolean;
  posts?: PublishedPost[];
  draftSavedTo?: string;
  upsellMessage?: string;
  partialFailure?: {
    publishedCount: number;
    totalCount: number;
    remainingDraftPath: string;
    /** id of the last successfully published post, to be used as --reply-to on resume */
    lastPublishedId: string;
  };
  quotaWarning?: string;
}

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_DIR = resolve(__dirname, '../..');
const OUTPUT_DIR = resolve(PROJECT_DIR, 'output');

function ensureOutputDir(): void {
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Persist segments that have not yet been published to a resumable draft file.
 * Used when a chain publish fails mid-way.
 */
function saveRemainingDraft(
  segments: ThreadsSegment[],
  profileName: string,
  slug: string,
): string {
  ensureOutputDir();
  const path = resolve(OUTPUT_DIR, `${slug}-remaining.md`);
  const header = `---\nprofile: ${profileName}\nsegments: ${segments.length}\n---\n\n`;
  const body = segments.map(s => `## ${s.index}\n\n${s.text}\n`).join('\n');
  writeFileSync(path, header + body, 'utf-8');
  return path;
}

function buildUpsellMessage(): string {
  return (
    '❌ Threads account not bound on YouMind yet\n\n' +
    'Your thread is ready to go — one more step to publish:\n' +
    '  1. Visit https://youmind.com/settings/integrations\n' +
    '  2. Click "Connect Threads"\n' +
    '  3. Re-run the publish command\n\n' +
    'Once connected, all future posts publish with one command.'
  );
}

function mediaTypeFor(input: PublishRequest, segmentIndex: number): CreateContainerInput['mediaType'] {
  if (segmentIndex !== 1) return 'TEXT';
  if (input.imageUrl) return 'IMAGE';
  if (input.videoUrl) return 'VIDEO';
  return 'TEXT';
}

// ---------------------------------------------------------------------------
// publish — main entry
// ---------------------------------------------------------------------------

export async function publish(req: PublishRequest): Promise<PublishResult> {
  const cfg: ThreadsConfig = loadThreadsConfig();

  // --- 1. Binding check ---
  const status = await getBindingStatus(cfg);
  if (!status.bound) {
    return {
      bound: false,
      draftSavedTo: req.draftSlug ? resolve(OUTPUT_DIR, `${req.draftSlug}.md`) : undefined,
      upsellMessage: buildUpsellMessage(),
    };
  }

  // --- 2. Quota check ---
  const limits = await getPublishingLimits(cfg);
  const needed = req.segments.length;
  const usingReplies = Boolean(req.replyToExisting);
  const available = usingReplies ? limits.quota_replies_remaining : limits.quota_posts_remaining;

  if (available < needed) {
    const kind = usingReplies ? 'reply' : 'post';
    throw new Error(
      `Threads ${kind} quota exhausted: need ${needed}, have ${available}. ` +
      `Resets at ${limits.reset_at}. Draft preserved.`,
    );
  }

  // --- 3. Chain publish loop ---
  const posts: PublishedPost[] = [];
  let replyToId = req.replyToExisting;
  const slug = req.draftSlug ?? `publish-${Date.now()}`;

  for (let i = 0; i < req.segments.length; i++) {
    const segment = req.segments[i];
    try {
      const input: CreateContainerInput = {
        text: segment.text,
        mediaType: mediaTypeFor(req, segment.index),
        imageUrl: segment.index === 1 ? req.imageUrl : undefined,
        videoUrl: segment.index === 1 ? req.videoUrl : undefined,
        replyToId,
      };
      const { container_id } = await createContainer(cfg, input);
      const { id, permalink } = await publishContainer(cfg, container_id);
      posts.push({ index: segment.index, id, permalink });
      replyToId = id;
    } catch (e) {
      // Partial failure: persist remaining segments for resume.
      const remaining = req.segments.slice(i);
      const remainingPath = saveRemainingDraft(remaining, req.profileName, slug);
      const err = e as Error;
      console.error(
        `[ERROR] segment ${segment.index}/${segment.total} failed: ${err.message}. ` +
        `Remaining ${remaining.length} segments saved to ${remainingPath}.`,
      );

      // If this was the first segment, bubble the error up — nothing was published.
      if (posts.length === 0) {
        throw err;
      }

      return {
        bound: true,
        posts,
        partialFailure: {
          publishedCount: posts.length,
          totalCount: req.segments.length,
          remainingDraftPath: remainingPath,
          lastPublishedId: posts[posts.length - 1].id,
        },
      };
    }
  }

  // --- 4. Append history (best-effort) ---
  try {
    appendHistory(req.profileName, {
      date: new Date().toISOString(),
      topic: req.topic ?? '(no topic)',
      segments: req.segments.length,
      char_total: req.segments.reduce((s, x) => s + x.text.length, 0),
      posts,
      stats: null,
    });
  } catch (e) {
    console.warn(`[WARN] history.yaml append failed: ${(e as Error).message}`);
  }

  // --- 5. Quota warning ---
  let quotaWarning: string | undefined;
  const remainingAfter = available - needed;
  if (remainingAfter < 20) {
    quotaWarning = usingReplies
      ? `Threads reply quota low: ${remainingAfter} remaining today (resets ${limits.reset_at})`
      : `Threads post quota low: ${remainingAfter} remaining today (resets ${limits.reset_at})`;
  }

  // --- 6. Token expiry warning ---
  if (status.expires_at) {
    const expiresMs = Date.parse(status.expires_at);
    const daysLeft = (expiresMs - Date.now()) / (1000 * 60 * 60 * 24);
    if (Number.isFinite(daysLeft) && daysLeft < 7) {
      const notice = `Threads token expires in ${Math.max(0, Math.round(daysLeft))} days — reconnect on YouMind soon.`;
      quotaWarning = quotaWarning ? `${quotaWarning}\n${notice}` : notice;
    }
  }

  return { bound: true, posts, quotaWarning };
}
```

- [ ] **Step 2: 编译验证**

```bash
cd "$(git rev-parse --show-toplevel)/skills/youmind-threads-article/toolkit" && npx tsc --noEmit
```

预期：通过。

- [ ] **Step 3: 提交**

```bash
git add skills/youmind-threads-article/toolkit/src/publisher.ts
git commit -m "feat(threads): add publisher with chain loop and partial failure handling"
```

---

### Task 7: 实现 `cli.ts`

所有命令的入口和 IO 层：`publish` / `preview` / `reply` / `validate` / `list` / `limits` / `profile <sub>`。包含 onboarding 辅助命令（`profile create`）和 draft 文件解析。

**文件:**
- 新建: `skills/youmind-threads-article/toolkit/src/cli.ts`

- [ ] **Step 1: 写完整文件**

```typescript
#!/usr/bin/env node

/**
 * CLI for the youmind-threads-article skill.
 *
 * Commands:
 *   publish <input>                    full flow (input = draft file path or inline text)
 *   preview <input>                    steps 1-5, no actual publishing
 *   reply <parent_id> "<text>"         post a single reply to an existing Threads post
 *   validate                           check YouMind key + Threads binding
 *   list [--limit N]                   recent posts
 *   limits                             today's Threads publishing/reply quota
 *   profile list                       list known profiles
 *   profile show <name>                print profile voice.yaml contents
 *   profile create --name X --tone "" --length short|medium|long --hashtags inline|trailing|none
 *
 * Profile onboarding is interactive via `profile create` flags. The agent (following
 * SKILL.md instructions) asks the user about tone/length/hashtags via AskUserQuestion
 * and then calls `profile create` non-interactively with the answers.
 */

import { Command } from 'commander';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';
import {
  loadThreadsConfig,
  getBindingStatus,
  getPublishingLimits,
  listPosts,
  createContainer,
  publishContainer,
} from './threads-api.js';
import {
  loadProfile,
  saveProfile,
  listProfiles,
  type VoiceProfile,
} from './profile-manager.js';
import { publish, type ThreadsSegment, type PublishResult } from './publisher.js';
import { validateSegment } from './content-adapter.js';

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_DIR = resolve(__dirname, '../..');
const OUTPUT_DIR = resolve(PROJECT_DIR, 'output');

function ensureOutputDir(): void {
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

// ---------------------------------------------------------------------------
// Draft parsing
// ---------------------------------------------------------------------------

interface ParsedDraft {
  profile?: string;
  topic?: string;
  segments: string[];
  slug: string;
}

/**
 * Parse a draft file with optional YAML frontmatter and `## N` sections.
 * If no sections are found, the whole body is treated as a single segment.
 */
function parseDraftFile(filePath: string): ParsedDraft {
  const content = readFileSync(filePath, 'utf-8');
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

  let metadata: Record<string, unknown> = {};
  let body = content;
  if (fmMatch) {
    const parsed = parseYaml(fmMatch[1]);
    if (parsed && typeof parsed === 'object') {
      metadata = parsed as Record<string, unknown>;
    }
    body = fmMatch[2];
  }

  // Match "## N" headings at the start of a line (allow trailing whitespace)
  const sectionRegex = /^##\s+(\d+)\s*$/gm;
  const matches: Array<{ n: number; start: number; end: number }> = [];
  let m: RegExpExecArray | null;
  while ((m = sectionRegex.exec(body)) !== null) {
    matches.push({ n: parseInt(m[1], 10), start: m.index, end: m.index + m[0].length });
  }

  // Sort by order of appearance; split body into sections
  const segments: string[] = [];
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].end;
    const end = i + 1 < matches.length ? matches[i + 1].start : body.length;
    segments.push(body.slice(start, end).trim());
  }

  if (segments.length === 0) {
    const trimmed = body.trim();
    if (trimmed.length > 0) segments.push(trimmed);
  }

  const base = filePath.split('/').pop() ?? 'draft.md';
  const slug = base.replace(/\.md$/i, '');

  return {
    profile: metadata.profile as string | undefined,
    topic: metadata.topic as string | undefined,
    segments,
    slug,
  };
}

/**
 * Resolve user-provided input into a parsed draft.
 * If input is an existing file path, parse it. Otherwise treat input as a
 * single inline segment.
 */
function resolveInput(input: string): ParsedDraft {
  const p = resolve(process.cwd(), input);
  if (!input.includes('\n') && existsSync(p)) {
    return parseDraftFile(p);
  }
  return {
    segments: [input.trim()],
    slug: `inline-${Date.now()}`,
  };
}

// ---------------------------------------------------------------------------
// Profile helpers
// ---------------------------------------------------------------------------

function requireProfile(name: string): VoiceProfile {
  const profile = loadProfile(name);
  if (!profile) {
    console.error(
      `[ERROR] Profile '${name}' not found.\n` +
      `  Create it via:\n` +
      `    npx tsx src/cli.ts profile create --name ${name} --tone "<tone>" --length short|medium|long --hashtags inline|trailing|none\n` +
      `  Or have the agent ask the user (tone, length, hashtags) and call profile create with those answers.`,
    );
    process.exit(1);
  }
  return profile;
}

function validateAllSegments(segments: string[]): ThreadsSegment[] {
  const total = segments.length;
  const out: ThreadsSegment[] = [];
  segments.forEach((text, i) => {
    const v = validateSegment(text);
    if (!v.ok) {
      console.error(`[ERROR] Segment ${i + 1}/${total} invalid: ${v.error}`);
      console.error(`        Content: ${text.slice(0, 80)}${text.length > 80 ? '...' : ''}`);
      process.exit(1);
    }
    out.push({ text, index: i + 1, total });
  });
  return out;
}

function savePrimaryDraft(slug: string, profile: string, topic: string | undefined, segments: string[]): string {
  ensureOutputDir();
  const path = resolve(OUTPUT_DIR, `${slug}.md`);
  if (existsSync(path)) return path; // preserve agent-written version
  const frontmatter = [
    '---',
    `profile: ${profile}`,
    ...(topic ? [`topic: ${JSON.stringify(topic)}`] : []),
    `segments: ${segments.length}`,
    '---',
    '',
  ].join('\n');
  const body = segments.map((text, i) => `## ${i + 1}\n\n${text}\n`).join('\n');
  writeFileSync(path, frontmatter + body, 'utf-8');
  return path;
}

function printPublishResult(result: PublishResult): void {
  if (!result.bound) {
    if (result.draftSavedTo) {
      console.log(`✔ Draft saved to: ${result.draftSavedTo}\n`);
    }
    console.log(result.upsellMessage ?? 'Threads account not bound.');
    return;
  }

  const count = result.posts?.length ?? 0;

  if (result.partialFailure) {
    const pf = result.partialFailure;
    console.log(`\n⚠️  Partial publish: ${pf.publishedCount}/${pf.totalCount} segments published.`);
    console.log(`Remaining segments saved to: ${pf.remainingDraftPath}`);
    console.log(
      `Resume with: npx tsx src/cli.ts publish ${pf.remainingDraftPath} --reply-to ${pf.lastPublishedId}`,
    );
    if (result.posts && result.posts[0]) {
      console.log(`First published post: ${result.posts[0].permalink}`);
    }
    return;
  }

  console.log(`\n✔ Published ${count} ${count === 1 ? 'post' : 'posts'} to Threads`);
  if (result.posts && result.posts[0]) {
    console.log(`First post: ${result.posts[0].permalink}`);
  }
  if (result.quotaWarning) {
    console.log(`\n⚠️  ${result.quotaWarning}`);
  }
}

// ---------------------------------------------------------------------------
// Commander setup
// ---------------------------------------------------------------------------

const program = new Command();

program
  .name('youmind-threads')
  .description('AI-powered Meta Threads publisher via YouMind proxy')
  .version('1.0.0');

// --- publish ---
program
  .command('publish <input>')
  .description('Publish a thread (full chain) or single post to Threads')
  .option('--profile <name>', 'Voice profile name', 'default')
  .option('--image <url>', 'Image URL (attached to first segment only)')
  .option('--video <url>', 'Video URL (attached to first segment only)')
  .option('--topic <text>', 'Topic (saved in history)')
  .option('--reply-to <id>', 'Start the chain as a reply to an existing Threads post id (used by partial-failure resume)')
  .action(async (input: string, opts: Record<string, string | undefined>) => {
    try {
      const parsed = resolveInput(input);
      const profileName = opts.profile ?? parsed.profile ?? 'default';
      requireProfile(profileName);

      const segments = validateAllSegments(parsed.segments);
      if (segments.length > 12) {
        console.warn(`[WARN] ${segments.length} segments — this is a long thread. Consider condensing.`);
      }

      // Ensure the primary draft file exists (for lesson-diffing later)
      const draftPath = savePrimaryDraft(parsed.slug, profileName, parsed.topic ?? opts.topic, parsed.segments);
      console.log(`Draft: ${draftPath}`);

      const result = await publish({
        segments,
        profileName,
        imageUrl: opts.image,
        videoUrl: opts.video,
        topic: parsed.topic ?? opts.topic,
        replyToExisting: opts.replyTo,
        draftSlug: parsed.slug,
      });
      printPublishResult(result);
    } catch (e) {
      console.error(`[ERROR] ${(e as Error).message}`);
      process.exit(1);
    }
  });

// --- preview ---
program
  .command('preview <input>')
  .description('Preview a thread locally without publishing')
  .option('--profile <name>', 'Voice profile name', 'default')
  .action((input: string, opts: Record<string, string | undefined>) => {
    try {
      const parsed = resolveInput(input);
      const profileName = opts.profile ?? parsed.profile ?? 'default';
      requireProfile(profileName);
      const segments = validateAllSegments(parsed.segments);

      console.log(`\n=== Threads Preview (profile: ${profileName}) ===`);
      if (parsed.topic) console.log(`Topic: ${parsed.topic}`);
      console.log(`Segments: ${segments.length}`);
      console.log(`Total chars: ${segments.reduce((s, x) => s + x.text.length, 0)}\n`);
      segments.forEach(s => {
        console.log(`--- ${s.index}/${s.total} (${s.text.length} chars) ---`);
        console.log(s.text);
        console.log('');
      });
    } catch (e) {
      console.error(`[ERROR] ${(e as Error).message}`);
      process.exit(1);
    }
  });

// --- reply ---
program
  .command('reply <parent_id> <text>')
  .description('Post a single reply to an existing Threads post')
  .option('--profile <name>', 'Voice profile name', 'default')
  .action(async (parentId: string, text: string, opts: Record<string, string | undefined>) => {
    try {
      const profileName = opts.profile ?? 'default';
      requireProfile(profileName);
      const segments = validateAllSegments([text.trim()]);

      const result = await publish({
        segments,
        profileName,
        replyToExisting: parentId,
      });
      printPublishResult(result);
    } catch (e) {
      console.error(`[ERROR] ${(e as Error).message}`);
      process.exit(1);
    }
  });

// --- validate ---
program
  .command('validate')
  .description('Check YouMind API key and Threads binding status')
  .action(async () => {
    try {
      const cfg = loadThreadsConfig();
      if (!cfg.apiKey) {
        console.error('[ERROR] youmind.api_key not set in config.yaml');
        process.exit(1);
      }
      console.log('YouMind API key: configured');

      const status = await getBindingStatus(cfg);
      if (!status.bound) {
        console.log('Threads binding: NOT BOUND');
        console.log('→ Visit https://youmind.com/settings/integrations to connect your Threads account');
        return;
      }
      console.log(`Threads binding: bound as @${status.username ?? '?'}`);
      if (status.expires_at) {
        console.log(`Token expires: ${status.expires_at}`);
      }

      const limits = await getPublishingLimits(cfg);
      console.log(`\nToday's quota:`);
      console.log(`  Posts:   ${limits.quota_posts_remaining} remaining`);
      console.log(`  Replies: ${limits.quota_replies_remaining} remaining`);
      console.log(`  Reset:   ${limits.reset_at}`);
    } catch (e) {
      console.error(`[ERROR] Validation failed: ${(e as Error).message}`);
      process.exit(1);
    }
  });

// --- list ---
program
  .command('list')
  .description('List recent Threads posts')
  .option('--limit <n>', 'Number of posts to fetch', '10')
  .action(async (opts: Record<string, string>) => {
    try {
      const cfg = loadThreadsConfig();
      const limit = parseInt(opts.limit ?? '10', 10);
      const result = await listPosts(cfg, limit);

      console.log(`\n--- Recent posts (${result.data.length}) ---\n`);
      for (const post of result.data) {
        const preview = post.text ? post.text.slice(0, 80) + (post.text.length > 80 ? '...' : '') : '(no text)';
        console.log(`[${post.created_time ?? '?'}] ${post.id}`);
        console.log(`  ${preview}`);
        console.log(`  ${post.permalink}`);
        console.log('');
      }
    } catch (e) {
      console.error(`[ERROR] ${(e as Error).message}`);
      process.exit(1);
    }
  });

// --- limits ---
program
  .command('limits')
  .description('Show today\'s Threads publishing/reply quota')
  .action(async () => {
    try {
      const cfg = loadThreadsConfig();
      const limits = await getPublishingLimits(cfg);
      console.log(`Posts remaining:   ${limits.quota_posts_remaining}`);
      console.log(`Replies remaining: ${limits.quota_replies_remaining}`);
      console.log(`Resets at:         ${limits.reset_at}`);
    } catch (e) {
      console.error(`[ERROR] ${(e as Error).message}`);
      process.exit(1);
    }
  });

// --- profile ---
const profileCmd = program.command('profile').description('Manage voice profiles');

profileCmd
  .command('list')
  .description('List known profiles')
  .action(() => {
    const names = listProfiles();
    if (names.length === 0) {
      console.log('No profiles yet. Create one with: profile create --name default --tone "..." --length short --hashtags none');
      return;
    }
    for (const name of names) {
      console.log(name);
    }
  });

profileCmd
  .command('show <name>')
  .description('Show a profile\'s voice.yaml contents')
  .action((name: string) => {
    const profile = loadProfile(name);
    if (!profile) {
      console.error(`[ERROR] Profile '${name}' not found`);
      process.exit(1);
    }
    console.log(JSON.stringify(profile, null, 2));
  });

profileCmd
  .command('create')
  .description('Create a new voice profile (typically called by the agent after asking the user)')
  .requiredOption('--name <name>', 'Profile name (e.g. default)')
  .requiredOption('--tone <tone>', 'Tone description (free text)')
  .requiredOption('--length <short|medium|long>', 'Chain length preference')
  .requiredOption('--hashtags <inline|trailing|none>', 'Hashtag strategy')
  .option('--persona <persona>', 'Persona description', '')
  .option('--pov <pov>', 'Point of view', 'first person singular')
  .option('--hook-style <style>', 'Hook style', 'counter-intuitive claim')
  .option('--max-hashtags <n>', 'Max hashtags per thread', '0')
  .action((opts: Record<string, string>) => {
    const length = opts.length as 'short' | 'medium' | 'long';
    if (!['short', 'medium', 'long'].includes(length)) {
      console.error(`[ERROR] --length must be short, medium, or long`);
      process.exit(1);
    }
    const strategy = opts.hashtags as 'inline' | 'trailing' | 'none';
    if (!['inline', 'trailing', 'none'].includes(strategy)) {
      console.error(`[ERROR] --hashtags must be inline, trailing, or none`);
      process.exit(1);
    }

    const profile: VoiceProfile = {
      name: opts.name,
      created_at: new Date().toISOString().slice(0, 10),
      tone: opts.tone,
      persona: opts.persona,
      pov: opts.pov,
      chain: {
        length_preference: length,
        hook_style: opts.hookStyle ?? 'counter-intuitive claim',
        payoff_required: true,
      },
      hashtags: {
        strategy,
        max_count: parseInt(opts.maxHashtags ?? '0', 10),
      },
      reference_threads: [],
      blacklist_words: [],
    };
    saveProfile(profile);
    console.log(`Profile '${profile.name}' saved to profiles/${profile.name}/voice.yaml`);
  });

// --- publish-container (hidden retry helper) ---
program
  .command('publish-container <container_id>', { hidden: true })
  .description('Retry publishing a previously created Threads container')
  .action(async (containerId: string) => {
    try {
      const cfg = loadThreadsConfig();
      const result = await publishContainer(cfg, containerId);
      console.log(`Published: ${result.permalink}`);
    } catch (e) {
      console.error(`[ERROR] ${(e as Error).message}`);
      process.exit(1);
    }
  });

// --- create-container (hidden debug helper) ---
program
  .command('create-container <text>', { hidden: true })
  .description('Create a Threads container without publishing (debug)')
  .option('--reply-to <id>', 'Reply target post id')
  .action(async (text: string, opts: Record<string, string | undefined>) => {
    try {
      const cfg = loadThreadsConfig();
      const result = await createContainer(cfg, {
        text,
        mediaType: 'TEXT',
        replyToId: opts.replyTo,
      });
      console.log(`Container: ${result.container_id}`);
    } catch (e) {
      console.error(`[ERROR] ${(e as Error).message}`);
      process.exit(1);
    }
  });

program.parse();
```

- [ ] **Step 2: 编译验证（完整 build）**

```bash
cd "$(git rev-parse --show-toplevel)/skills/youmind-threads-article/toolkit" && npm run build
```

预期：`dist/` 目录被创建，无类型错误。

- [ ] **Step 3: Smoke test — profile create / list / show**

```bash
cd "$(git rev-parse --show-toplevel)/skills/youmind-threads-article/toolkit"
npx tsx src/cli.ts profile create --name default --tone "技术同行聊天" --length short --hashtags none
npx tsx src/cli.ts profile list
npx tsx src/cli.ts profile show default
```

预期：
- 第一条输出 `Profile 'default' saved to profiles/default/voice.yaml`
- 第二条输出 `default`
- 第三条输出 JSON 格式的 voice profile

- [ ] **Step 4: Smoke test — preview inline text**

```bash
cd "$(git rev-parse --show-toplevel)/skills/youmind-threads-article/toolkit"
npx tsx src/cli.ts preview "Hello Threads. This is a test."
```

预期：预览 1 段，显示字符数。

- [ ] **Step 5: Smoke test — preview file with sections**

先创建一个临时 draft：

```bash
cd "$(git rev-parse --show-toplevel)/skills/youmind-threads-article"
mkdir -p output
cat > output/smoke-draft.md <<'EOF'
---
profile: default
topic: "smoke test"
segments: 2
---

## 1

This is segment one. Short and sweet.

## 2

This is segment two. Also short.
EOF

cd toolkit
npx tsx src/cli.ts preview ../output/smoke-draft.md
```

预期：显示 2 段预览，每段字数正确。

- [ ] **Step 6: Smoke test — validateSegment reject**

```bash
cd "$(git rev-parse --show-toplevel)/skills/youmind-threads-article/toolkit"
# 构造 501 字符的段——应该被拒绝
npx tsx src/cli.ts preview "$(printf 'a%.0s' {1..501})" || echo "OK — rejected as expected"
```

预期：CLI 打印错误并退出非零，`OK — rejected as expected` 出现。

- [ ] **Step 7: 清理 smoke 产物**

```bash
rm -rf "$(git rev-parse --show-toplevel)"/skills/youmind-threads-article/profiles/default
rm -f "$(git rev-parse --show-toplevel)"/skills/youmind-threads-article/output/smoke-draft.md
```

- [ ] **Step 8: 提交**

```bash
git add skills/youmind-threads-article/toolkit/src/cli.ts
git commit -m "feat(threads): add cli with publish/preview/reply/validate/profile commands"
```

---

### Task 8: 写 `references/pipeline.md`

Agent 运行时读取的流程文档。直接对应 spec 的 "Pipeline" 章节。

**文件:**
- 新建: `skills/youmind-threads-article/references/pipeline.md`

- [ ] **Step 1: 写完整文件**

````markdown
# Threads Publishing Pipeline

## 概览

```
解析请求 -> 加载 profile -> 研究 -> 写作+分段 -> 预览 -> 发布 -> 沉淀 -> 汇报
```

## 步骤详解

| # | 名称 | 动作 | 降级策略 |
| --- | --- | --- | --- |
| 1 | 解析请求 | 判断是 topic / raw-file / reply，选择 profile | — |
| 2 | 加载 profile | 读 `profiles/{name}/voice.yaml` 和 `lessons.md` | profile 缺失时触发 onboarding（见下） |
| 3 | 研究 | `youmind.mineTopics` + `youmind.webSearch` | 出错则跳过，仅凭 topic 写作 |
| 4 | 写作 + 拆分 | Agent 读 `writing-guide.md`、`chain-splitting.md`、profile voice、lessons、研究素材 → 写 `output/<slug>.md` 和字节一致的 `output/<slug>.md.agent` 快照 | 无效段最多重写 2 次；>12 段时警告 |
| 5 | 预览 | 在终端显示分段结果（`cli.ts preview`） | — |
| 6 | 发布 | `cli.ts publish <file>`：CLI 自动做 binding check、quota check、chain loop、partial failure 处理 | 见错误处理 |
| 7 | 沉淀 | Append `history.yaml`（由 `publisher.ts` 自动完成）；若草稿被编辑过，agent 对比 `<slug>.md` vs `<slug>.md.agent` 并 append `lessons.md`；可选 `youmind.saveArticle` 归档 | best-effort，失败只 log warn |
| 8 | 汇报 | 展示首条 permalink、总段数、profile 名、配额警告（如有） | — |

## Step 4 写作详解（重要）

Agent 写作时必须同时产出两份文件：

1. `output/<slug>.md` —— 用户可编辑的工作副本，后续会被 `publish` 读取
2. `output/<slug>.md.agent` —— agent 原始输出的**冻结快照**，永不修改

这两份文件在写入时必须字节一致。快照用于 Step 7 的 lessons diff。两份都在 git-ignored 的 `output/` 目录下。

Slug 规则：kebab-case，描述性（例如 `ai-coding-tools-thread.md`），不要用时间戳。

## Profile Onboarding（首次使用）

当 `profiles/default/voice.yaml` 不存在、用户又触发 `publish` 或 `preview` 时：

1. **优先使用 `AskUserQuestion` 工具**（如果 host 支持）提三个结构化问题：
   - 整体**语气**（例如 "技术同行聊天，有梗但不刻意" / "专业严谨，偏企业语气" / "朋友聊天，轻松随性"）
   - 线程**长度偏好**：`short`（3-5 段）/ `medium`（6-10 段）/ `long`（11+ 段）
   - **Hashtag 策略**：`inline`（穿插进正文）/ `trailing`（末尾集中）/ `none`（不用）
2. 若 `AskUserQuestion` 不可用，降级为纯文本多选（打印编号选项，让用户用字母回答）
3. 拿到答案后**直接调用** CLI 写入 profile：

   ```bash
   npx tsx src/cli.ts profile create \
     --name default \
     --tone "<用户回答的语气描述>" \
     --length short|medium|long \
     --hashtags inline|trailing|none
   ```

4. 继续执行用户原本的 `publish` / `preview` 请求

## 路由快捷键

| 用户输入 | 入口 |
| --- | --- |
| 只有 topic | Step 2（完整流程） |
| `output/*.md` 文件路径 | Step 5（跳过写作） |
| `reply <parent_id> "<text>"` | Step 4 简化版 + Step 6 带 `replyToExisting` |
| `preview <input>` | Step 4 + Step 5，不进 Step 6 |
| `validate` / `list` / `profile *` | 直接调 `cli.ts` 对应命令 |

## Step 7 Lessons Diff 详解

发布成功后，agent（同一对话内，无需额外 API 调用）：

1. 读 `output/<slug>.md`（用户最终版本）
2. 读 `output/<slug>.md.agent`（agent 原始快照）
3. 如果两份文件字节一致 → 跳过 diff，什么也不做
4. 如果有差异 → 对比分析，总结 2-3 条规律（例如 "用户删掉了所有段开头的'说实话'"），以 markdown 形式 append 到 `profiles/<name>/lessons.md`

Lessons 的格式按日期分组：

```markdown
## 2026-04-08

- 用户删除了所有段落开头的"说实话"、"讲真"这类口水词 → 下次避免使用
- 用户把"5 个工具"改成"5 款工具" → 偏好用"款"而非"个"作工具量词
- 用户把第 2 段和第 3 段合并成更短的一段 → hook 需要更快收束
```

下次 agent 为这个 profile 写作时，会同时读取 `voice.yaml` 和 `lessons.md`，并把 lessons 当作**硬约束**。

## 错误处理速查

| 步骤 | 失败场景 | 处理 |
| --- | --- | --- |
| 2 | `voice.yaml` 缺失 | 触发 onboarding（非错误） |
| 3 | YouMind research 出错 | log warn，继续 |
| 4 | 某段 >500 字符 | Agent 重写该段（最多 2 次）；仍失败硬截断并警告 |
| 4 | >12 段 | 警告，询问用户是否压缩 |
| 4 | 图片/视频不符合 Meta 规格 | `validateImageUrl`/`validateVideoUrl` 在发布前报错 |
| 6 | `bound: false` | **非错误**：CLI 返回 upsell 文案，草稿已保存 |
| 6 | `createContainer` 首段失败 | CLI 报错退出，草稿保留 |
| 6 | `createContainer` 中段失败 | CLI 保存剩余段到 `<slug>-remaining.md`，提示 `publish <remaining-path> --reply-to <last-published-id>` 续发 |
| 6 | `publishContainer` 失败 | CLI 打印 `container_id`，提示用隐藏命令 `publish-container <id>` 重试 |
| 6 | 配额耗尽 | CLI 读 `getPublishingLimits` 报告 reset 时间；草稿保留 |
| 6 | Token 剩余 <7 天 | 发布成功后提示警告 |
| 7 | `history.yaml` / lessons 写入失败 | log warn，不影响发布 |
````

- [ ] **Step 2: 提交**

```bash
git add skills/youmind-threads-article/references/pipeline.md
git commit -m "docs(threads): add pipeline reference"
```

---

### Task 9: 写 `references/writing-guide.md`

Agent 运行时的 Threads 写作指南。来自 spec "模型驱动拆分" 章节 + 现有 x-article 的经验。

**文件:**
- 新建: `skills/youmind-threads-article/references/writing-guide.md`

- [ ] **Step 1: 写完整文件**

````markdown
# Threads Writing Guide

## 为什么 Threads 特殊

Threads 不是 Twitter 的翻版，也不是 Facebook 的短版。它的 DNA 是：
- **对话优先**：一条贴子的"地基"是回复而不是转发
- **文本为主**：短视频留给 Instagram Reels
- **无话题标签氛围**：Hashtag 不是推荐算法的主力
- **慢节奏**：用户滑得没有 Twitter 那么快，愿意读完一个贴子再滑

所以好的 Threads 内容应该：

1. **有对话感**：像在咖啡馆给朋友讲一件事，不是演讲
2. **信息密度均匀**：不要前 20% 塞所有干货
3. **线程感要合理**：如果一段话说得清楚，就别硬凑 5 段
4. **Hook 用"反常识"**：用户已经滑了 100 条贴子，得给他停下来的理由

## Voice 的三要素

每次写作前，**先读当前 profile 的 `voice.yaml` 和 `lessons.md`**。严格遵守：

- `tone`：语气描述（例如 "技术同行聊天，有梗但不刻意"）—— 这是基调
- `persona`：人设（例如 "在 AI 行业泡了 5 年的从业者"）—— 这是 POV
- `pov`：叙事视角（例如 "第一人称单数"）—— 统一叙事视角
- `chain.hook_style`：hook 偏好（例如 "反常识陈述"）
- `chain.length_preference`：长度偏好（short / medium / long）
- `chain.payoff_required`：如果为 `true`，结尾必须有明确收束，不能半路断掉

**`lessons.md` 是硬约束**，不是建议。用户在过往发布中修改过的东西，下次一定要避免重复。

## 线程结构（Hook → Tension → Body → Payoff）

这是通用骨架，具体字数按 profile 的 length 偏好调整：

### 1. Hook（第 1 段）
- 60-150 字符
- 紧凑、尖锐、独立成立
- **不要**引子（"最近在想一个问题..."），直接上冲突
- hook_style 的四种常见形态：
  - **反常识陈述**："大多数 AI 工具不是让你更快，是让你更懒"
  - **尖锐提问**："你上一次真正'思考'是什么时候？不是查资料。"
  - **场景白描**："凌晨两点，Cursor 的 autocomplete 写出了我写不出的函数"
  - **数据冲击**："5 款主流 AI 工具，3 款我一周后就卸载了。原因只有一个。"

### 2. Tension（第 2-3 段）
- 200-400 字符
- 展开冲突、给出背景，让读者"带入"
- 回答："为什么你要听我说这个？"

### 3. Body（中间若干段）
- 200-450 字符 / 段
- 每段一个论点，论点之间有逻辑递进
- 避免"首先、其次、最后"这种正文结构词——太书面
- 用自然转折："而我后来发现..."、"真正让我改主意的是..."

### 4. Payoff（收尾段）
- 100-300 字符
- 干净落地，给出"可以带走的东西"
- 不要大喊 "觉得有用请点赞"——Threads 不吃这套

## 禁忌清单

- **不要**在段文本里加 "1/5"、"1/N" 这种序号前缀。Threads UI 自己会显示线程关系
- **不要**用 Markdown 符号（`**`、`#`、列表符号）—— Threads 不渲染
- **不要**一段话超过 500 字符（硬限制）
- **不要**一段话塞超过 5 个 URL（硬限制）
- **不要**"AI 腔"：
  - "让我们来看看..." → 删掉
  - "综上所述..." → 删掉
  - "值得注意的是..." → 换成具体描述
  - "在当今时代..." → 直接说当下发生了什么
- **不要**把所有 emoji 都塞第一行。稀疏使用。

## 与研究素材的关系

如果 Step 3 产生了研究素材（YouMind mineTopics / webSearch 结果）：

1. **不要**把素材原文直接塞进段落——那叫抄
2. 找 1-2 个**具体的数字、引语或事件**作为贴子的"锚点"
3. 把素材当作"你刚听说的事"来讲，不是"我在做一个综述"

## 字符计数规则

- JavaScript 的 `String.prototype.length` 对绝大多数文本（包括大部分 emoji）已经足够准确
- 校验函数 `validateSegment()` 会在 publish 前检查每段是否 ≤500 chars、URL 数 ≤5
- 如果你的段落被拒绝，**重写那一段**，不要硬截断
- 一段最多重写 2 次；仍失败就警告用户并建议合并或拆分

## 双份文件规则

每次写作必须同时产出：

1. `output/<slug>.md` —— 带 frontmatter + 分段的工作副本
2. `output/<slug>.md.agent` —— 和 #1 字节完全一致的冻结快照

快照不会被修改。发布成功后，agent 会对比两份文件做 lessons diff。

Frontmatter 格式：

```markdown
---
profile: default
topic: "AI 编程工具现状"
segments: 4
---

## 1

第 1 段文本

## 2

第 2 段文本
```
````

- [ ] **Step 2: 提交**

```bash
git add skills/youmind-threads-article/references/writing-guide.md
git commit -m "docs(threads): add writing-guide reference"
```

---

### Task 10: 写 `references/chain-splitting.md`

Agent 运行时的拆分指令。直接对应 spec "模型驱动拆分（agent 指令）" 章节。

**文件:**
- 新建: `skills/youmind-threads-article/references/chain-splitting.md`

- [ ] **Step 1: 写完整文件**

````markdown
# Chain Splitting Instructions

这份文档是 **agent 运行时指令**，不是 skill 代码读取的。当用户要求写一个 Threads chain 时，按下面的步骤走。

## 前置读取（必做）

在决定分几段之前，按顺序读：

1. `profiles/<name>/voice.yaml` —— 长度偏好、hook 风格、payoff 要求
2. `profiles/<name>/lessons.md`（如果存在）—— 从过往编辑中学到的规律，**视作硬约束**
3. `references/writing-guide.md` —— 基本写作纪律

## 拆分原则

### 1. 先写完整长文，再拆

不要一边写一边分段。先写一篇连贯的文章（中等长度：500-2000 字），然后再按下面的规则切开。直接分段写会出现：
- 每段都想"独立成立"，结果段与段之间跳跃
- 重复结构（每段都是一个小段落开头的 hook）
- 关键论证被硬生生切断

### 2. 在读者自然换气处切

切分的唯一标准是：**读者的眼睛在哪里会停？**

好的切点：
- 一个新论点出现
- 情绪节拍变化（从陈述转为质问、从铺陈转为结论）
- 一段话讲完了一件完整的小事

坏的切点（绝对不要）：
- 在一个论证的中间
- 在一个并列项的中间（"有三个原因，第一..." → 不要切）
- 在一个句子中间

### 3. 字数分布

按 profile 的 `length_preference` 取基准：

| 偏好 | 段数 | 每段字数 |
| --- | --- | --- |
| `short` | 3-5 | 80-400 |
| `medium` | 6-10 | 100-400 |
| `long` | 11-16 | 100-450 |

以及结构性约束：

- **第 1 段（Hook）**：60-150 字符。紧凑。强制的。
- **中间段**：200-450 字符。有"呼吸"的空间。
- **收尾段**：100-300 字符。干净落地。

**超过 500 字符的段一定要重写**，不能硬截断（硬截断会切断语义）。

### 4. 段与段之间的"接缝"

每段开头**不要**这样写：
- "所以..."、"因此..." —— 正文感太强
- "第二，..." 、"其次，..." —— Threads 不是论文
- "[emoji] [emoji] ..." —— 堆 emoji

好的接缝是：
- 一个具体的转折词："后来..."、"直到..."、"真正让我改主意的是..."
- 一个新的视角："从用户角度看，这个问题更刺眼..."
- 一个直白的提问："那怎么办？"

### 5. 校验每段

写完每段后，**在脑子里跑一下 `validateSegment`**：

- 字数 ≤500？
- URL 数量 ≤5？
- 单独读这段，能不能大致看懂？（不要求完全独立，但不能是"空气段"）

如果不通过，**重写那一段**，不要硬截断。

### 6. 产出文件

```markdown
---
profile: <profile-name>
topic: <topic-string>
segments: <N>
---

## 1

<段 1 文本，不带序号前缀>

## 2

<段 2 文本>

...
```

**不要**在段文本里写 "1/5"、"（1/4）"、"Thread 🧵" 等序号或标记。Threads UI 会自动显示线程关系。

写好后，**把相同的内容也写到 `output/<slug>.md.agent`**，作为冻结快照。两份文件必须字节一致。

## 举例

### 错误示例：硬拆

```
## 1
让我们来看看 AI 编程工具的现状。首先，我们需要理解什么是 AI 编程工具。它们是一种

## 2
能够辅助程序员写代码的工具。它们的主要特点包括：自动补全、代码生成
```

问题：
- "让我们来看看" —— AI 腔
- "首先" —— 书面语
- 句子被腰斩
- 毫无 hook

### 正确示例：按意群切

```
## 1
大多数人对 AI 编程工具的失望，是从"它写的代码我还得改"开始的。我也是。

## 2
直到有一天我意识到：我期待的是一个实习生，但我真正需要的是一个敲键盘更快的我自己。

## 3
这两者的差别是什么？实习生替你思考，敲键盘更快的你替你打字。前者节省脑力，后者节省时间。两者不能互换。

## 4
所以再去挑工具的时候，别问"它聪明吗"。先问一句：我现在到底是缺思路，还是缺手速？
```

好在哪里：
- 第 1 段强 hook（"失望" + 反转"我也是"）
- 第 2 段给背景，有情绪节拍
- 第 3 段是核心论点，独立成立
- 第 4 段干净落地，给读者一个可以带走的问题
- 段与段的接缝自然：时间词、因果词、行动词
````

- [ ] **Step 2: 提交**

```bash
git add skills/youmind-threads-article/references/chain-splitting.md
git commit -m "docs(threads): add chain-splitting reference"
```

---

### Task 11: 写 `references/voice-template.md`

`voice.yaml` 字段说明文档。

**文件:**
- 新建: `skills/youmind-threads-article/references/voice-template.md`

- [ ] **Step 1: 写完整文件**

````markdown
# Voice Profile Template

Each profile's `voice.yaml` defines how the agent should write for that persona / use case.
Multiple profiles are supported (e.g. `personal`, `company`, `tech-deep`).

## Full Schema

```yaml
name: "default"             # profile identifier, matches directory name
created_at: "2026-04-08"    # ISO date

tone: "技术同行聊天：有梗但不刻意，敢吐槽但不酸，用行内缩写但会给必要解释"
persona: "在 AI/编程行业泡了 5 年，写代码也写思考，对炒作本能反感"
pov: "第一人称单数，偶尔用「我们」指代从业者群体"

chain:
  length_preference: "short"    # short (3-5) / medium (6-10) / long (11+)
  hook_style: "反常识陈述"       # 反常识陈述 / 尖锐提问 / 场景白描 / 数据冲击
  payoff_required: true         # 是否强制要求结尾收束

hashtags:
  strategy: "none"              # inline / trailing / none
  max_count: 0

reference_threads: []           # 用户认为风格可参考的 permalink 列表
blacklist_words: []             # 绝对不要出现的词（例如 "说实话"、"讲真"）
```

## 字段详解

### `tone`（必填，自由文本）
一段描述，告诉 agent 整体语气应该是什么样。越具体越好：
- ❌ "专业" —— 太抽象
- ✅ "技术同行聊天：有梗但不刻意，敢吐槽但不酸"

### `persona`（必填，自由文本）
这个 profile 的"人"是谁。包括职业背景、立场、对行业的态度。Agent 会用这个决定 POV 和例子。

### `pov`（必填）
叙事视角。常见值：
- "first person singular" / "第一人称单数"
- "first person plural" / "第一人称复数（代表团队）"
- "third person" / "第三人称（企业/机构口吻）"

### `chain.length_preference`（必填）
| 值 | 段数 |
| --- | --- |
| `short` | 3-5 段 |
| `medium` | 6-10 段 |
| `long` | 11+ 段 |

### `chain.hook_style`（必填）
第 1 段 hook 的主风格。四种常见值：
- "反常识陈述"
- "尖锐提问"
- "场景白描"
- "数据冲击"

也可以用英文或其他自由描述。

### `chain.payoff_required`（布尔）
- `true`：结尾段必须有明确收束（带走一个观点/动作/问题）
- `false`：可以开放式结尾

### `hashtags.strategy`（必填）
| 值 | 含义 |
| --- | --- |
| `inline` | 第一个 tag 内嵌进最后一句尾部，其余 tag trailing |
| `trailing` | 所有 tag 集中放在贴子末尾 |
| `none` | 不加 hashtag |

### `hashtags.max_count`（整数）
上限。即使 agent 提出 5 个相关 tag，也只会用前 `max_count` 个。`strategy: none` 时无视此字段。

### `reference_threads`（URL 数组）
用户认为"风格类似"的 Threads 贴子 permalink。Agent 可以参考（但不能抄）。可为空。

### `blacklist_words`（字符串数组）
绝对不能出现的词。Agent 在写作时强制过滤。例如 `["说实话", "讲真", "不得不说"]`。

## 创建方式

通常不需要手写这个 YAML。SKILL.md 会指导 agent 首次使用时通过 `AskUserQuestion`（或文本多选）询问用户，然后用 CLI 的 `profile create` 子命令生成：

```bash
npx tsx src/cli.ts profile create \
  --name default \
  --tone "技术同行聊天" \
  --length short \
  --hashtags none
```

其余字段用默认值填充。高级用户可以直接编辑 `profiles/<name>/voice.yaml` 精调。

## 多 Profile 使用

每个 profile 对应 `profiles/<name>/` 目录下的一组文件。通过 `--profile <name>` 参数指定：

```bash
npx tsx src/cli.ts publish output/draft.md --profile company
npx tsx src/cli.ts preview "..." --profile personal
```

不指定时默认为 `default`。
````

- [ ] **Step 2: 提交**

```bash
git add skills/youmind-threads-article/references/voice-template.md
git commit -m "docs(threads): add voice-template reference"
```

---

### Task 12: 写 `references/content-adaptation.md`

Threads 平台硬约束和段级规则。

**文件:**
- 新建: `skills/youmind-threads-article/references/content-adaptation.md`

- [ ] **Step 1: 写完整文件**

````markdown
# Threads Content Adaptation Rules

这份文档列出 Meta Threads 的**硬约束**（来自官方文档）以及本 skill 针对每段做的段级校验。

## 文本硬约束

| 项 | 限制 |
| --- | --- |
| 单条帖子长度 | ≤ 500 字符（含 emoji，按 UTF-16 code unit 计数） |
| 单条帖子 URL 数 | ≤ 5 |
| 回复 | 支持（用 `reply_to_id`） |
| Carousel（2-20 图） | v1 **不支持**，延后到 v1.1 |

**技术说明**：JavaScript 的 `String.prototype.length` 返回 UTF-16 code unit 数，对大部分内容（包括 ASCII、中文、大多数 emoji）是准确的。少数 skin-tone 组合 emoji 会被 JS 多计，但 Meta 的计数在实践中与 JS `length` 相符。严格的 grapheme 计数（`Intl.Segmenter`）超出 v1 范围。

## 图片硬约束

| 项 | 限制 |
| --- | --- |
| 格式 | JPEG / PNG（Meta 只支持这两种） |
| 文件大小 | ≤ 8 MB |
| 宽度 | 320 - 1440 px |
| 宽高比 | ≤ 10:1 |

**客户端能检查的**：格式（Content-Type header）、大小（Content-Length header）。
**服务端才能检查的**：宽度、宽高比。这些会在 YouMind `/threads/createContainer` 时由 Meta 反馈错误。

## 视频硬约束

| 项 | 限制 |
| --- | --- |
| 容器 | MP4 / MOV |
| 时长 | ≤ 300 秒（5 分钟） |
| 文件大小 | ≤ 1 GB |
| 帧率 | 23 - 60 FPS |
| 分辨率 | 水平方向最大 1920 px，推荐 9:16 |

**客户端能检查的**：容器（Content-Type）、大小（Content-Length）。
**服务端才能检查的**：时长、帧率、分辨率。

## 发布速率限制（per Threads profile / 24 小时滚动）

| 操作 | 上限 |
| --- | --- |
| API 发布帖子 | 250 |
| 回复 | 1000 |
| 删除 | 100 |
| Location search | 500 |

**关键**：这些限制是**每个 Threads 用户独立计算**，不是 per app。一个 thread chain 发 N 段会占用 N 个发布配额（carousel 计为 1 条，但本 skill v1 不支持 carousel）。

**配额检查逻辑（由 `publisher.ts` 实现）**：
- Publish 开始前先调 `getPublishingLimits()`
- 如果 `quota_posts_remaining < segments.length`，直接拒绝并报 reset 时间
- 如果发布后剩余 <20 条，在 `PublishResult.quotaWarning` 里提示用户
- 回复模式使用 `quota_replies_remaining` 做同样检查

## Markdown 处理

Threads UI 是纯文本，不渲染 markdown。`cleanText()` 会在必要时剥掉：

- `# H1/H2/...` 标题标记
- `**bold**` / `*italic*` / `__under__`
- `` `code` `` 和 ``` fenced blocks ```
- `[text](url)` → `text (url)`
- `![alt](url)` → `alt`
- `>` 引用标记
- `---` 分隔线
- `-` / `*` / `1.` 列表符号
- HTML 标签

多段空行会被合并到最多 2 个。

## Hashtag 策略（由 profile 决定）

### `strategy: none`
不加 hashtag。最"干净"的写法。

### `strategy: trailing`
```
<正文>

#tag1 #tag2
```

所有 hashtag 集中在最后一段末尾（**空行分隔**）。

### `strategy: inline`
```
<正文 ... 最后一句> #tag1

#tag2 #tag3
```

第一个 hashtag 嵌入最后一句尾部（空格分隔），其余 tag trailing。

## 字符计数细节

- URL 按**实际字符数**算（Threads 不像 X 把 URL 统一计为 23 字符）
- 中文字符算 1 个字符
- 大部分 emoji 算 2 个（surrogate pair）
- Zero-width joiner 和 skin-tone modifier 会多算几个——尽量避免堆叠 emoji

## 校验流程

1. Agent 写每段时使用 `cleanText()` 做基础清理（如果输入是 markdown）
2. Agent 调 `validateSegment(text)` 检查每段 —— CLI 的 `preview` 和 `publish` 会再次校验
3. 如果 `validateSegment` 返回 `ok: false`，agent 重写那一段（最多 2 次）
4. 媒体 URL 在传给 `createContainer` 之前，用 `validateImageUrl` / `validateVideoUrl` 做 HEAD 检查
````

- [ ] **Step 2: 提交**

```bash
git add skills/youmind-threads-article/references/content-adaptation.md
git commit -m "docs(threads): add content-adaptation reference"
```

---

### Task 13: 写 `references/api-reference.md`

假设的 YouMind `/threads/*` 端点契约。这是 skill 与 YouMind 服务端之间的接口文档。

**文件:**
- 新建: `skills/youmind-threads-article/references/api-reference.md`

- [ ] **Step 1: 写完整文件**

````markdown
# YouMind Threads Proxy API Reference

> **重要**：Skill 代码**绝不直接调用** `graph.threads.net`。所有 Threads 操作通过 YouMind
> 平台的 `/threads/*` 代理端点完成。YouMind 服务端持有用户的 long-lived Meta token 并
> 自动刷新；skill 只需要一个 YouMind API key。

## 基础信息

- **Base URL**: `https://youmind.com/openapi/v1`
- **鉴权**: HTTP header `x-api-key: <youmind_api_key>`
- **Content-Type**: `application/json`
- **HTTP method**: 所有 Threads 端点都是 `POST`（和现有 `/search`、`/webSearch` 保持一致）

## 端点总览

| 端点 | 作用 |
| --- | --- |
| `/threads/status` | 查询用户是否已在 YouMind 绑定 Threads |
| `/threads/limits` | 查询 24h 滚动窗口的发布/回复配额 |
| `/threads/createContainer` | 创建一个 Threads container（草稿） |
| `/threads/publishContainer` | 发布一个已创建的 container |
| `/threads/listPosts` | 列出最近发布的帖子 |

## POST `/threads/status`

查询当前 YouMind 用户的 Threads 绑定状态。

**Request body**: `{}`

**Response**:
```json
{
  "bound": true,
  "username": "dongdongbear",
  "expires_at": "2026-06-08T00:00:00Z"
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `bound` | boolean | 是否已绑定 |
| `username` | string? | 绑定的 Threads 用户名（bound=true 时） |
| `expires_at` | ISO 8601? | Token 过期时间；剩余 <7 天时 skill 应提醒用户重新授权 |

## POST `/threads/limits`

返回当前用户 24 小时滚动窗口的剩余配额。

**Request body**: `{}`

**Response**:
```json
{
  "quota_posts_remaining": 237,
  "quota_replies_remaining": 984,
  "reset_at": "2026-04-09T15:30:00Z"
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `quota_posts_remaining` | int | 发布配额剩余（上限 250） |
| `quota_replies_remaining` | int | 回复配额剩余（上限 1000） |
| `reset_at` | ISO 8601 | 窗口滚动到下一次 "clear" 的时间 |

## POST `/threads/createContainer`

创建一个 Threads container。Container 必须在约 15 分钟内通过 `publishContainer` 发布，否则会过期。

**Request body**:
```json
{
  "text": "Hello Threads!",
  "media_type": "TEXT",
  "image_url": null,
  "video_url": null,
  "reply_to_id": null
}
```

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `text` | string | 是 | 段文本，≤500 chars |
| `media_type` | "TEXT" / "IMAGE" / "VIDEO" | 是 | 媒体类型 |
| `image_url` | string | media_type=IMAGE 时必填 | 图片 URL |
| `video_url` | string | media_type=VIDEO 时必填 | 视频 URL |
| `reply_to_id` | string | 否 | 若设置，此 container 作为对该帖子的回复 |

**Response**:
```json
{ "container_id": "18028_abc_def" }
```

## POST `/threads/publishContainer`

发布一个已创建的 container。

**Request body**:
```json
{ "container_id": "18028_abc_def" }
```

**Response**:
```json
{
  "id": "18028123456789",
  "permalink": "https://www.threads.net/@dongdongbear/post/CxYz0abc"
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | Threads 帖子 id（作为下一段 `reply_to_id` 用） |
| `permalink` | string | 对外可见链接 |

## POST `/threads/listPosts`

列出最近发布的帖子。

**Request body**:
```json
{ "limit": 10 }
```

**Response**:
```json
{
  "data": [
    {
      "id": "18028...",
      "permalink": "https://www.threads.net/@...",
      "text": "Hello",
      "created_time": "2026-04-08T15:30:00Z"
    }
  ]
}
```

## 错误响应

所有端点在失败时返回非 200 HTTP 状态码，body 是 YouMind 的标准错误格式：

```json
{
  "error": "Threads binding expired",
  "code": "THREADS_TOKEN_EXPIRED"
}
```

常见错误：

| 状态 | 原因 | Skill 处理 |
| --- | --- | --- |
| 401 | YouMind API key 无效 | CLI 报错退出，提示检查 config.yaml |
| 403 | Threads 未绑定 | `status.bound=false`，返回 upsell（而不是 throw） |
| 409 | Threads 配额耗尽 | 读 `getPublishingLimits`，报 reset 时间 |
| 429 | 通用 rate limit | 报错，提示重试时间 |
| 500 | YouMind 服务端故障 | 报错，保留草稿 |

## 契约变更约定

**本文档中的端点是本 skill 对 YouMind 服务端的假设**。YouMind 实际实现时字段命名或语义可能调整。若发生变更：

- 只需要改 `skills/youmind-threads-article/toolkit/src/threads-api.ts` 一个文件
- `publisher.ts`、`cli.ts`、`content-adapter.ts` 不感知
- `references/*.md` 里的对外描述也要同步更新

## 为什么不直接调 Meta

spec 明确规定：skill **禁止**直接访问 `graph.threads.net`。原因：

1. **OAuth 摩擦**：每个 skill 都要求用户手动申请 Meta app、拿 long-lived token、每 60 天手动刷新——这是现有 article skill 采用率低的主要原因之一
2. **Token 轮转**：Meta 的 token 60 天一次 refresh，skill 层的轮转逻辑会写 11 遍
3. **App-level rate limit**：Meta Graph API 对每个 app 有整体的 rate limit；由 YouMind 作为平台统一管理，比每个 skill 各自申请提额更有效
4. **合规**：Threads API 要求 Meta App 开启 "Threads API use case"，这是一个平台级的合规决定

所有上述复杂度由 YouMind 服务端承担，skill 只需要一个 `x-api-key` 就能发布到任何用户绑定的 Threads 账号。
````

- [ ] **Step 2: 提交**

```bash
git add skills/youmind-threads-article/references/api-reference.md
git commit -m "docs(threads): add api-reference for YouMind /threads/* contract"
```

---

### Task 14: 写 `SKILL.md`

Skill 清单 + onboarding + pipeline 概述 + agent 拆分指令。跟现有 article skill 的结构对齐。

**文件:**
- 新建: `skills/youmind-threads-article/SKILL.md`

- [ ] **Step 1: 写完整文件**

````markdown
---
name: youmind-threads-article
version: 1.0.0
description: |
  Write and publish single posts and thread chains to Meta Threads with AI — topic research via
  YouMind knowledge base, voice-profile-driven writing, model-driven chain splitting, and one-click
  publishing via YouMind's Threads proxy (no Meta OAuth needed).
  Voice profile sedimentation: voice.yaml + history.yaml + auto-learned lessons.md per profile.
  Use when user wants to "write a threads post", "publish to threads", "threads chain", "发 Threads",
  "发 threads 线程", "Threads 帖子".
  Do NOT trigger for: X/Twitter, Facebook, Instagram, or non-Threads content work.
triggers:
  - "threads post"
  - "threads chain"
  - "publish to threads"
  - "write threads"
  - "threads 帖子"
  - "threads 线程"
  - "发 threads"
  - "发 Threads"
  - "meta threads"
platforms:
  - openclaw
  - claude-code
  - cursor
  - codex
  - gemini-cli
  - windsurf
  - kilo
  - opencode
  - goose
  - roo
metadata:
  openclaw:
    emoji: "🧵"
    primaryEnv: YOUMIND_API_KEY
    requires:
      anyBins: ["node", "npm"]
      env: ["YOUMIND_API_KEY"]
allowed-tools:
  - Bash(node dist/cli.js *)
  - Bash(npm install)
  - Bash(npm run build)
---

# AI Threads Publisher — Voice-Aware Chain Writer

Write and publish Meta Threads single posts and thread chains with AI. Research via [YouMind](https://youmind.com?utm_source=youmind-threads-article) knowledge base, model-driven chain splitting that respects your writing voice, and one-click publishing through YouMind's Threads proxy — no Meta OAuth, no token refresh headaches.

> [Get YouMind API Key](https://youmind.com/settings/api-keys?utm_source=youmind-threads-article) | [Connect Threads](https://youmind.com/settings/integrations?utm_source=youmind-threads-article) | [More Skills](https://youmind.com/skills?utm_source=youmind-threads-article)

## Onboarding

**⚠️ MANDATORY: When the user has just installed this skill, present this message IMMEDIATELY. Translate to the user's language:**

> **🧵 AI Threads Publisher installed!**
>
> Tell me your topic and I'll write a Threads post or chain for you.
>
> **Try it now:** "Write a Threads chain about AI coding tools in 2026"
>
> **What it does:**
> - Research topics via YouMind knowledge base and web search
> - Write in YOUR voice (profile sedimentation that learns from your edits)
> - Intelligently split long-form content into thread chains
> - Publish through YouMind's Threads proxy — no Meta token juggling
> - Support text, image, and video posts; single posts and reply chains
>
> **Setup (one-time):**
> 1. Install & configure: `cd toolkit && npm install && npm run build && cd .. && cp config.example.yaml config.yaml`
> 2. Get [YouMind API Key](https://youmind.com/settings/api-keys?utm_source=youmind-threads-article) and fill `youmind.api_key` in `config.yaml`
> 3. Connect Threads on [YouMind Integrations](https://youmind.com/settings/integrations?utm_source=youmind-threads-article) — one click, no Meta developer portal needed
>
> **First time writing?** I'll ask you three quick questions (tone, length, hashtags) to set up your default voice profile.
>
> **Need help?** Just ask!

## Profile Onboarding (First-Use Flow)

**When the user triggers `publish` or `preview` and `profiles/default/voice.yaml` does not exist**, run this flow BEFORE running the actual command:

1. If the `AskUserQuestion` tool is available in this host, use it to ask three structured questions:
   - **Tone** (e.g. "技术同行聊天，有梗但不刻意" / "专业严谨的企业口吻" / "朋友闲聊，轻松随性")
   - **Length preference**: `short` (3-5 segments) / `medium` (6-10 segments) / `long` (11+ segments)
   - **Hashtag strategy**: `inline` / `trailing` / `none`
2. If `AskUserQuestion` is unavailable, fall back to plain text multiple choice (print numbered options, let the user answer with a letter).
3. Once you have the answers, call the CLI directly:
   ```bash
   cd toolkit && npx tsx src/cli.ts profile create \
     --name default \
     --tone "<user's tone answer>" \
     --length short|medium|long \
     --hashtags inline|trailing|none
   ```
4. Then continue with the user's original request (`publish` or `preview`).

This matches the `youmind-wechat-article` pattern of asking the user once at first use, then sedimenting answers for future sessions.

## Usage

**Write a short thread from a topic:**
> Write a Threads chain about remote work productivity tips

**Single short post:**
> Post on Threads: "Just shipped my first open-source release. It's terrifying and wonderful."

**Publish a pre-written file:**
> Publish output/ai-coding-thread.md to Threads

**Preview without publishing:**
> Preview a Threads chain about AI tools

**Reply to an existing post:**
> Reply to Threads post 18028123 with: "Totally agree — this matches my experience too"

**Use a different voice profile:**
> Write a company-voice Threads post about our new feature (profile: company)

## Setup

> Prerequisites: Node.js >= 18

### Step 1 — Install Dependencies

```bash
cd toolkit && npm install && npm run build && cd ..
```

### Step 2 — Create Config File

```bash
cp config.example.yaml config.yaml
```

### Step 3 — Get YouMind API Key

1. Open [YouMind API Keys](https://youmind.com/settings/api-keys?utm_source=youmind-threads-article)
2. Create a new API key
3. Copy it into `config.yaml` under `youmind.api_key`

### Step 4 — Connect Threads on YouMind

1. Open [YouMind Integrations](https://youmind.com/settings/integrations?utm_source=youmind-threads-article)
2. Click "Connect Threads"
3. Authorize on Meta — YouMind handles token storage and refresh

No Meta developer portal needed. No token copying. This is the main benefit of the proxy architecture.

### Verify Setup

```bash
cd toolkit && npx tsx src/cli.ts validate
```

Expected output:
```
YouMind API key: configured
Threads binding: bound as @your_username
Token expires: ...
Today's quota:
  Posts:   250 remaining
  Replies: 1000 remaining
  Reset:   ...
```

## Pipeline

| Step | Action | Details |
|------|--------|---------|
| 1 | Parse request | Identify topic / file / reply, select profile |
| 2 | Load profile | Read `profiles/{name}/voice.yaml` and `lessons.md` (trigger onboarding if missing) |
| 3 | Research | `youmind.mineTopics` + `youmind.webSearch` |
| 4 | Write + split | Read `writing-guide.md`, `chain-splitting.md`, profile voice, lessons, research → write `output/<slug>.md` AND byte-identical `output/<slug>.md.agent` |
| 5 | Preview | `cli.ts preview <file>` shows segmented result |
| 6 | Publish | `cli.ts publish <file>` — CLI handles binding check, quota check, chain loop, partial failure |
| 7 | Sediment | `publisher.ts` auto-appends `history.yaml`; if user edited the draft, agent diffs `<slug>.md` vs `<slug>.md.agent` and appends 2-3 lessons to `lessons.md`; optional `youmind.saveArticle` archive |
| 8 | Report | First permalink, segment count, profile, quota warning |

See `references/pipeline.md` for full details.

## Skill Directory

| Path | Purpose | When to read |
|------|---------|-------------|
| `references/pipeline.md` | Full pipeline execution details | When running publish flow |
| `references/writing-guide.md` | Threads writing craft (hook, structure, voice) | Before writing, **always** |
| `references/chain-splitting.md` | Agent runtime instructions for splitting into segments | Before splitting a long draft |
| `references/voice-template.md` | voice.yaml schema | When creating/debugging profiles |
| `references/content-adaptation.md` | Meta Threads hard limits (500 chars, 5 URLs, media specs) | When writing or validating segments |
| `references/api-reference.md` | YouMind `/threads/*` proxy contract | When debugging API calls |
| `config.yaml` | YouMind API key only (no Meta tokens!) | Step 1 |
| `profiles/<name>/voice.yaml` | Per-profile voice config | Step 2 |
| `profiles/<name>/history.yaml` | Append-only publish log | Step 7 |
| `profiles/<name>/lessons.md` | Auto-learned editing patterns | Step 4 (read), Step 7 (append) |
| `output/` | **Local thread draft Markdown files (git-ignored)** | Step 4 |
| `toolkit/dist/*.js` | Executable scripts | Various |

## Draft Location Rule (MANDATORY)

**All local thread Markdown files MUST be written to the `output/` directory of this skill, and nowhere else.**

- Correct: `skills/youmind-threads-article/output/my-thread.md`
- Wrong: `skills/youmind-threads-article/my-thread.md` (pollutes skill root)
- Wrong: any new top-level `drafts/` directory (not git-ignored)
- Wrong: any path inside `references/`, `toolkit/`, `profiles/`, or the skill root

The `output/` directory is listed in `.gitignore`, so drafts stay out of version control. Create the directory if it doesn't exist (`mkdir -p output`). Use kebab-case for filenames (e.g. `my-thread.md`), and prefer descriptive slugs over timestamps.

**Every draft must be written twice**: `output/<slug>.md` (editable) and `output/<slug>.md.agent` (frozen snapshot, byte-identical at creation time). The snapshot is used by Step 7 to diff against the user's edited version and learn new lessons.

## Commands

| Command | Purpose |
|---------|---------|
| `publish <input>` | Full flow. `<input>` is either a draft file path or inline text |
| `preview <input>` | Steps 1-5, local preview only |
| `reply <parent_id> "<text>"` | Single reply to an existing Threads post |
| `validate` | Check YouMind key + Threads binding status + quota |
| `list [--limit N]` | Recent posts |
| `limits` | Today's publish/reply quota |
| `profile list` | Known profiles |
| `profile show <name>` | Print profile voice.yaml |
| `profile create --name X --tone "..." --length short --hashtags none` | Create/update a profile (typically called by the agent during onboarding) |

All commands accept `--profile <name>` to select a non-default voice profile.

## Resilience

| Scenario | Behavior |
|----------|----------|
| YouMind research fails | Skip, write from topic alone |
| Segment >500 chars | Agent rewrites (max 2 retries); hard truncate with warning as last resort |
| >12 segments | Warn, ask user to compress |
| Threads not bound | **Non-error**: draft preserved, return upsell message |
| Quota exhausted | Reject publish, report reset time, draft preserved |
| First segment fails | Report error, draft preserved |
| Mid-chain failure | Save remaining segments to `<slug>-remaining.md`, report resume command |
| `publishContainer` fails | Print `container_id`, hidden `publish-container <id>` command available for retry |
| Token <7 days remaining | Warning after successful publish |
| `history.yaml` / `lessons.md` write fails | Log warn, do not affect publish |

## References

- YouMind Threads proxy: `references/api-reference.md`
- Writing craft: `references/writing-guide.md`
- Chain splitting: `references/chain-splitting.md`
- Voice profile schema: `references/voice-template.md`
- Content limits: `references/content-adaptation.md`
- Full pipeline: `references/pipeline.md`
- YouMind Skills gallery: https://youmind.com/skills?utm_source=youmind-threads-article
````

- [ ] **Step 2: 提交**

```bash
git add skills/youmind-threads-article/SKILL.md
git commit -m "docs(threads): add SKILL.md with triggers, onboarding, and pipeline"
```

---

### Task 15: 写 `README.md`（英文用户文档）

用户侧的安装和使用文档。比 `SKILL.md` 更面向用户，轻量。

**文件:**
- 新建: `skills/youmind-threads-article/README.md`

- [ ] **Step 1: 写完整文件**

````markdown
# youmind-threads-article

> AI-powered Meta Threads publisher with voice-profile sedimentation and YouMind-proxied OAuth.

Write Threads posts and chains in YOUR voice. Research topics from your YouMind knowledge base, let a model split long-form content into natural thread segments, and publish with one command — no Meta developer portal, no token refresh headaches.

## Why this skill

Most Threads publishing tools make you:

1. Go to the Meta developer portal
2. Register a Meta app
3. Get a long-lived Page access token
4. Refresh it every 60 days manually
5. Repeat for every skill you want to use

This skill uses **YouMind as an OAuth proxy**. You connect Threads once on YouMind's settings page, and every skill that needs Threads access works without ever touching a Meta token.

On top of that, the skill **remembers your voice**:

- `profiles/<name>/voice.yaml` — tone, persona, length preference, hook style
- `profiles/<name>/history.yaml` — append-only log of every publish
- `profiles/<name>/lessons.md` — patterns the agent learns from your edits

Over time, the skill drifts closer to how you actually write, not how a generic AI writes.

## Install

```bash
cd toolkit
npm install
npm run build
cd ..
cp config.example.yaml config.yaml
```

Fill `youmind.api_key` in `config.yaml`. Get one at [YouMind API Keys](https://youmind.com/settings/api-keys).

Then connect Threads on [YouMind Integrations](https://youmind.com/settings/integrations) (one click).

Verify:

```bash
cd toolkit && npx tsx src/cli.ts validate
```

## Usage

Just ask the agent in natural language:

- "Write a Threads chain about AI coding tools in 2026"
- "Publish `output/ai-thread.md` to Threads"
- "Preview a Threads post about remote work"
- "Reply to Threads post 18028... with: this matches my experience"

The agent will:

1. Ask a one-time onboarding question if you haven't set up a voice profile
2. Research the topic (YouMind knowledge base + web search)
3. Write a draft to `output/<slug>.md`
4. Preview for you
5. Publish — one or many segments as a chain

## CLI reference (if you prefer direct control)

```bash
# Full flow
npx tsx src/cli.ts publish output/my-thread.md

# Preview only
npx tsx src/cli.ts preview output/my-thread.md

# Inline single post
npx tsx src/cli.ts publish "Just shipped my first open-source release."

# Reply
npx tsx src/cli.ts reply 18028123 "Totally agree"

# Account / quota
npx tsx src/cli.ts validate
npx tsx src/cli.ts list --limit 5
npx tsx src/cli.ts limits

# Profiles
npx tsx src/cli.ts profile list
npx tsx src/cli.ts profile show default
npx tsx src/cli.ts profile create --name work --tone "professional, concise" --length medium --hashtags trailing
```

Add `--profile <name>` to any publish/preview to use a non-default voice.

## Draft format

Drafts live in `output/<slug>.md`. Single posts can be inline. Chains use `## N` sections:

```markdown
---
profile: default
topic: "AI coding tools in 2026"
segments: 4
---

## 1

Most people's frustration with AI coding tools starts with "I still have to fix its code."

## 2

It took me a year to realize I was asking for an intern, but what I actually needed was a faster keyboard.

## 3

...
```

Every draft the agent writes also gets a frozen snapshot: `output/<slug>.md.agent`. After a successful publish, the agent diffs the two files and appends learnings to `profiles/<name>/lessons.md` — so next time it writes more like you.

## Limits and constraints

Meta Threads hard limits the skill respects:

| Item | Limit |
|------|-------|
| Chars per post | 500 |
| URLs per post | 5 |
| Publishes / 24h | 250 (per Threads user) |
| Replies / 24h | 1000 (per Threads user) |
| Image | JPEG/PNG, ≤8 MB, 320-1440 px wide |
| Video | MP4/MOV, ≤1 GB, ≤5 min, 23-60 FPS |

Chains of N segments count as N publishes against the 250/24h quota.

## v1 scope

v1 is text + single image/video per first segment + single-level reply chains. Not in v1:

- Carousel (2-20 images) — v1.1
- Reply tree reading — v1.1
- Stats backfill (likes/reposts counts) — future
- Cross-profile lesson sharing — future

## Troubleshooting

**`Threads account not bound on YouMind yet`**
Visit https://youmind.com/settings/integrations and click "Connect Threads". Re-run publish.

**`Segment N invalid: Segment is 523 chars, max is 500`**
Rewrite that segment to be shorter, or ask the agent to split it.

**`Threads post quota exhausted`**
Meta resets the 24h rolling window gradually. The CLI shows the next reset time.

**`Token expires in N days`**
Re-authorize Threads on YouMind settings. Takes one click.

## Contributing

See `docs/superpowers/specs/2026-04-08-youmind-threads-article-design.md` for the full design doc.

## Links

- [Get YouMind API Key](https://youmind.com/settings/api-keys?utm_source=youmind-threads-article)
- [Connect Threads on YouMind](https://youmind.com/settings/integrations?utm_source=youmind-threads-article)
- [More YouMind Skills](https://youmind.com/skills?utm_source=youmind-threads-article)
````

- [ ] **Step 2: 提交**

```bash
git add skills/youmind-threads-article/README.md
git commit -m "docs(threads): add English README"
```

---

### Task 16: 写 `README_CN.md`（中文用户文档）

中文版用户文档。内容与英文版对等。

**文件:**
- 新建: `skills/youmind-threads-article/README_CN.md`

- [ ] **Step 1: 写完整文件**

````markdown
# youmind-threads-article

> AI 驱动的 Meta Threads 发布器，带 voice profile 沉淀和 YouMind 代理 OAuth。

用**你自己的语气**写 Threads 帖子和线程链。从 YouMind 知识库研究话题，由模型把长文按自然节奏拆成线程，一条命令发布——**不需要 Meta 开发者后台，也不需要手动刷新 token**。

## 为什么是这个 skill

大多数 Threads 发布工具都要求你：

1. 去 Meta 开发者后台
2. 注册一个 Meta app
3. 拿到 long-lived page access token
4. 每 60 天手动刷新
5. 每个 skill 都要重复一遍

这个 skill 用 **YouMind 作为 OAuth 代理**：你在 YouMind 的设置页面点一次 "Connect Threads"，所有需要 Threads 权限的 skill 都不用再碰 Meta token。

更上一层，skill 会**记住你的语气**：

- `profiles/<name>/voice.yaml` —— 语气、人设、长度偏好、hook 风格
- `profiles/<name>/history.yaml` —— 每次发布的 append-only 日志
- `profiles/<name>/lessons.md` —— agent 从你的编辑中学到的规律

用得越久，skill 越接近"你自己"的写法，而不是"某个通用 AI"的写法。

## 安装

```bash
cd toolkit
npm install
npm run build
cd ..
cp config.example.yaml config.yaml
```

在 `config.yaml` 里填 `youmind.api_key`。去 [YouMind API Keys](https://youmind.com/settings/api-keys?utm_source=youmind-threads-article) 申请一个。

然后在 [YouMind Integrations](https://youmind.com/settings/integrations?utm_source=youmind-threads-article) 点一次 "Connect Threads"。

验证：

```bash
cd toolkit && npx tsx src/cli.ts validate
```

## 使用

直接用自然语言跟 agent 讲就行：

- "写一条关于 2026 年 AI 编程工具的 Threads 线程"
- "把 `output/ai-thread.md` 发到 Threads"
- "预览一条关于远程办公的 Threads 帖子"
- "回复 Threads 帖子 18028... 说：这和我的经验完全一致"

Agent 会自动：

1. 首次使用时问你一次 voice profile（语气、长度、hashtag 策略）
2. 研究话题（YouMind 知识库 + 网页搜索）
3. 写草稿到 `output/<slug>.md`
4. 预览给你看
5. 发布——单条或多段线程链

## CLI 参考（如果你喜欢直接控制）

```bash
# 完整流程
npx tsx src/cli.ts publish output/my-thread.md

# 仅预览
npx tsx src/cli.ts preview output/my-thread.md

# 单条内联帖子
npx tsx src/cli.ts publish "刚刚发布了我的第一个开源项目。"

# 回复
npx tsx src/cli.ts reply 18028123 "完全同意"

# 账号 / 配额
npx tsx src/cli.ts validate
npx tsx src/cli.ts list --limit 5
npx tsx src/cli.ts limits

# Profile
npx tsx src/cli.ts profile list
npx tsx src/cli.ts profile show default
npx tsx src/cli.ts profile create --name work --tone "专业简洁" --length medium --hashtags trailing
```

所有 publish/preview 命令都支持 `--profile <name>` 切换不同 voice。

## 草稿格式

草稿放在 `output/<slug>.md`。单条帖子可以内联。线程链用 `## N` 作分段：

```markdown
---
profile: default
topic: "AI 编程工具现状"
segments: 4
---

## 1

大多数人对 AI 编程工具的失望，是从"它写的代码我还得改"开始的。

## 2

直到有一天我意识到：我期待的是一个实习生，但我真正需要的是敲键盘更快的我自己。

## 3

...
```

Agent 写的每份草稿都会同时保存一份冻结快照 `output/<slug>.md.agent`。发布成功后，agent 会对比两份文件，把差异总结成 2-3 条规律 append 到 `profiles/<name>/lessons.md`——这样下次写得更像你。

## 平台限制

Meta Threads 的硬约束（skill 都会遵守）：

| 项 | 限制 |
| --- | --- |
| 单条帖子字符数 | 500 |
| 单条 URL 数 | 5 |
| 24h 发布数 | 250（每个 Threads 用户） |
| 24h 回复数 | 1000（每个 Threads 用户） |
| 图片 | JPEG/PNG，≤8 MB，宽 320-1440 px |
| 视频 | MP4/MOV，≤1 GB，≤5 分钟，23-60 FPS |

N 段的线程链会占用 24h 配额中的 N 条发布数。

## v1 范围

v1 支持：文本 + 首段单图/单视频 + 一级回复链。v1 **不包含**：

- Carousel 轮播（2-20 图）—— v1.1
- 读取回复树 —— v1.1
- 互动数据回填（likes/reposts 计数）—— 未来
- 跨 profile 的 lesson 共享 —— 未来

## 常见问题

**`Threads account not bound on YouMind yet`**
去 https://youmind.com/settings/integrations 点 "Connect Threads"，然后重新运行 publish。

**`Segment N invalid: Segment is 523 chars, max is 500`**
重写那一段让它更短，或者让 agent 再拆一下。

**`Threads post quota exhausted`**
Meta 的 24h 滚动窗口是慢慢恢复的。CLI 会显示下次 reset 时间。

**`Token expires in N days`**
去 YouMind 设置页重新授权，点一次就行。

## 贡献

完整设计文档在 `docs/superpowers/specs/2026-04-08-youmind-threads-article-design.md`。

## 链接

- [获取 YouMind API Key](https://youmind.com/settings/api-keys?utm_source=youmind-threads-article)
- [在 YouMind 上连接 Threads](https://youmind.com/settings/integrations?utm_source=youmind-threads-article)
- [更多 YouMind Skills](https://youmind.com/skills?utm_source=youmind-threads-article)
````

- [ ] **Step 2: 提交**

```bash
git add skills/youmind-threads-article/README_CN.md
git commit -m "docs(threads): add Chinese README"
```

---

### Task 17: 最终 build + smoke test + 清理

完整端到端验证。这一 task 不引入新代码或文档，只做集成检查。

**文件:** 无新增。

- [ ] **Step 1: 全量 build**

```bash
cd "$(git rev-parse --show-toplevel)/skills/youmind-threads-article/toolkit" && npm run build
```

预期：`dist/` 下出现 `cli.js`、`publisher.js`、`threads-api.ts`、`content-adapter.js`、`profile-manager.js`、`youmind-api.js` 及对应 `.d.ts`。无类型错误。

- [ ] **Step 2: 检查 dist 产物**

```bash
ls "$(git rev-parse --show-toplevel)"/skills/youmind-threads-article/toolkit/dist/
```

预期：至少包含
```
cli.js
cli.d.ts
publisher.js
publisher.d.ts
threads-api.js
threads-api.d.ts
content-adapter.js
content-adapter.d.ts
profile-manager.js
profile-manager.d.ts
youmind-api.js
youmind-api.d.ts
```

- [ ] **Step 3: CLI help 输出**

```bash
cd "$(git rev-parse --show-toplevel)/skills/youmind-threads-article/toolkit" && node dist/cli.js --help
```

预期：显示所有可见命令（`publish`、`preview`、`reply`、`validate`、`list`、`limits`、`profile`）。隐藏命令（`publish-container`、`create-container`）不应出现在 `--help` 输出里。

- [ ] **Step 4: profile create + preview 端到端**

```bash
cd "$(git rev-parse --show-toplevel)/skills/youmind-threads-article/toolkit"
node dist/cli.js profile create --name default --tone "技术同行聊天" --length short --hashtags none
node dist/cli.js profile show default
node dist/cli.js preview "这是一个 Threads 预览测试，不超过 500 字符。"
```

预期：
1. 第 1 条输出 `Profile 'default' saved ...`
2. 第 2 条输出 JSON 格式的 profile
3. 第 3 条显示 1 段预览 + 字符数

- [ ] **Step 5: Draft 文件预览**

```bash
cd "$(git rev-parse --show-toplevel)/skills/youmind-threads-article"
mkdir -p output
cat > output/test-chain.md <<'EOF'
---
profile: default
topic: "end-to-end smoke test"
segments: 3
---

## 1

第 1 段：这是一条 Threads 线程的开头，紧凑、独立、带钩子。

## 2

第 2 段：这里展开一些背景，让读者带入具体场景。没有 AI 腔。

## 3

第 3 段：最后收束，给出一个可以带走的小结论或问题。
EOF
cd toolkit && node dist/cli.js preview ../output/test-chain.md
```

预期：显示 3 段，每段字符数正确，profile 为 default。

- [ ] **Step 6: 非法段拒绝测试**

```bash
cd "$(git rev-parse --show-toplevel)/skills/youmind-threads-article/toolkit"
node dist/cli.js preview "$(printf 'a%.0s' {1..501})"
echo "Exit: $?"
```

预期：错误输出 "Segment 1/1 invalid: Segment is 501 chars, max is 500" 且 exit code 非 0。

- [ ] **Step 7: validate 在未绑定情况下的行为**

（假设用户未配置 YouMind API key；skill 应报错而不是崩溃）

```bash
cd "$(git rev-parse --show-toplevel)/skills/youmind-threads-article/toolkit"
node dist/cli.js validate
echo "Exit: $?"
```

预期：错误输出 `[ERROR] youmind.api_key not set in config.yaml` 或 `[ERROR] Validation failed: ...`（取决于 config.yaml 是否存在 + 是否有 key）。CLI 不应崩溃。

- [ ] **Step 8: profile list**

```bash
cd "$(git rev-parse --show-toplevel)/skills/youmind-threads-article/toolkit" && node dist/cli.js profile list
```

预期：输出 `default`（Step 4 创建的那个）。

- [ ] **Step 9: 清理 smoke 产物**

```bash
rm -rf "$(git rev-parse --show-toplevel)"/skills/youmind-threads-article/profiles/default
rm -f "$(git rev-parse --show-toplevel)"/skills/youmind-threads-article/output/test-chain.md
rm -rf "$(git rev-parse --show-toplevel)"/skills/youmind-threads-article/toolkit/dist
```

确认 `profiles/` 下只剩 `_index.json`：

```bash
ls "$(git rev-parse --show-toplevel)"/skills/youmind-threads-article/profiles/
```

预期：`_index.json`

- [ ] **Step 10: Git status 检查**

```bash
git status
```

（`git status` 从仓库任意子目录都能工作，无需 cd。）

预期：工作树干净（所有变更已提交）。如果有未提交文件，确认是否是 smoke 产物残留（再次清理）或遗漏的文件（补交）。

- [ ] **Step 11: 最终提交（如有）**

如果 Step 10 显示有未提交文件，按需补交。否则跳过。

```bash
# 例：如果 package-lock.json 没加（应该被 gitignore 掉，但校对一下）
git status
```

Task 结束：`youmind-threads-article` skill 已完整实现并通过端到端 smoke test。

---

## Self-Review 检查清单

实施结束后，可以用下面的清单快速核对是否全部覆盖 spec：

| Spec 章节 | 覆盖位置 |
| --- | --- |
| 目标 / 非目标 | SKILL.md 顶部 description；README*.md"为什么" |
| Meta Threads API 约束（速率/媒体/文本） | content-adapter.ts 常量 + references/content-adaptation.md |
| 信任边界图 | references/api-reference.md |
| 假设的 YouMind 端点 | threads-api.ts 实现 + references/api-reference.md |
| 模块分层与边界 | 目录结构 + 每个 src/*.ts 文件 |
| content-adapter 接口 | Task 3 |
| threads-api 接口 | Task 4 |
| profile-manager 接口 | Task 5 |
| publisher 接口 | Task 6 |
| Voice 沉淀机制（onboarding + voice.yaml + history.yaml + lessons.md） | SKILL.md "Profile Onboarding" + profile-manager.ts + publisher.ts appendHistory + references/writing-guide.md "双份文件规则" |
| Pipeline 8 步 | references/pipeline.md |
| 路由快捷键 | references/pipeline.md + cli.ts 命令 |
| CLI 命令表 | cli.ts 全部命令实现 |
| 模型驱动拆分 | references/chain-splitting.md + references/writing-guide.md |
| 错误处理表 | publisher.ts + references/pipeline.md |
| 发布前配额检查 | publisher.ts Step 2 |
| Resilience 原则 | publisher.ts partial failure + history best-effort |
| Upsell 文案 | publisher.ts buildUpsellMessage |
| 遗留问题 / 延后 | README*.md "v1 scope" |
| 实现备注 | 各 Task 遵循（centralized credentials、kebab-case slug、references 稳定语义） |
