# 凭证集中存储 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**目标:** 将所有 skill 的凭证集中存储到 `~/.youmind-skill/credentials.yaml`，并优雅降级到本地 `config.yaml`。

**架构:** 在每个 skill 的 API 文件中添加 `loadCentralCredentials()` 辅助函数。每个 `loadConfig()` 先读取中心凭证（优先），再 fallback 到本地配置。11 个 `youmind-api.ts` 文件完全相同，改一个复制到其余 10 个即可。

**技术栈:** TypeScript, Node.js fs, yaml parser（所有 skill 已有此依赖）

---

### Task 1: 创建 credentials.example.yaml 模板

**文件:**
- 新建: `credentials.example.yaml`（仓库根目录，供参考）

- [ ] **Step 1: 创建模板文件**

```yaml
# YouMind Skills — 集中凭证配置
# 将此文件复制到 ~/.youmind-skill/credentials.yaml
# 所有 skill 优先读取此文件，找不到则回退到本地 config.yaml

# YouMind OpenAPI（所有 skill 共享）
youmind:
  api_key: ""              # sk-ym-xxxxxxxxxxxxxxxxxxxx
  base_url: "https://youmind.com/openapi/v1"

# --- 平台凭证 ---

wechat:
  appid: ""
  secret: ""
  author: ""

devto:
  api_key: ""

medium:
  token: ""
  publication_id: ""

linkedin:
  access_token: ""
  person_urn: ""
  organization_urn: ""

x:
  bearer_token: ""
  access_token: ""
  api_key: ""
  api_secret: ""
  access_token_legacy: ""
  access_token_secret: ""

reddit:
  client_id: ""
  client_secret: ""
  username: ""
  password: ""
  user_agent: ""

wordpress:
  site_url: ""
  username: ""
  app_password: ""

facebook:
  page_id: ""
  page_access_token: ""

instagram:
  business_account_id: ""
  access_token: ""

hashnode:
  token: ""
  publication_id: ""

ghost:
  site_url: ""
  admin_api_key: ""

# 图片生成 providers
image:
  default_provider: "youmind"
  providers:
    gemini:
      api_key: ""
    openai:
      api_key: ""
    doubao:
      api_key: ""
      base_url: "https://ark.cn-beijing.volces.com/api/v3"
```

- [ ] **Step 2: 提交**

```bash
git add credentials.example.yaml
git commit -m "feat: add centralized credentials template"
```

---

### Task 2: 更新 youmind-api.ts（全部 11 个 skill）

11 个 `youmind-api.ts` 文件完全相同。改一个，复制到其余 10 个。

**文件:**
- 修改: `skills/youmind-wechat-article/toolkit/src/youmind-api.ts:38-52`
- 复制到: 其余 10 个 `skills/youmind-*-article/toolkit/src/youmind-api.ts`

- [ ] **Step 1: 编辑 `youmind-wechat-article/toolkit/src/youmind-api.ts` — 添加 `loadCentralCredentials()` 并更新 `loadConfig()`**

替换 38-52 行:

```typescript
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
  // 过滤本地的空字符串值，避免覆盖中心配置
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
```

- [ ] **Step 2: 复制到其余 10 个 skill**

```bash
for skill in devto facebook ghost hashnode instagram linkedin medium reddit wordpress x; do
  cp skills/youmind-wechat-article/toolkit/src/youmind-api.ts \
     skills/youmind-${skill}-article/toolkit/src/youmind-api.ts
done
```

- [ ] **Step 3: 提交**

```bash
git add skills/youmind-*-article/toolkit/src/youmind-api.ts
git commit -m "feat: youmind-api.ts 从 ~/.youmind-skill/ 读取凭证，支持本地回退"
```

---

### Task 3: 更新 devto-api.ts

**文件:**
- 修改: `skills/youmind-devto-article/toolkit/src/devto-api.ts:37-52`

- [ ] **Step 1: 替换 `loadConfig()`（37-52 行）**

```typescript
function loadCentralCredentials(): Record<string, unknown> {
  const home = process.env.HOME || process.env.USERPROFILE || '';
  const p = resolve(home, '.youmind-skill', 'credentials.yaml');
  if (existsSync(p)) {
    return parseYaml(readFileSync(p, 'utf-8')) ?? {};
  }
  return {};
}

export function loadConfig(): FullConfig {
  const central = loadCentralCredentials();
  let local: Record<string, unknown> = {};
  for (const name of ['config.yaml', 'config.example.yaml']) {
    const p = resolve(PROJECT_DIR, name);
    if (existsSync(p)) {
      local = parseYaml(readFileSync(p, 'utf-8')) ?? {};
      break;
    }
  }
  const devto = { ...(central.devto as Record<string, unknown> ?? {}), ...(local.devto as Record<string, unknown> ?? {}) };
  const youmind = { ...(central.youmind as Record<string, unknown> ?? {}), ...(local.youmind as Record<string, unknown> ?? {}) };
  return {
    devto: {
      apiKey: (devto.api_key as string) || '',
    },
    youmind: youmind as FullConfig['youmind'],
  };
}
```

- [ ] **Step 2: 提交**

```bash
git add skills/youmind-devto-article/toolkit/src/devto-api.ts
git commit -m "feat: devto-api 从 ~/.youmind-skill/ 读取凭证"
```

---

### Task 4: 更新 medium-api.ts

**文件:**
- 修改: `skills/youmind-medium-article/toolkit/src/medium-api.ts:37-60`

- [ ] **Step 1: 替换 `loadConfig()`（37-60 行）**

```typescript
function loadCentralCredentials(): Record<string, unknown> {
  const home = process.env.HOME || process.env.USERPROFILE || '';
  const p = resolve(home, '.youmind-skill', 'credentials.yaml');
  if (existsSync(p)) {
    return parseYaml(readFileSync(p, 'utf-8')) ?? {};
  }
  return {};
}

export function loadConfig(): FullConfig {
  const central = loadCentralCredentials();
  let local: Record<string, unknown> = {};
  for (const name of ['config.yaml', 'config.example.yaml']) {
    const p = resolve(PROJECT_DIR, name);
    if (existsSync(p)) {
      local = parseYaml(readFileSync(p, 'utf-8')) ?? {};
      break;
    }
  }
  const medium = { ...(central.medium as Record<string, unknown> ?? {}), ...(local.medium as Record<string, unknown> ?? {}) };
  const youmind = { ...(central.youmind as Record<string, unknown> ?? {}), ...(local.youmind as Record<string, unknown> ?? {}) };
  return {
    medium: {
      token: (medium.token as string) || process.env.MEDIUM_TOKEN || '',
      publicationId: (medium.publication_id as string) || '',
    },
    youmind: youmind as FullConfig['youmind'],
  };
}
```

- [ ] **Step 2: 提交**

```bash
git add skills/youmind-medium-article/toolkit/src/medium-api.ts
git commit -m "feat: medium-api 从 ~/.youmind-skill/ 读取凭证"
```

---

### Task 5: 更新 linkedin-api.ts

**文件:**
- 修改: `skills/youmind-linkedin-article/toolkit/src/linkedin-api.ts:32-46`

- [ ] **Step 1: 替换 `loadLinkedInConfig()`（32-46 行）**

```typescript
function loadCentralCredentials(): Record<string, unknown> {
  const home = process.env.HOME || process.env.USERPROFILE || '';
  const p = resolve(home, '.youmind-skill', 'credentials.yaml');
  if (existsSync(p)) {
    return parseYaml(readFileSync(p, 'utf-8')) ?? {};
  }
  return {};
}

export function loadLinkedInConfig(): LinkedInConfig {
  const central = loadCentralCredentials();
  let local: Record<string, unknown> = {};
  for (const name of ['config.yaml', 'config.example.yaml']) {
    const p = resolve(PROJECT_DIR, name);
    if (existsSync(p)) {
      local = parseYaml(readFileSync(p, 'utf-8')) ?? {};
      break;
    }
  }
  const li = { ...(central.linkedin as Record<string, unknown> ?? {}), ...(local.linkedin as Record<string, unknown> ?? {}) };
  return {
    accessToken: (li.access_token as string) || '',
    personUrn: (li.person_urn as string) || '',
    organizationUrn: (li.organization_urn as string) || undefined,
  };
}
```

- [ ] **Step 2: 提交**

```bash
git add skills/youmind-linkedin-article/toolkit/src/linkedin-api.ts
git commit -m "feat: linkedin-api 从 ~/.youmind-skill/ 读取凭证"
```

---

### Task 6: 更新 x-api.ts

**文件:**
- 修改: `skills/youmind-x-article/toolkit/src/x-api.ts:42-67`

- [ ] **Step 1: 替换 `loadXConfig()`（42-67 行）**

```typescript
function loadCentralCredentials(): Record<string, unknown> {
  const home = process.env.HOME || process.env.USERPROFILE || '';
  const p = resolve(home, '.youmind-skill', 'credentials.yaml');
  if (existsSync(p)) {
    return parseYaml(readFileSync(p, 'utf-8')) ?? {};
  }
  return {};
}

export function loadXConfig(): XConfig {
  const central = loadCentralCredentials();
  let local: Record<string, unknown> = {};
  for (const name of ['config.yaml', 'config.example.yaml']) {
    const p = resolve(PROJECT_DIR, name);
    if (existsSync(p)) {
      local = parseYaml(readFileSync(p, 'utf-8')) ?? {};
      break;
    }
  }
  const x = { ...(central.x as Record<string, unknown> ?? {}), ...(local.x as Record<string, unknown> ?? {}) };

  const oauth1 =
    x.api_key && x.api_secret && x.access_token_legacy && x.access_token_secret
      ? {
          apiKey: x.api_key as string,
          apiSecret: x.api_secret as string,
          accessToken: x.access_token_legacy as string,
          accessTokenSecret: x.access_token_secret as string,
        }
      : undefined;

  return {
    accessToken: (x.access_token as string) || '',
    bearerToken: (x.bearer_token as string) || '',
    oauth1,
  };
}
```

- [ ] **Step 2: 提交**

```bash
git add skills/youmind-x-article/toolkit/src/x-api.ts
git commit -m "feat: x-api 从 ~/.youmind-skill/ 读取凭证"
```

---

### Task 7: 更新 reddit-api.ts

**文件:**
- 修改: `skills/youmind-reddit-article/toolkit/src/reddit-api.ts:35-57`

- [ ] **Step 1: 替换 `loadRedditConfig()`（35-57 行）**

```typescript
function loadCentralCredentials(): Record<string, unknown> {
  const home = process.env.HOME || process.env.USERPROFILE || '';
  const p = resolve(home, '.youmind-skill', 'credentials.yaml');
  if (existsSync(p)) {
    return parseYaml(readFileSync(p, 'utf-8')) ?? {};
  }
  return {};
}

export function loadRedditConfig(): RedditConfig {
  const central = loadCentralCredentials();
  let local: Record<string, unknown> = {};
  for (const name of ['config.yaml', 'config.example.yaml']) {
    const p = resolve(PROJECT_DIR, name);
    if (existsSync(p)) {
      local = parseYaml(readFileSync(p, 'utf-8')) ?? {};
      break;
    }
  }
  const r = { ...(central.reddit as Record<string, unknown> ?? {}), ...(local.reddit as Record<string, unknown> ?? {}) };
  return {
    clientId: (r.client_id as string) || '',
    clientSecret: (r.client_secret as string) || '',
    username: (r.username as string) || '',
    password: (r.password as string) || '',
    userAgent: (r.user_agent as string) || 'youmind-reddit/1.0',
  };
}
```

- [ ] **Step 2: 提交**

```bash
git add skills/youmind-reddit-article/toolkit/src/reddit-api.ts
git commit -m "feat: reddit-api 从 ~/.youmind-skill/ 读取凭证"
```

---

### Task 8: 更新 wordpress-api.ts

**文件:**
- 修改: `skills/youmind-wordpress-article/toolkit/src/wordpress-api.ts:94-108`

- [ ] **Step 1: 替换 `loadWordPressConfig()`（94-108 行）**

```typescript
function loadCentralCredentials(): Record<string, unknown> {
  const home = process.env.HOME || process.env.USERPROFILE || '';
  const p = resolve(home, '.youmind-skill', 'credentials.yaml');
  if (existsSync(p)) {
    return parseYaml(readFileSync(p, 'utf-8')) ?? {};
  }
  return {};
}

export function loadWordPressConfig(): WordPressConfig {
  const central = loadCentralCredentials();
  let local: Record<string, unknown> = {};
  for (const name of ['config.yaml', 'config.example.yaml']) {
    const p = resolve(PROJECT_DIR, name);
    if (existsSync(p)) {
      local = parseYaml(readFileSync(p, 'utf-8')) ?? {};
      break;
    }
  }
  const wp = { ...(central.wordpress as Record<string, unknown> ?? {}), ...(local.wordpress as Record<string, unknown> ?? {}) };
  return {
    siteUrl: ((wp.site_url as string) || '').replace(/\/+$/, ''),
    username: (wp.username as string) || '',
    appPassword: (wp.app_password as string) || '',
  };
}
```

- [ ] **Step 2: 提交**

```bash
git add skills/youmind-wordpress-article/toolkit/src/wordpress-api.ts
git commit -m "feat: wordpress-api 从 ~/.youmind-skill/ 读取凭证"
```

---

### Task 9: 更新 facebook-api.ts

**文件:**
- 修改: `skills/youmind-facebook-article/toolkit/src/facebook-api.ts:69-82`

- [ ] **Step 1: 替换 `loadFacebookConfig()`（69-82 行）**

```typescript
function loadCentralCredentials(): Record<string, unknown> {
  const home = process.env.HOME || process.env.USERPROFILE || '';
  const p = resolve(home, '.youmind-skill', 'credentials.yaml');
  if (existsSync(p)) {
    return parseYaml(readFileSync(p, 'utf-8')) ?? {};
  }
  return {};
}

export function loadFacebookConfig(): FacebookConfig {
  const central = loadCentralCredentials();
  let local: Record<string, unknown> = {};
  for (const name of ['config.yaml', 'config.example.yaml']) {
    const p = resolve(PROJECT_DIR, name);
    if (existsSync(p)) {
      local = parseYaml(readFileSync(p, 'utf-8')) ?? {};
      break;
    }
  }
  const fb = { ...(central.facebook as Record<string, unknown> ?? {}), ...(local.facebook as Record<string, unknown> ?? {}) };
  return {
    pageId: (fb.page_id as string) || '',
    pageAccessToken: (fb.page_access_token as string) || '',
  };
}
```

- [ ] **Step 2: 提交**

```bash
git add skills/youmind-facebook-article/toolkit/src/facebook-api.ts
git commit -m "feat: facebook-api 从 ~/.youmind-skill/ 读取凭证"
```

---

### Task 10: 更新 instagram-api.ts

**文件:**
- 修改: `skills/youmind-instagram-article/toolkit/src/instagram-api.ts:79-92`

- [ ] **Step 1: 替换 `loadInstagramConfig()`（79-92 行）**

```typescript
function loadCentralCredentials(): Record<string, unknown> {
  const home = process.env.HOME || process.env.USERPROFILE || '';
  const p = resolve(home, '.youmind-skill', 'credentials.yaml');
  if (existsSync(p)) {
    return parseYaml(readFileSync(p, 'utf-8')) ?? {};
  }
  return {};
}

export function loadInstagramConfig(): InstagramConfig {
  const central = loadCentralCredentials();
  let local: Record<string, unknown> = {};
  for (const name of ['config.yaml', 'config.example.yaml']) {
    const p = resolve(PROJECT_DIR, name);
    if (existsSync(p)) {
      local = parseYaml(readFileSync(p, 'utf-8')) ?? {};
      break;
    }
  }
  const ig = { ...(central.instagram as Record<string, unknown> ?? {}), ...(local.instagram as Record<string, unknown> ?? {}) };
  return {
    businessAccountId: (ig.business_account_id as string) || '',
    accessToken: (ig.access_token as string) || '',
  };
}
```

- [ ] **Step 2: 提交**

```bash
git add skills/youmind-instagram-article/toolkit/src/instagram-api.ts
git commit -m "feat: instagram-api 从 ~/.youmind-skill/ 读取凭证"
```

---

### Task 11: 更新 hashnode-api.ts

**文件:**
- 修改: `skills/youmind-hashnode-article/toolkit/src/hashnode-api.ts:35-51`

- [ ] **Step 1: 替换 `loadConfig()`（35-51 行）**

```typescript
function loadCentralCredentials(): Record<string, unknown> {
  const home = process.env.HOME || process.env.USERPROFILE || '';
  const p = resolve(home, '.youmind-skill', 'credentials.yaml');
  if (existsSync(p)) {
    return parseYaml(readFileSync(p, 'utf-8')) ?? {};
  }
  return {};
}

export function loadConfig(): FullConfig {
  const central = loadCentralCredentials();
  let local: Record<string, unknown> = {};
  for (const name of ['config.yaml', 'config.example.yaml']) {
    const p = resolve(PROJECT_DIR, name);
    if (existsSync(p)) {
      local = parseYaml(readFileSync(p, 'utf-8')) ?? {};
      break;
    }
  }
  const hn = { ...(central.hashnode as Record<string, unknown> ?? {}), ...(local.hashnode as Record<string, unknown> ?? {}) };
  const youmind = { ...(central.youmind as Record<string, unknown> ?? {}), ...(local.youmind as Record<string, unknown> ?? {}) };
  return {
    hashnode: {
      token: (hn.token as string) || '',
      publicationId: (hn.publication_id as string) || '',
    },
    youmind: youmind as FullConfig['youmind'],
  };
}
```

- [ ] **Step 2: 提交**

```bash
git add skills/youmind-hashnode-article/toolkit/src/hashnode-api.ts
git commit -m "feat: hashnode-api 从 ~/.youmind-skill/ 读取凭证"
```

---

### Task 12: 更新 ghost-api.ts

**文件:**
- 修改: `skills/youmind-ghost-article/toolkit/src/ghost-api.ts:80-93`

- [ ] **Step 1: 替换 `loadGhostConfig()`（80-93 行）**

```typescript
function loadCentralCredentials(): Record<string, unknown> {
  const home = process.env.HOME || process.env.USERPROFILE || '';
  const p = resolve(home, '.youmind-skill', 'credentials.yaml');
  if (existsSync(p)) {
    return parseYaml(readFileSync(p, 'utf-8')) ?? {};
  }
  return {};
}

export function loadGhostConfig(): GhostConfig {
  const central = loadCentralCredentials();
  let local: Record<string, unknown> = {};
  for (const name of ['config.yaml', 'config.example.yaml']) {
    const p = resolve(PROJECT_DIR, name);
    if (existsSync(p)) {
      local = parseYaml(readFileSync(p, 'utf-8')) ?? {};
      break;
    }
  }
  const ghost = { ...(central.ghost as Record<string, unknown> ?? {}), ...(local.ghost as Record<string, unknown> ?? {}) };
  return {
    siteUrl: ((ghost.site_url as string) || '').replace(/\/+$/, ''),
    adminApiKey: (ghost.admin_api_key as string) || '',
  };
}
```

- [ ] **Step 2: 提交**

```bash
git add skills/youmind-ghost-article/toolkit/src/ghost-api.ts
git commit -m "feat: ghost-api 从 ~/.youmind-skill/ 读取凭证"
```

---

### Task 13: 更新 wechat cli.ts 配置加载

**文件:**
- 修改: `skills/youmind-wechat-article/toolkit/src/cli.ts:39-52`

- [ ] **Step 1: 替换配置加载逻辑（39-52 行）**

```typescript
const CONFIG_PATHS = [
  join(process.cwd(), 'config.yaml'),
  join(dirname(import.meta.url.replace('file://', '')), '..', '..', 'config.yaml'),
  join(dirname(import.meta.url.replace('file://', '')), '..', 'config.yaml'),
];

function loadCentralCredentials(): Record<string, unknown> {
  const home = process.env.HOME || process.env.USERPROFILE || '';
  const p = join(home, '.youmind-skill', 'credentials.yaml');
  if (existsSync(p)) {
    return parseYaml(readFileSync(p, 'utf-8')) || {};
  }
  return {};
}

function loadConfig(): Record<string, unknown> {
  const central = loadCentralCredentials();
  let local: Record<string, unknown> = {};
  for (const p of CONFIG_PATHS) {
    if (existsSync(p)) {
      local = parseYaml(readFileSync(p, 'utf-8')) || {};
      break;
    }
  }
  // 合并各 section：本地覆盖中心
  const merged: Record<string, unknown> = { ...central };
  for (const [key, val] of Object.entries(local)) {
    if (typeof val === 'object' && val !== null && typeof merged[key] === 'object' && merged[key] !== null) {
      merged[key] = { ...(merged[key] as Record<string, unknown>), ...(val as Record<string, unknown>) };
    } else {
      merged[key] = val;
    }
  }
  return merged;
}
```

- [ ] **Step 2: 提交**

```bash
git add skills/youmind-wechat-article/toolkit/src/cli.ts
git commit -m "feat: wechat cli.ts 从 ~/.youmind-skill/ 读取凭证"
```
