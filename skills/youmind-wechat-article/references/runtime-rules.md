# Runtime Rules

Read this file when you need the skill's execution-time invariants rather than its writing workflow.

---

## Draft Location Rule

**Canonical:** write local article Markdown files to `~/.youmind/articles/wechat/<client>/<slug>.md` (multi-client aware — see `shared/YOUMIND_HOME.md`).

**Legacy fallback** (if `~/.youmind/` is not writable): `skills/youmind-wechat-article/output/<slug>.md`.

Never the skill root, `drafts/`, `references/`, `toolkit/`, `clients/` (config only), or `scripts/`. Both locations are git-ignored. Use kebab-case filenames such as `my-article.md`.

Client configs live at `~/.youmind/clients/<client>/{style.yaml,history.yaml,playbook.md}`. The tracked `clients/demo/` directory under this skill is a template only.

Local file ≠ WeChat draft box; the draft box is a server-side publish target, not a path.

---

## Dispatch Integration

This skill is self-contained and standalone. The `youmind-article-dispatch` hub is an optional companion, never a dependency.

- Read `~/.youmind/author-profile.yaml` for cross-platform voice preferences.
- If dispatch invokes this skill with `resolved_author`, use it as extra context.
- If dispatch or the caller makes it clear that the article is already finished, keep the existing article as source of truth and use the skill's built-in formatting + direct-send capability.
- The de-AI protocol in `writing-guide.md` remains mandatory regardless of invocation path.
- Optional interop contract: `dispatch-capabilities.yaml` and `shared/DISPATCH_CONTRACT.md`.

---

## Built-In Formatting + Direct-Send Capability

Use this path when the user already supplied a finished article and only wants WeChat formatting / draft-box publishing.

- Skip topic mining, hotspot fetch, framework selection, and fresh drafting.
- Run only the minimum checks that affect WeChat delivery: title/digest, paragraph rhythm, image/link sanitation, theme choice, and publish.
- Only reopen writing or research if the user explicitly asks for deeper adaptation.

---

## Execution Modes

**Auto (default):** Run Steps 1–5 automatically. Before Step 6 image generation, proactively ask once about image scope and style unless the user already specified them. Then continue through Steps 6–8. Only pause elsewhere if a step AND its fallback both fail, required info is missing, or the user explicitly asks to pause.

**Interactive:** Triggered by phrases such as "interactive mode", "let me choose", or "show me the topics/frameworks/themes". Pause at topic selection, framework choice, image plan, and theme selection. All other steps run automatically.

---

## Result Links Rule

After any draft, publish, list, or stats-review action, always end with `Result links`.

- Preserve any `resultLinks` returned by the CLI or OpenAPI.
- For drafts, also include the preview link from `articles[].url` when available.
- Always include `https://mp.weixin.qq.com/` so the user can finish publish or review manually.
- Render result links as Markdown links such as `[Draft preview](...)`.
- Never leave the user with only `media_id`, article IDs, or status text.
