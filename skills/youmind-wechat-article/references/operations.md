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

If `~/.youmind/config.yaml` does not exist when the skill triggers:

1. Create `~/.youmind/config/` and copy `shared/config.example.yaml` to `~/.youmind/config.yaml`
2. Run `cd toolkit && npm install && npm run build` if `node_modules/` is missing
3. Ask about **YouMind API Key** (required — this is the only credential the skill holds locally):
   - 获取地址：[YouMind API Keys](https://youmind.com/settings/api-keys?utm_source=youmind-wechat-article)
   - 登录后创建密钥，复制 `sk-ym-xxxx` 格式填入 `youmind.api_key`
   - 用于知识库搜索、联网搜索、文章归档、AI 生图，以及代理所有 WeChat 调用
4. Confirm the WeChat Official Account is bound once in **YouMind → Connector Settings** (WeChat). YouMind stores the AppID/AppSecret encrypted server-side, caches `access_token` (2hr TTL), and proxies every cgi-bin call. The skill never sees the secret, and there is **no IP whitelist** to manage.
5. Image generation routes exclusively through YouMind (Nano Banana Pro) — the Step 3 `youmind.api_key` covers it; no separate provider setup needed.
6. Run `cd toolkit && node dist/cli.js validate` to verify the end-to-end wiring (calls YouMind `/wechat/validateConnection` — see "Validation" below).

Store the configuration once; never ask again.

> Full setup walkthrough with screenshots lives in [README.md](../README.md#安装) and [SKILL.md Setup](../SKILL.md#setup).

### Validation

The `validate` CLI command (toolkit/src/cli.ts) is the pre-flight check for the YouMind ↔ WeChat connection:

```bash
cd toolkit && node dist/cli.js validate
```

It calls YouMind's `/wechat/validateConnection` endpoint, which verifies that the bound WeChat Official Account credentials are still valid and returns the AppID plus remaining `access_token` TTL. Run it after:

- initial connector binding,
- rotating the WeChat AppSecret (rebind in YouMind, then re-validate),
- any "publishing fails for mysterious reasons" report from the user.

If the call returns a non-OK status, direct the user back to YouMind Connector Settings to re-bind WeChat — credential rotation happens server-side, not in `~/.youmind/config.yaml`.
