---
name: youmind-wechat-article
version: 1.0.1
description: |
  Write and publish WeChat Official Account articles end-to-end with AI — trending topic mining,
  de-AI voice writing, beautiful theme formatting, cover image generation, and one-click draft box publishing.
  Integrates YouMind knowledge base for source material and supports multiple image AI providers
  (Nano Banana Pro, Gemini Imagen, GPT Image, Seedream).
  Use when user wants to "写公众号文章", "微信推文", "发布到草稿箱", "微信排版",
  "write WeChat article", "publish to WeChat drafts", "format for WeChat".
  Do NOT trigger for: generic blog posts, emails/newsletters, PPT, short video scripts,
  or non-WeChat SEO/content work.
triggers:
  - "公众号"
  - "微信公众号"
  - "微信文章"
  - "微信公众号文章"
  - "推文"
  - "草稿箱"
  - "微信排版"
  - "公众号排版"
  - "公众号写作"
  - "选题"
  - "封面图"
  - "配图"
  - "公众号配图"
  - "文章复盘"
  - "写公众号"
  - "WeChat article"
  - "wechat article"
  - "write WeChat"
  - "WeChat format"
  - "WeChat publish"
  - "publish to WeChat"
  - "WeChat drafts"
  - "给公众号写文章"
  - "发布到微信草稿箱"
  - "公众号样式"
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
    emoji: "✍️"
    primaryEnv: YOUMIND_API_KEY
    requires:
      anyBins: ["node", "npm", "python3"]
      env: ["YOUMIND_API_KEY"]
allowed-tools:
  - Bash(node dist/cli.js *)
  - Bash(python3 scripts/*)
  - Bash(npm install)
  - Bash(npm run build)
  - Bash([ -n "$YOUMIND_API_KEY" ] *)
---

# AI WeChat Article Writer — From Topic to Draft Box in One Prompt

Write professional WeChat Official Account articles with AI that doesn't sound like AI. Trending topic mining → deep research via [YouMind](https://youmind.com?utm_source=youmind-wechat-article) knowledge base → structured writing with de-AI protocol → beautiful theme formatting → cover image generation → one-click publish to WeChat draft box. No manual formatting, no copy-paste.

> [Get API Key →](https://youmind.com/settings/api-keys?utm_source=youmind-wechat-article) · [More Skills →](https://youmind.com/skills?utm_source=youmind-wechat-article)

## Onboarding

**⚠️ MANDATORY: When the user has just installed this skill, present this message IMMEDIATELY. Do NOT ask "do you want to know what this does?" — just show it. Translate to the user's language:**

> **✅ AI WeChat Article Writer installed!**
>
> Tell me your topic and I'll write and publish a WeChat article for you.
>
> **Try it now:** "帮我写一篇关于 AI 编程的公众号文章"
>
> **What it does:**
> - Plan topics from trending hotspots and SEO keywords
> - Write professional articles with de-AI voice
> - Format with beautiful WeChat-optimized themes
> - Generate cover images with AI (4 providers supported)
> - Publish directly to your WeChat draft box
>
> **Setup (one-time):**
> 1. Install & configure: `cd toolkit && npm install && npm run build && cd .. && pip install -r requirements.txt && cp config.example.yaml config.yaml`
> 2. Get [YouMind API Key](https://youmind.com/settings/api-keys?utm_source=youmind-wechat-article) → fill `youmind.api_key` in `config.yaml`
> 3. Get WeChat AppID & AppSecret from [微信开发者平台](https://developers.weixin.qq.com/platform?tab1=basicInfo&tab2=dev) → fill `wechat.appid` and `wechat.secret`, add your public IP (`curl -s https://ifconfig.me`) to the API IP whitelist
>
> No WeChat API yet? You can still write and preview locally — just skip the WeChat config steps.
>
> See the **Setup** section below for detailed step-by-step instructions with screenshots.
>
> **Need help?** Just ask!

For first-run setup and client onboarding details, see [references/operations.md](references/operations.md).

## Usage

Provide a topic, brand/client name, or raw Markdown for publishing.

**Write from a topic:**
> 帮我写一篇关于 AI 编程趋势的公众号文章

**Write for a specific client:**
> 给 demo 客户写一篇推文，主题是远程办公最佳实践

**Format and publish raw Markdown:**
> 把这篇 Markdown 排版成公众号样式并发布到草稿箱

**Interactive mode:**
> 用交互模式帮我写一篇公众号文章，我想自己选题和框架

## Setup

> Prerequisites: Node.js ≥ 18, Python ≥ 3.9, a verified WeChat Official Account with API access.

### Step 1 — Install Dependencies

```bash
cd toolkit && npm install && npm run build && cd ..
pip install -r requirements.txt
```

### Step 2 — Create Config File

```bash
cp config.example.yaml config.yaml
```

### Step 3 — Get YouMind API Key (Recommended)

YouMind API Key 用于知识库语义搜索、联网搜索、文章归档、AI 生图（Nano Banana Pro）。不配也能跑，但会丧失这些增强能力。

1. 打开 [YouMind API Keys 页面](https://youmind.com/settings/api-keys?utm_source=youmind-wechat-article)
2. 登录后点击 **「Create API Key」** 创建新密钥
3. 复制生成的 `sk-ym-xxxx` 格式密钥
4. 填入 `config.yaml` 的 `youmind.api_key` 字段

```yaml
youmind:
  api_key: "sk-ym-xxxxxxxxxxxxxxxxxxxx"
```

### Step 4 — Get WeChat AppID & AppSecret

1. 打开 [微信开发者平台](https://developers.weixin.qq.com/platform?tab1=basicInfo&tab2=dev)，点击 **「前往使用」** 登录
2. 在「我的业务」面板点击 **「公众号」** 进入管理页
3. 在 **基础信息** 页顶部复制 **AppID**
4. 在「开发密钥」区域点击 **重置** 获取 **AppSecret**（仅展示一次，立即保存）
5. 填入 `config.yaml`：

```yaml
wechat:
  appid: "wx_your_appid"
  secret: "your_secret"
  author: "你的作者名"
```

> 详细图文步骤见 [README.md](README.md#获取-appid--appsecret--配置-ip-白名单)

### Step 5 — Configure IP Whitelist

微信公众号 API **拒绝所有不在白名单中的 IP 请求**，必须配置后才能发布。

获取公网 IP：

```bash
# macOS / Linux
curl -s https://ifconfig.me

# Windows PowerShell
(Invoke-WebRequest -Uri "https://ifconfig.me" -UseBasicParsing).Content.Trim()
```

拿到 IP 后，在上一步的微信开发者平台公众号页面 →「开发密钥」→ **API IP 白名单** → 点击 **编辑** → 粘贴 IP 保存。

> 家庭宽带 IP 会变。发布报 IP 错误时重新获取 IP 并更新白名单即可。云服务器 / CI 环境通常是静态 IP，配一次就行。

### Step 6 — Image Provider Keys (Optional)

配图使用降级链：AI 生图 → 图库搜索 → CDN 预制封面下载 → 仅输出 prompt。不配任何 key 也不影响发布。

| Provider | 获取方式 | `config.yaml` 字段 |
|----------|----------|---------------------|
| **YouMind (Nano Banana Pro)** | 使用 Step 3 的 YouMind API Key，无需额外配置 | `image.providers.youmind.api_key`（留空则自动使用 `youmind.api_key`） |
| **Google Gemini (Imagen)** | [Google AI Studio](https://aistudio.google.com/apikey) 创建 API key | `image.providers.gemini.api_key` |
| **OpenAI (GPT Image)** | [OpenAI Platform](https://platform.openai.com/api-keys) 创建 API key | `image.providers.openai.api_key` |
| **豆包 (Seedream)** | [火山引擎控制台](https://console.volcengine.com/ark) 创建 API key | `image.providers.doubao.api_key` |

在 `config.yaml` 中设置 `image.default_provider` 指定首选 provider，或留空让 Skill 自动选第一个有 key 的。

### Verify Setup

配置完成后，对 Agent 说一句试试：

> "帮我写一篇关于 AI 编程的公众号文章"

如果配置有问题，Skill 会在对应步骤报错并给出修复提示——不会整体卡死。

For client onboarding and post-setup operations, see [references/operations.md](references/operations.md).

## Skill Directory

This skill is a folder. Read files on demand — do NOT load everything upfront.

| Path | Purpose | When to read |
|------|---------|-------------|
| `references/pipeline.md` | Full step-by-step execution (Steps 1–8) | When running the writing pipeline |
| `references/operations.md` | Post-publish commands, client onboarding, themes, first-run setup | When handling operational tasks |
| `references/writing-guide.md` | Pre-writing framework, depth architecture, de-AI protocol, voice | Step 4 (writing) |
| `references/frameworks.md` | 5 article frameworks with execution detail | Step 3.5 (framework selection) |
| `references/topic-selection.md` | 4-dimension topic evaluation model | Step 3 (topic generation) |
| `references/seo-rules.md` | Title optimization, keyword density, digest, tags | Step 5 (SEO pass) |
| `references/visual-prompts.md` | Cover and inline image design, prompt engineering | Step 6 (visual AI) |
| `references/theme-dsl.md` | Custom theme design language (integrates [Impeccable](https://impeccable.style/) if installed) | When creating custom themes — auto-detects & offers to install Impeccable |
| `references/youmind-integration.md` | Knowledge base API, search, archiving | When using YouMind features |
| `references/cli-reference.md` | All CLI command syntax | When running toolkit commands |
| `references/wechat-constraints.md` | WeChat platform technical limits, safe CSS, size caps | When debugging rendering or format issues |
| `references/style-template.md` | Client config template with field guide | When onboarding a new client |
| `references/openapi-document.md` | YouMind OpenAPI full endpoint schemas | When calling YouMind API directly |
| `references/skill-maintenance.md` | Skill self-maintenance, validation, architecture guardrails | When improving or refactoring this skill itself |
| `references/builtin-themes.json` | CSS examples for 10 built-in themes | When customizing themes |
| `clients/{client}/style.yaml` | Client brand voice, topics, blacklist, theme | Step 1 (load config) |
| `clients/{client}/playbook.md` | Client-specific writing rules (if exists) | Step 4 (writing) |
| `clients/{client}/history.yaml` | Published article history | Step 2.5 (dedup) |
| `config.yaml` | API credentials (WeChat, YouMind, image providers) | Step 1 (first-run check) |
| `toolkit/dist/*.js` | Executable scripts (run from `toolkit/`) | Various steps |
| `scripts/*.py` | Python scripts (trending topics, SEO keywords) | Steps 2, 2.5 |

---

## Execution Modes

**Auto (default):** Run Steps 1–5 automatically. Before Step 6 image generation, proactively ask once about image scope and style unless the user already specified them. Then continue through Steps 6–8. Only pause elsewhere if a step AND its fallback both fail, required info is missing, or user explicitly asks to pause.

**Interactive:** Triggered by "interactive mode", "let me choose", "show me the topics/frameworks/themes". Pauses at: topic selection, framework choice, image plan, theme selection. All other steps run automatically.

---

## Critical Quality Rules

Non-negotiable. Violating any one means the article has failed:

1. **Read `references/writing-guide.md` BEFORE writing.** The pre-writing framework and de-AI protocol are mandatory.
2. **Zero AI-sounding text.** Run the full 4-level de-AI protocol from writing-guide.md.
3. **H1 title: 20–28 Chinese characters.** The converter extracts H1 as the WeChat title.
4. **Digest: ≤54 Chinese characters.** WeChat enforces a 120 UTF-8 byte limit.
5. **Word count: 1,500–2,500.** Sweet spot for completion rate is 1,500–2,000.
6. **Specificity over abstraction.** Every claim must be grounded in concrete detail.
7. **Depth over polish.** Run the Depth Checklist (writing-guide.md) before the De-AI pass. If the article's core thesis is something from the top 3 Google results, it needs a rewrite, not a polish.
8. **Obey the client's `blacklist`** — both words and topics. No exceptions.
9. **Playbook overrides writing-guide.** If `playbook.md` exists for this client, it takes priority for voice and style decisions.
10. **Before generating visuals, proactively ask about image scope and style.** Do not silently assume. If the host supports `AskUserQuestion`, use it. Otherwise ask a concise plain-text question.
11. **Always publish to drafts.** Step 7 publishes directly to WeChat draft box. Do NOT ask — this is mandatory and automatic.

---

## Pipeline Overview

Read `references/pipeline.md` for full execution details of each step.

| Step | Action | Key reference |
|------|--------|--------------|
| 1 | Load client `style.yaml` + routing | — |
| 1.5 | Mine YouMind knowledge base for source material | `youmind-integration.md` |
| 2 | Fetch trending topics via `fetch_hotspots.py` | — |
| 2.5 | Dedup against `history.yaml` + SEO keyword scoring | — |
| 3 | Generate 10 topics, score, select best | `topic-selection.md` |
| 3.5 | Generate 5 framework proposals, select best | `frameworks.md` |
| 4 | Write article with pre-writing thinking + depth check | `writing-guide.md` |
| 5 | SEO optimization + full de-AI pass | `seo-rules.md` |
| 6 | Design and generate cover + inline images | `visual-prompts.md` |
| 7 | **Publish to WeChat drafts** (mandatory, automatic) | `cli-reference.md` |
| 7.5 | Append to history + archive to YouMind | `youmind-integration.md` |
| 8 | Report results: title, digest, tags, media_id | — |

**Routing shortcuts:**

- User gave a specific topic → Skip Steps 2–3, go 1.5 → 3.5
- User gave raw Markdown → Skip to Step 7

---

## Resilience: Never Stop on a Single-Step Failure

Every step has a fallback. If a step AND its fallback both fail, skip that step and note it in the final output.

| Step | Fallback |
|------|----------|
| 1.5 Knowledge mining | Skip, empty knowledge_context |
| 2 Trending topics | YouMind web-search → WebSearch → ask user |
| 2.5 SEO scoring | Self-estimate, mark "estimated" |
| 3 Topic generation | Ask user for a manual topic |
| 6 Image generation | Output prompts, skip images |
| 7 Publishing | Generate local HTML preview |
| 7.5 History/Archive | Warn, continue |
| Python/Node missing | Tell user install command |

---

## Operations

For post-publish commands (polish, rewrite, change theme, stats review), client onboarding, learn-from-edits, custom themes, and first-run setup, read `references/operations.md`.

If the request is about improving this skill itself, refactoring its structure, or checking for documentation drift, read `references/skill-maintenance.md`.

---

## Gotchas — Common Failure Patterns

**"The AI Essay":** The article reads like a well-organized explainer piece — correct, comprehensive, boring. Fix: re-read writing-guide.md's voice architecture and pre-writing framework. The article needs a PERSON behind it, not an information system.

**"The Generic Hot Take":** Writing about a trending topic without adding any insight beyond what is already in the top 10 search results. If you cannot identify your unique angle in one sentence, pick a different topic.

**"The Word-Count Pad":** Hitting 2,000 words by being verbose instead of being deep. Every paragraph should survive the test: "if I delete this, does the article lose something specific?" If not, delete it.

**"The Pretty But Empty Article":** Beautiful formatting, nice images, zero substance. Visual quality cannot compensate for thin content. Get the writing right first.

**"The Blacklist Miss":** Forgetting to check `style.yaml` blacklist against the final article. Always do a final scan before publishing.

**"The Broken Pipeline Halt":** Stopping the entire flow because one step failed. NEVER do this. Use the fallback. If the fallback fails, skip and note it. The user can always fix individual pieces manually.

## Comparison

| Feature | This Skill | Manual Writing | 135 Editor | Xiumi |
|---------|-----------|---------------|------------|-------|
| AI topic mining | ✅ | ❌ | ❌ | ❌ |
| De-AI voice protocol | ✅ | N/A | ❌ | ❌ |
| AI cover generation | ✅ (4 providers) | ❌ | ❌ | ❌ |
| One-click draft publishing | ✅ | ❌ | ❌ | ❌ |
| YouMind knowledge base | ✅ | ❌ | ❌ | ❌ |
| Learn from your edits | ✅ | N/A | ❌ | ❌ |
| Multi-client management | ✅ | ❌ | ❌ | ❌ |
| Custom themes | ✅ 4 built-in + DSL | N/A | ✅ | ✅ |

## References

- YouMind API: see [references/openapi-document.md](references/openapi-document.md)
- CLI commands: see [references/cli-reference.md](references/cli-reference.md)
- YouMind Skills gallery: https://youmind.com/skills?utm_source=youmind-wechat-article
- Publishing: [shared/PUBLISHING.md](../../shared/PUBLISHING.md)
