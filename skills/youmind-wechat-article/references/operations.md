# Operations Reference

> Read this file when handling post-publish commands, standalone formatting, analytics,
> client onboarding, edit learning, custom themes, or first-run setup.

---

## Post-Publish Commands

| User says | Action |
|-----------|--------|
| Polish / shorten / expand / change tone | Edit the article (see writing-guide.md edit section) |
| Change cover to warm tones | Modify cover prompt, regenerate |
| Change image style to illustrated / cinematic / minimal / etc. | Re-run Step 6 with the new style direction |
| Remove the Nth inline image | Remove that image from the Markdown |
| Rewrite with framework B | Return to Step 4 with the new framework |
| Switch to a different topic | Return to Step 3, show the topic list |
| Preview with a different theme/color | Re-run Step 7 with the preview command |
| Show article stats / performance review | Fetch stats and analyze (see Performance Review below) |
| List all themes | Run `cli.js themes` |
| Create new client | Run client onboarding flow (see below) |
| Learn from my edits | Run learn-from-edits flow (see below) |
| Search my materials / knowledge base | Run `youmind-api.js search` |
| Write from my notes / based on this doc | Read the specific material and use as primary source in Step 4 |

---

## Standalone Formatting

When the user provides Markdown only (no writing pipeline needed): use `cli.js preview` or `cli.js publish` directly. Use `cli.js theme-preview` for a 4-theme comparison. See `cli-reference.md` for full syntax.

---

## Performance Review

When the user asks about article stats: fetch with `fetch-stats.js`, backfill history.yaml, then analyze:

1. **Top performer:** Which article did best? Why? (title strategy, topic heat, framework, timing)
2. **Underperformer:** Which article lagged? Root cause hypothesis.
3. **Adjustments:** Specific changes for the next article's topic selection, title strategy, or framework choice.

---

## Client Onboarding

When user says "create new client", "import articles", or "build playbook":

1. Create `clients/{client}/` with: `style.yaml` (copy from demo), `corpus/`, `history.yaml` (empty), `lessons/` (empty).
2. If corpus contains ≥20 articles, run `build-playbook.js`.

---

## Learn From Human Edits

Run `learn-edits.js` with the draft and final versions. Categorizes changes: word choice, paragraph additions/deletions, structure adjustments, title revisions, tone shifts.

Every 5 accumulated lessons triggers a playbook refresh with `--summarize`.

---

## Custom Themes (Progressive Disclosure)

When needs exceed the 10 built-in themes, escalate through three levels:

**Level 1 — Simple tweaks** (e.g., "change the color", "make the font bigger"):
Adjust CLI arguments on built-in themes. Run `cli.js themes` / `cli.js colors` to see options.

**Level 2 — Style-driven customization** (e.g., "tech-futuristic", "literary and clean", "formal business"):
Read `theme-dsl.md` and generate a custom theme JSON. Reference `builtin-themes.json` for CSS examples. Save to `clients/{client}/themes/` and use `--custom-theme`.

Before generating, **auto-detect Impeccable** (see below). If available, the design thinking phases in `theme-dsl.md` will use Impeccable skills for higher quality output.

**Level 3 — Deep design** (e.g., "design something truly special for this theme"):
Same as Level 2, but spend more time on each design thinking phase. Impeccable skills are strongly recommended at this level.

### Impeccable Auto-Detection (Level 2 & 3)

Before creating any custom theme, check if [Impeccable](https://impeccable.style/) is installed:

1. Look for `.impeccable.md` in project root, OR skill files containing "impeccable" / "frontend-design" in `.cursor/skills/`, `.claude/skills/`, or `.agents/skills/`.
2. If found → use Impeccable skills at each design phase checkpoint.
3. If NOT found → proactively ask the user:

> Impeccable 设计技能未安装。安装后自定义主题设计质量会显著提升。是否安装？

If user agrees, run: `npx skills add pbakaus/impeccable --yes`
Then run `/teach-impeccable` once to initialize project design context.

If user declines → proceed without it. The `theme-dsl.md` design phases still run, the agent applies the same design principles internally.

---

## First-Run Setup

If `config.yaml` does not exist when the skill triggers:

1. Copy `config.example.yaml` to `config.yaml`
2. Run `cd toolkit && npm install && npm run build` if `node_modules/` is missing
3. Ask the user for **WeChat credentials** (required for publishing):
   - `appid` — from [微信开发者平台](https://developers.weixin.qq.com/platform?tab1=basicInfo&tab2=dev) → 公众号 → 基础信息
   - `secret` — 同一页面「开发密钥」区域，点击重置获取
4. Ask about **YouMind API Key** (recommended):
   - 获取地址：[YouMind API Keys](https://youmind.com/settings/api-keys?utm_source=youmind-wechat-article)
   - 登录后创建密钥，复制 `sk-ym-xxxx` 格式填入 `youmind.api_key`
   - 用于知识库搜索、联网搜索、文章归档、AI 生图
5. Ask about optional **image provider keys** (Gemini / OpenAI / 豆包)
6. **Configure WeChat IP whitelist** (required for API access — see below)

Store the configuration once; never ask again.

> 完整图文配置指南见 [README.md](../README.md#获取-appid--appsecret--配置-ip-白名单) 和 [SKILL.md Setup](../SKILL.md#setup)

### WeChat IP Whitelist Configuration

The WeChat Official Account API **rejects all requests from IPs not on the whitelist**. This must be configured before publishing can work.

**Step 1 — Get the user's public IP:**

```bash
# macOS / Linux
curl -s https://ifconfig.me

# Windows PowerShell
(Invoke-WebRequest -Uri "https://ifconfig.me" -UseBasicParsing).Content.Trim()
```

Run this command and show the IP to the user.

**Step 2 — Add IP to WeChat whitelist:**

Guide the user to:

1. Open [微信开发者平台](https://developers.weixin.qq.com/platform?tab1=basicInfo&tab2=dev) → 公众号 → 基础信息
2. Find the **「开发密钥」→ API IP 白名单** section
3. Click **编辑**, add the IP from Step 1
4. Save

> **Note:** If the user's IP is dynamic (common for home networks), it may change periodically. When publishing suddenly fails with an IP-related error, re-run the curl command and update the whitelist.
>
> Cloud servers and CI/CD environments typically have static IPs — configure once and forget.
