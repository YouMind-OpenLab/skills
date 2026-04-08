# YouMind Threads 文章 Skill 设计

## 问题背景

目前已经有 10 个 YouMind 文章 skill，覆盖微信、Facebook、Instagram、LinkedIn、X、Ghost、Dev.to、Hashnode、WordPress 和 Qiita —— 但缺少 Threads。Threads 作为 Meta 新兴平台，其内容形态非常独特：短（≤500 字符）、对话优先、原生线程结构。直接改 X 或 Facebook skill 无法很好地服务这个场景。

这个 skill 同时解决两个次要问题：

1. **OAuth 摩擦扼杀采用率**。现有每个 article skill 都强制用户手动点进 Meta/LinkedIn/X 开发者后台去拿 long-lived token，每 60 天还要 refresh 一次。如果 YouMind 平台层做 OAuth 绑定，skill 只需要一个 `youmind.api_key` 就够了。
2. **风格一致性脆弱**。用户想要跨多条 Threads 维持个人写作风格，但现有 skill 每次都从零推导风格。一个轻量的沉淀机制（profile + history + lessons）可以让 skill 在会话之间持续学习。

## 目标

- 通过 YouMind 代理发布单帖和 thread chain 到 Threads（skill 本身不持有 Threads token）
- 支持 TEXT、IMAGE、VIDEO 三种媒体类型
- 支持回复已有帖子
- 模型驱动的线程拆分（不写算法），基于每个 profile 的 voice 规则
- 沉淀机制：voice profile、发布历史、自动学习的 lessons
- 本地写作和预览不需要 Threads 绑定；只在实际发布时要求绑定（在转化的高意愿时刻引导）
- 沿用现有 `youmind-*-article` skill 模板，用户无学习成本

## 非目标

- Carousel 轮播（2-20 图）—— 延后到 v1.1
- 实现 YouMind 服务端的 OAuth 绑定和 `/threads/*` 端点 —— 超出本 skill 范围；本 spec 只定义 skill 期望的接口契约
- 超出 history append 之外的数据分析面板或互动追踪
- 直接调用 Meta Graph API —— skill **禁止** 直接访问 `graph.threads.net`

## Meta Threads API 约束

在设计 skill 流程和错误处理时需要考虑的 Meta 侧硬约束（来自 Meta 官方文档）。

### 发布速率限制（按 Threads profile 计，24 小时滚动）

| 操作 | 上限 |
| --- | --- |
| API 发布帖子 | 250 条 |
| 回复 | 1000 条 |
| 删除 | 100 条 |
| Location search | 500 次 |

**关键**：这些限制是 **per Threads profile（每个绑定用户）**，不是 per app。Meta 官方文档原文：*"Threads profiles are limited to 250 API-published posts within a 24-hour moving period."* 因此 YouMind 作为平台不会因为用户数增长而被限流 —— 每个绑定的 Threads 用户各自拥有独立的 250/1000/100 配额。

Carousel 计为 1 条发布。本 skill 发 N 段线程会占用 N 个配额。

### 应用层 rate limit 补充

除上面的 per-user 限制外，Meta Graph API 对每个 Meta app 本身通常还有一个整体的 app-level rate limit（所有用户加总的总 call 数天花板）。Threads 官方文档未单独描述该层，但根据 Graph API 通用规则它存在且会随 app 信誉成长自动放宽。本 skill 日常使用不会触及，但在 YouMind 规模扩大后可能需要服务端向 Meta 申请提限 —— 这部分由 YouMind 监控，skill 侧不感知。

### API 调用速率

基于曝光量的动态配额公式（**仍是按单个用户计**）：

- 总 call 数 / 24h = `4800 × Number of Impressions`
- 总 CPU 时间 / 24h = `720000 × impressions`
- 总挂钟时间 / 24h = `2880000 × impressions`

其中 impressions 指*"该用户 Threads 账号在过去 24 小时内进入别人屏幕的次数"*。最小 impressions 默认为 10，即新账号起步有约 48,000 次 API call/day。对本 skill 来说，正常用户不会触碰这个上限。

Meta 提供 `GET /{threads-user-id}/threads_publishing_limit` 端点查询当前配额使用情况。本 skill 通过 YouMind 代理暴露为 `POST /threads/limits`（假设端点，见后文）。

### 媒体规格硬约束

**图片**：

- 格式：JPEG / PNG（官方仅支持这两种）
- 文件大小：≤ 8 MB
- 宽度：320 - 1440 像素
- 宽高比：≤ 10:1

**视频**：

- 容器：MP4 / MOV
- 时长：≤ 300 秒（5 分钟）
- 文件大小：≤ 1 GB
- 帧率：23 - 60 FPS
- 分辨率：水平方向最大 1920 像素，推荐 9:16

**文本**：

- 单条帖子：≤ 500 字符（emoji 按 UTF-8 字节数算）
- 链接：单帖最多 5 个 URL
- Carousel：2 - 20 个子项

### 账号要求

Threads API 仅支持 Creator 和 Brand 账号；绑定流程需要 Meta App 开启 "Threads API use case"。这部分完全由 YouMind 服务端处理，skill 不感知。

## 架构

### 信任边界

```text
Skill (仅持有: youmind.api_key)
    │
    ▼
YouMind 服务端 (持有: 用户的 long-lived Threads token, 自动刷新)
    │
    ▼
Meta Threads API (graph.threads.net/v1.0)
```

Skill **完全不知道** Meta token、OAuth 流程或 refresh 机制的存在。所有 Threads 操作通过 YouMind 平台端点完成。

### Meta 平台委托模式可行性

Meta 在平台层支持这种委托模式。Threads API 使用标准 OAuth 2.0 Authorization Code flow，token 是 app-scoped + user-scoped，long-lived token 60 天可在到期前无限刷新。这和 Buffer、Hootsuite、Later 这些社媒调度工具用的是同一套模式。YouMind 只要注册为 Meta app 并开启 Threads API use case，就可以代用户持有 token 并在服务端调用 Threads API。

### 假设的 YouMind 端点

skill 假设 YouMind 在 `https://youmind.com/openapi/v1` 暴露以下端点（通过 `x-api-key` header 鉴权，和现有 `/search`、`/webSearch` 等保持一致）：

| 端点 | 请求体 | 返回 |
| --- | --- | --- |
| `POST /threads/status` | `{}` | `{ bound: boolean, username?: string, expires_at?: string }` |
| `POST /threads/createContainer` | `{ text, media_type, image_url?, video_url?, reply_to_id? }` | `{ container_id }` |
| `POST /threads/publishContainer` | `{ container_id }` | `{ id, permalink }` |
| `POST /threads/listPosts` | `{ limit }` | `{ data: ThreadsPost[] }` |
| `POST /threads/limits` | `{}` | `{ quota_posts_remaining, quota_replies_remaining, reset_at }` |

如果 YouMind 后续采用不同的字段命名，只需要改 `threads-api.ts` 一个文件。

### 模块分层

```text
cli.ts                      (命令、IO、错误展示)
  │
  ├── publisher.ts          (编排、绑定校验、chain 发布循环)
  │     ├── threads-api.ts  (包装 YouMind /threads/* 端点)
  │     └── profile-manager.ts  (读写 voice.yaml / history.yaml / lessons.md)
  │
  ├── content-adapter.ts    (文本清理、字符校验、hashtag 应用)
  │
  └── youmind-api.ts        (共享 YouMind 客户端 —— 从 facebook skill 拷贝)
```

**边界规则**：`cli.ts` 不直接 import `youmind-api.ts`；`publisher.ts` 不发 HTTP 请求；`threads-api.ts` 不写业务规则；`content-adapter.ts` 不接触网络。

## 文件结构

```text
skills/youmind-threads-article/
├── SKILL.md                    skill 清单、onboarding、pipeline 概述、agent 拆分指令
├── README.md                   英文用户文档
├── README_CN.md                中文用户文档
├── .gitignore                  忽略 output/、config.yaml、dist/、node_modules/、profiles/*/ (但不包括 profiles/_index.json)
├── .clawhubignore              发布时忽略 dist/、node_modules/
├── config.example.yaml         仅包含 youmind.api_key + base_url
├── output/                     (运行时, git-ignored)  本地 thread 草稿 .md + .agent 原稿
├── profiles/
│   ├── _index.json             提交到仓库：空数组标记文件，确保目录存在
│   └── default/                (运行时, git-ignored —— 首次 onboarding 时创建)
│       ├── voice.yaml          语气、人设、POV、线程偏好、hashtag 策略
│       ├── history.yaml        只 append 的发布日志，含 permalink
│       └── lessons.md          从用户编辑中自动学习的模式
├── references/
│   ├── pipeline.md             流程步骤 + 路由快捷键
│   ├── writing-guide.md        Threads 写作工艺：hook、起承转合、500 字符纪律、voice
│   ├── chain-splitting.md      Agent 运行时指令：如何把草稿拆成分段
│   ├── voice-template.md       voice.yaml 字段说明
│   ├── content-adaptation.md   500 字符硬约束、markdown 清理规则
│   └── api-reference.md        假设的 YouMind /threads/* 端点契约
└── toolkit/
    ├── package.json            依赖：commander、yaml
    ├── tsconfig.json
    └── src/
        ├── cli.ts
        ├── publisher.ts
        ├── content-adapter.ts
        ├── profile-manager.ts
        ├── threads-api.ts
        └── youmind-api.ts      从 youmind-facebook-article 原样拷贝
```

## 模块接口

### `threads-api.ts`

```ts
export interface ThreadsConfig { apiKey: string; baseUrl: string; }

export interface BindingStatus {
  bound: boolean;
  username?: string;
  expires_at?: string;  // ISO 8601；当剩余 <7 天时提醒用户
}

export interface ThreadsPost {
  id: string;
  permalink: string;
  text?: string;
  created_time?: string;
}

export interface PublishingLimits {
  quota_posts_remaining: number;    // 24h 内剩余发布配额（上限 250）
  quota_replies_remaining: number;  // 24h 内剩余回复配额（上限 1000）
  reset_at: string;                 // ISO 8601
}

export interface CreateContainerInput {
  text: string;
  mediaType: 'TEXT' | 'IMAGE' | 'VIDEO';
  imageUrl?: string;
  videoUrl?: string;
  replyToId?: string;
}

export function loadThreadsConfig(): ThreadsConfig;
export async function getBindingStatus(cfg: ThreadsConfig): Promise<BindingStatus>;
export async function getPublishingLimits(cfg: ThreadsConfig): Promise<PublishingLimits>;
export async function createContainer(cfg: ThreadsConfig, input: CreateContainerInput): Promise<{ container_id: string }>;
export async function publishContainer(cfg: ThreadsConfig, containerId: string): Promise<{ id: string; permalink: string }>;
export async function listPosts(cfg: ThreadsConfig, limit: number): Promise<{ data: ThreadsPost[] }>;
```

### `content-adapter.ts`

```ts
/** 去除 markdown/HTML 标记，合并空白。不含任何拆分逻辑。 */
export function cleanText(raw: string): string;

/** 校验单段是否符合 Threads 约束（≤500 字符、≤5 个 URL）。 */
export function validateSegment(text: string): { ok: boolean; error?: string };

/** 按 profile 的 hashtag 策略把标签拼到最终段文本上。 */
export function appendHashtags(
  text: string,
  hashtags: string[],
  strategy: 'inline' | 'trailing' | 'none',
): string;

/** 校验图片 URL 是否符合 Meta 规格（尺寸、格式、大小）—— 只检查能在 client 端判断的部分。 */
export function validateImageUrl(url: string): Promise<{ ok: boolean; error?: string }>;

/** 校验视频 URL 同上。 */
export function validateVideoUrl(url: string): Promise<{ ok: boolean; error?: string }>;
```

### `profile-manager.ts`

```ts
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

export function listProfiles(): string[];
export function loadProfile(name: string): VoiceProfile | null;
export function saveProfile(profile: VoiceProfile): void;
export function appendHistory(profileName: string, entry: HistoryEntry): void;
export function loadLessons(profileName: string): string;
export function appendLessons(profileName: string, markdown: string): void;
```

### `publisher.ts`

```ts
export interface ThreadsSegment {
  text: string;
  index: number;
  total: number;
}

export interface PublishRequest {
  segments: ThreadsSegment[];
  profileName: string;
  imageUrl?: string;         // 仅附在第 1 段
  videoUrl?: string;         // 仅附在第 1 段
  replyToExisting?: string;  // 以对某已有帖子的回复作为 chain 起点
  topic?: string;            // 用于 history entry
}

export interface PublishResult {
  bound: boolean;
  posts?: Array<{ index: number; id: string; permalink: string }>;
  draftSavedTo?: string;
  upsellMessage?: string;
  partialFailure?: { publishedCount: number; remainingDraftPath: string };
  quotaWarning?: string;     // 例如 "今日还剩 12 条发布配额"
}

export async function publish(req: PublishRequest): Promise<PublishResult>;
```

## Voice 沉淀机制

### 首次使用 onboarding

当 `profiles/default/voice.yaml` 不存在、且用户触发 `publish` 或 `preview` 时，skill 执行 onboarding 流程：

1. 如果 host 支持 `AskUserQuestion` 工具，用它来做结构化多选
2. 否则降级为纯文本多选（agent 打印带编号的选项，用户用字母回答）
3. 提 3 个问题：整体语气、线程长度偏好、hashtag 策略
4. 把结果写入 `profiles/default/voice.yaml`
5. 继续执行用户原本的请求

这和 `youmind-wechat-article` 对 client 的 onboarding 模式一致。

### `voice.yaml` 示例

```yaml
name: "default"
created_at: "2026-04-08"

tone: "技术同行聊天：有梗但不刻意，敢吐槽但不酸，用行内缩写但会给必要解释"
persona: "在 AI/编程行业泡了 5 年，写代码也写思考，对炒作本能反感"
pov: "第一人称单数，偶尔用「我们」指代从业者群体"

chain:
  length_preference: "short"   # short (3-5) / medium (6-10) / long (11+)
  hook_style: "反常识陈述"      # 反常识陈述 / 尖锐提问 / 场景白描 / 数据冲击
  payoff_required: true

hashtags:
  strategy: "none"              # inline / trailing / none
  max_count: 0

reference_threads: []           # 用户认为风格可参考的 permalink 列表
blacklist_words: []
```

### `history.yaml` append 格式

```yaml
- date: "2026-04-08T15:30:00Z"
  topic: "AI 编程工具现状"
  segments: 4
  char_total: 1843
  posts:
    - { index: 1, id: "18028...", permalink: "https://threads.net/@user/post/..." }
    - { index: 2, id: "18028...", permalink: "https://threads.net/@user/post/..." }
  stats: null
```

每次发布 append 一个 YAML list item，绝不覆盖。

### `lessons.md` 自动学习

Agent 在 Step 4 写草稿时，同时保存 **两份文件**：

- `output/<slug>.md` —— 用户可编辑的工作副本（后续会被发布）
- `output/<slug>.md.agent` —— agent 原始输出的冻结快照（永不修改）

如果用户在发布前编辑了 `output/<slug>.md`，两份文件就会有差异。Step 7 发布成功后，agent（同一对话内，无需额外 API 调用）对两个文件做 diff，把 2-3 条规律 append 到 `lessons.md`。如果两个文件字节一致，跳过 diff。

两份文件都在 git-ignored 的 `output/` 目录下，`.agent` 快照不会进版本库。

`lessons.md` 示例：

```markdown
## 2026-04-08

- 用户删除了所有段落开头的"说实话"、"讲真"这类口水词 → 下次避免使用
- 用户把"5 个工具"改成"5 款工具" → 偏好用"款"而非"个"作工具量词
- 用户把第 2 段和第 3 段合并成更短的一段 → hook 需要更快收束
```

下次 agent 为这个 profile 写作时，会同时读取 `voice.yaml` 和 `lessons.md`，并把 lessons 当作硬约束。

**v1 质量说明**：lessons 机制在 v1 包含，但不期望首发就有很好的效果。它作为一个随使用时间逐步改善的学习回路发布，而非一个打磨过的完整功能。

### 多 profile 支持

用户可以创建多个 profile（比如 `personal`、`company`、`tech-deep`）。CLI 用 `--profile <name>` 选择，不指定则用 `default`。目标 profile 不存在时触发 onboarding。

## Pipeline

### 步骤

| 步骤 | 名称 | 动作 | 降级 |
| --- | --- | --- | --- |
| 1 | 解析请求 | 判断是 topic / raw-file / reply，选择 profile | — |
| 2 | 加载 profile | 读 `profiles/{name}/voice.yaml` 和 `lessons.md` | 缺失时触发 onboarding |
| 3 | 研究 | `youmind.mineTopics` + `youmind.webSearch` | 出错跳过 |
| 4 | 模型驱动写作 + 拆分 | Agent 读 `writing-guide.md`、`chain-splitting.md`、profile voice、lessons、研究素材 → 写 `output/<slug>.md` 和字节一致的 `output/<slug>.md.agent` 快照 | 无效段最多重写 2 次；>12 段时警告 |
| 5 | 预览 | 在终端显示分段结果，立即发布（不暂停等确认） | — |
| 6 | 发布 + 绑定校验 | `getBindingStatus` → 未绑定返回 upsell；绑定则循环 createContainer + publishContainer，后续段用 reply chain 串 | 见下方 partial failure |
| 7 | 沉淀 | Append `history.yaml`；若草稿被编辑过，agent 对比原稿 vs 最终稿并 append `lessons.md`；可选 `youmind.saveArticle` 归档 | best-effort，失败只 log warn |
| 8 | 汇报 | 展示首条 permalink、总段数、profile 名 | — |

### 草稿文件格式（`output/<slug>.md`）

```markdown
---
profile: default
topic: "AI 编程工具现状"
segments: 4
---

## 1

{第 1 段文本，≤500 字符}

## 2

{第 2 段文本，≤500 字符}

...
```

Agent 在写这份文件的同时，把同样的内容写到 `output/<slug>.md.agent`。用户可以自由编辑 `<slug>.md`；`<slug>.md.agent` 作为 Step 7 lessons diff 的冻结基线。

### 路由快捷键

| 用户输入 | 入口 |
| --- | --- |
| 只有 topic | Step 2（完整流程） |
| `output/*.md` 文件路径 | Step 5（跳过写作） |
| `reply <parent_id> "<text>"` | Step 4 简化版 + Step 6 带 `replyToExisting` |
| `preview <input>` | Step 4 + Step 5，不进 Step 6 |
| `validate` / `list` / `profile *` | 直接调 `threads-api` 或 `profile-manager` |

### CLI 命令

| 命令 | 用途 | 触发 profile onboarding |
| --- | --- | --- |
| `publish <input>` | 完整流程 | profile 缺失时会 |
| `preview <input>` | Step 1-5，本地不发 | profile 缺失时会 |
| `reply <parent_id> "<text>"` | 对已有帖子回复 | 否 |
| `validate` | 检查 YouMind key 和 Threads 绑定状态 | 否 |
| `list [--limit N]` | 最近帖子 | 否 |
| `limits` | 展示今日 Threads 发布/回复配额使用情况 | 否 |
| `profile list` | 列出所有 profile | 否 |
| `profile show <name>` | 显示 profile 详情 | 否 |

`profile` 是 `cli.ts` 里的单文件子命令，不是独立二进制。Profile 选择永远通过 `publish` / `preview` 的 `--profile <name>` 参数，默认 `default`。没有"当前 profile"状态文件 —— `profile use` 在 v1 范围外。

### 模型驱动拆分（agent 指令）

`references/chain-splitting.md` 是 agent 运行时读取的指令（不是 skill 代码读的）。它告诉 agent：

1. 先读当前 profile 的 voice 和 lessons
2. 用 Hook → Tension → Body → Payoff 结构组织线程
3. 在读者自然换气处切分（新论点出现、情绪节拍变化、**不要**切在论证中间）
4. 第 1 段 60-150 字符（紧凑）、中间段 200-450 字符（有呼吸）、收尾段 100-300 字符（干净落地）
5. 绝对不在段文本里加 "1/5" 这种序号前缀 —— Threads UI 自己会处理线程展示
6. 每段保存前都通过 `validateSegment` 校验

`content-adapter.ts` 里的 `cleanText`、`validateSegment`、`appendHashtags` 是 agent 写作时唯一能用的代码侧工具。

## 错误处理

| 步骤 | 失败场景 | 处理方式 |
| --- | --- | --- |
| 2 | `voice.yaml` 缺失 | 触发 onboarding（非错误） |
| 2 | `AskUserQuestion` 工具不可用 | 降级为纯文本多选 |
| 3 | `youmind.api_key` 缺失 | 跳过研究步骤，提示用户"未做研究，仅凭 topic 写作" |
| 3 | `mineTopics` / `webSearch` 出错 | log warn，继续 |
| 4 | 某段 >500 字符 | Agent 重写该段（每段最多 2 次重试）；仍失败则硬截断并警告 |
| 4 | >12 段 | 警告，询问用户是否压缩 |
| 4 | 产出不符合 voice | 不做运行时校验；靠 `lessons.md` 长期纠偏 |
| 4 | 图片/视频不符合 Meta 规格 | `validateImageUrl` / `validateVideoUrl` 在调用前报错，给出具体原因（格式/大小/尺寸） |
| 6 | `bound: false` | **非错误**：草稿已保存，返回 upsell 文案 |
| 6 | `createContainer` 首段失败 | 报错退出，草稿保留 |
| 6 | `createContainer` 中段失败 | 停止，把剩余段存到 `output/<slug>-remaining.md`，报告"已发 k/N，用 `publish <remaining-path> --reply-to <last-id>` 续发" |
| 6 | `publishContainer` 失败 | 打印 `container_id`，提示用隐藏命令 `publish-container <id>` 重试 |
| 6 | 发布配额耗尽（250/24h 或 1000 replies/24h） | 读 `getPublishingLimits` 展示 reset 时间；草稿保留 |
| 6 | 通用 rate limit 429 | 报告 reset 时间；草稿保留 |
| 6 | Token 剩余 <7 天（`expires_at`） | 发布成功后警告，提示用户去 YouMind 重新授权 |
| 7 | `history.yaml` 写入失败 | log warn，不影响已成功的发布 |
| 7 | `lessons.md` diff agent 任务失败 | 静默跳过 |
| 7 | `youmind.saveArticle` 归档失败 | log warn |

### 发布前配额检查

Step 6 开始时，`publisher.publish()` 先调 `getPublishingLimits()`：

- 如果 `quota_posts_remaining < segments.length`，直接拒绝发布，报告"今日还剩 X 条配额，本次需要 Y 条"
- 如果 `quota_posts_remaining - segments.length < 20`，发布后在 `PublishResult.quotaWarning` 里提示

回复模式（`reply` 命令）使用 `quota_replies_remaining` 做同样检查。

### Resilience 原则

1. **写作价值不惜代价保留**：任何失败都不删 `output/` 里的草稿
2. **部分发布不回滚**：Threads 没有事务概念，已发的就是已发的
3. **沉淀失败不影响主流程**：history、lessons、归档都是 best-effort

### Upsell 文案（未绑定时）

`publish` 命令在 `bound: false` 时在 CLI 展示：

```text
✔ Thread written: 4 posts, 1843 chars total
✔ Draft saved to: output/<slug>.md

❌ Threads account not bound on YouMind yet

Your thread is ready to go — one more step to publish:
  1. Visit https://youmind.com/settings/integrations
  2. Click "Connect Threads"
  3. Run: npx tsx src/cli.ts publish output/<slug>.md

Once connected, all future posts publish with one command.
```

文案刻意用"one more step"的框架而不是"你漏了一步"，把转化时刻保持为正向的体验。

## 遗留问题 / 延后

- **Carousel 支持（2-20 图）**：延后到 v1.1。需要类似 Instagram skill 的多容器流程。
- **Reply 树读取**：v1 只发回复，不读取回复树。v1.1 可加 `read-replies` 命令管理对话。
- **Stats 回填**：`history.yaml` 目前 `stats: null`，未来可加 `threads refresh-stats` 命令通过 YouMind 拉取互动数据。
- **跨 profile 的 lessons**：目前 lessons 是 per-profile 的。未来版本可能考虑跨 profile 的共性模式。
- **YouMind 端点契约最终化**：本 spec 里的 `/threads/*` 端点是 skill 的假设。YouMind 服务端实现时最终形状可能调整；只需要改 `threads-api.ts` 一个文件。
- **媒体尺寸/格式服务端校验**：`validateImageUrl` / `validateVideoUrl` 只做客户端能判断的部分（HEAD 请求看 Content-Type 和 Content-Length）。真正的宽度、帧率、分辨率校验需要 YouMind 服务端在 `createContainer` 时反馈。

## 实现备注

- `youmind-api.ts` 从 `youmind-facebook-article/toolkit/src/youmind-api.ts` 原样拷贝。里面已经包含中心凭证加载逻辑 —— `threads-api.ts` 直接复用 `loadCentralCredentials()` + 本地配置合并的模式即可。
- `config.yaml` 与 `~/.youmind-skill/credentials.yaml` 的合并逻辑和其他 article skill 一致（见 `2026-04-01-centralized-credentials-design.md`）。
- `output/` 里的草稿文件必须用 kebab-case slug（例如 `ai-coding-tools-thread.md`）。`.agent` 快照用同样的 slug 加 `.agent` 后缀。
- `references/*.md` 里所有 agent 运行时读取的文本，在 skill 升级时必须保持语义稳定 —— 用户的 `lessons.md` 和 `voice.yaml` 依赖这些指令的语义一致性。把这些文件当作公开 API 对待。
- Onboarding 流程（首次 profile 创建）放在 `cli.ts` 里，不放在 `profile-manager.ts`。`profile-manager.ts` 只做 IO，不执行用户交互。
- `validateImageUrl` / `validateVideoUrl` 用 HEAD 请求检查 `Content-Type` 和 `Content-Length`，避免下载完整文件。不能客户端判断的（宽度、时长、帧率）依赖 YouMind 服务端反馈。
