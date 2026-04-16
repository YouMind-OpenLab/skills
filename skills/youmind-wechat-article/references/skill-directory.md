# Skill Directory — Full Reference Index

This is the complete file inventory. Read on demand — do NOT load everything upfront.

## Tier 1 — Always relevant

| Path | Purpose | When to read |
|------|---------|-------------|
| `references/platform-dna.md` | 公众号 audience + format constraints (index to core refs) | Before any content work |
| `references/content-generation-playbook.md` | Idea → 公众号-native draft workflow | When generating new content |
| `references/content-adaptation-playbook.md` | Existing article → 公众号-native workflow | When adapting/localizing |
| `references/pipeline.md` | Full step-by-step execution (Steps 1–8) | When running the writing pipeline |
| `references/writing-guide.md` | Pre-writing framework, depth architecture, de-AI protocol, voice | Step 4 (writing) |

## Tier 2 — Step-specific

| Path | Purpose | When to read |
|------|---------|-------------|
| `references/topic-selection.md` | 4-dimension topic evaluation model | Step 3 (topic generation) |
| `references/frameworks.md` | 5 article frameworks with execution detail | Step 3.5 (framework selection) |
| `references/seo-rules.md` | Title optimization, keyword density, digest, tags | Step 5 (SEO pass) |
| `references/visual-prompts.md` | Cover and inline image design, prompt engineering | Step 6 (visual AI) |
| `references/cli-reference.md` | All CLI command syntax | When running toolkit commands |
| `references/youmind-integration.md` | Knowledge base API, search, archiving | When using YouMind features |
| `references/wechat-constraints.md` | WeChat platform technical limits, safe CSS, size caps | When debugging rendering issues |

## Tier 3 — Operational

| Path | Purpose | When to read |
|------|---------|-------------|
| `references/operations.md` | Post-publish commands, client onboarding, themes, first-run setup | Operational tasks |
| `references/style-template.md` | Client config template with field guide | New client onboarding |
| `references/theme-dsl.md` | Custom theme design language (integrates Impeccable if installed) | Creating custom themes |
| `references/openapi-document.md` | YouMind OpenAPI full endpoint schemas | Calling YouMind API directly |
| `references/skill-maintenance.md` | Skill self-maintenance, validation, architecture guardrails | Refactoring this skill |
| `references/resilience.md` | Per-step fallback chain + environmental failure recovery | When a step fails |
| `references/gotchas.md` | 6 named content quality anti-patterns | When reviewing draft quality |
| `references/builtin-themes.json` | CSS examples for 10 built-in themes | Customizing themes |

## Client + state files

| Path | Purpose | When to read |
|------|---------|-------------|
| `clients/{client}/style.yaml` | Client brand voice, topics, blacklist, theme | Step 1 (load config) |
| `clients/{client}/playbook.md` | Client-specific writing rules (if exists) | Step 4 (writing) |
| `clients/{client}/history.yaml` | Published article history | Step 2.5 (dedup) |
| `~/.youmind/config.yaml` | Shared YouMind API key (only required field) | Step 1 (first-run check) |
| `output/` | Local article Markdown drafts (git-ignored) | When writing |

## Toolkit

| Path | Purpose |
|------|---------|
| `toolkit/dist/*.js` | Compiled executable scripts (run from `toolkit/`) |
| `scripts/*.py` | Python scripts (`fetch_hotspots.py`, `seo_keywords.py`, `validate_skill.py`) |
| `agents/openai.yaml` | OpenAI/Codex agent skill manifest |
