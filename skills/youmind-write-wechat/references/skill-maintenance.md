# Skill Maintenance

Read this file only when improving, refactoring, or reviewing the skill itself.

---

## Primary Role

Treat this as one primary skill: a **WeChat article production workflow** with deterministic tooling behind it.

- Keep end-user execution guidance in `SKILL.md`.
- Keep maintainer-only guidance here or in scripts.
- If one area grows into its own product surface, split it instead of stuffing more into `SKILL.md`.

Current secondary areas that may eventually deserve their own skill:

- client onboarding and playbook generation
- analytics and edit-learning
- advanced theme design

---

## Description Discipline

The `description` field is for triggering, not for summarizing the project.

- Prefer user phrasing: "公众号", "草稿箱", "微信排版", "复盘文章表现".
- Include verbs that imply action: write, rewrite, format, preview, publish, review.
- Exclude adjacent but wrong triggers like generic blog writing or non-WeChat SEO.

If a new user request should trigger the skill but would not obviously match the current description, update the description.

---

## Gotchas Discipline

Keep gotchas high-signal and failure-driven.

- Add a gotcha only when it reflects a real recurring failure mode.
- Phrase each gotcha as: symptom, why it is wrong, correction.
- Prefer concrete failure patterns over abstract advice.

High-value gotcha classes for this repo:

- AI-sounding prose
- shallow topic angles
- pipeline halting on a single step failure
- missing blacklist checks
- documentation drifting away from actual commands or file layout

---

## Validation Workflow

After changing `SKILL.md`, `README.md`, `references/`, `toolkit/package.json`, or the repo layout:

1. Run `python3 scripts/validate_skill.py`
2. Run `cd toolkit && npm run build`

Treat documentation drift as a product bug, not a cosmetic issue.

Prefer deterministic checks in scripts over adding more prose to `SKILL.md`.

For visual generation behavior, preserve this invariant:

- the skill proactively asks about image scope and style before Step 6 generation
- if the host supports `AskUserQuestion`, prefer that structured path

---

## Data and Persistence

Current mutable data lives in repo-local paths such as:

- `clients/*/history.yaml`
- `clients/*/lessons/`
- `output/`
- local `config.yaml`

This is acceptable while the skill is primarily repo-scoped. If this skill is later distributed as a shared plugin or marketplace package, move mutable state to a stable plugin data directory instead of the skill folder itself.

---

## When to Split the Skill

Split instead of expanding the main skill when one area becomes independently useful or forces unrelated context into normal article runs.

Reasonable future split points:

- `youmind-wechat-ops` for onboarding, analytics, and edit-learning
- `youmind-wechat-theme-design` for custom theme generation
- `youmind-wechat-publish` for formatting and draft-box operations only
