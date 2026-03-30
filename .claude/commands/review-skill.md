# Review a Skill PR

Review a new or updated skill PR against the repo's conventions and provide growth/SEO optimization suggestions.

## Input

$ARGUMENTS — A GitHub PR URL (e.g. `https://github.com/YouMind-OpenLab/skills/pull/2`) or PR number (e.g. `2`).

## Instructions

### Step 1: Fetch PR

```bash
# If input is a URL, extract the PR number
gh pr view <PR_NUMBER> --json title,body,author,state,headRefName,files,additions,deletions
```

Fetch the PR branch locally to read files:

```bash
git fetch origin pull/<PR_NUMBER>/head:pr-review-<PR_NUMBER>
git checkout pr-review-<PR_NUMBER>
```

### Step 2: Identify the skill directory

Find the new or changed skill directory under `skills/`. Read:
- `SKILL.md` (mandatory)
- `README.md` (if exists)
- `package.json` (if exists)
- `.clawhubignore` (if exists)
- List all files in the skill directory

### Step 3: Run the Review Checklist

Check every item below. For each, report ✅ pass, ❌ fail (must fix), or ⚠️ warning (suggested).

#### A. Repo Convention Compliance

| # | Check | Rule | Reference |
|---|-------|------|-----------|
| 1 | **Slug/directory name** | Must be `youmind-<feature>`, kebab-case, ≤32 chars after sanitization. Should contain natural search keywords (noun > verb). Pattern: `youmind-{platform/domain}-{output}`. | `shared/SKILL_TEMPLATE.md` |
| 2 | **`.clawhubignore` exists** | Every skill must have one. At minimum exclude `references/environment.md`. Also exclude `node_modules/`, lock files, large binary dirs. | `shared/SKILL_TEMPLATE.md` |
| 3 | **Shared sync files** | `references/` should contain `setup.md`, `environment.md`, `error-handling.md`, `long-running-tasks.md` from `shared/`. Run `./scripts/sync-shared.sh` to verify. If intentionally skipped, PR body must explain why. | `scripts/sync-shared.sh` |
| 4 | **SKILL.md language** | SKILL.md instructions must be in English. Multilingual triggers in `description` and `triggers` are OK. Chinese/CJK in the instruction body is only acceptable if the skill is inherently locale-specific (e.g. WeChat) AND clearly marked. | `shared/SKILL_TEMPLATE.md` |
| 5 | **UTM tracking** | Every user-facing `youmind.com` link must include `?utm_source=<skill-slug>`. Check both SKILL.md and README.md. | `shared/SKILL_TEMPLATE.md` |
| 6 | **`metadata.openclaw` declared** | Must have `primaryEnv`, `requires.env` (only truly required vars), `requires.anyBins`. Optional/dev-only env vars must NOT be in `requires.env`. | `shared/SKILL_TEMPLATE.md` |
| 7 | **No secrets in code** | No hardcoded API keys, tokens, or passwords. Config should use env vars or external config files (`.gitignore`'d). | General security |
| 8 | **Lock files excluded** | `package-lock.json` / `pnpm-lock.yaml` should be in `.gitignore` or `.clawhubignore`, not committed (unless the skill is the root package). | Convention |
| 9 | **Binary assets** | Images/videos should be reasonable in size. Large assets (>5 MB total) should use CDN URLs or be excluded from ClawHub via `.clawhubignore`. | Convention |
| 10 | **PR body** | Must describe what the skill does, how to test it, and any known limitations. Empty PR body = fail. | Convention |
| 11 | **Onboarding block** | SKILL.md must have the `⚠️ MANDATORY` onboarding message block that shows immediately after installation. | `shared/SKILL_TEMPLATE.md` |
| 12 | **Frontmatter complete** | `name`, `version`, `description`, `triggers`, `platforms`, `metadata.openclaw`, `allowed-tools` all present. `version` must be valid semver — CI auto-publishes to ClawHub on merge based on this field. | `shared/SKILL_TEMPLATE.md` |

#### B. Growth & SEO Analysis

| # | Check | What to evaluate |
|---|-------|-----------------|
| 13 | **Slug keyword quality** | Does the slug contain the most natural search phrase? Would a user searching for this skill's functionality find it? Suggest alternatives if not. |
| 14 | **Description first 160 chars** | This is the ClawHub search card text. Must pack: core feature + key differentiator. No generic filler ("Plan, write, format..."). |
| 15 | **Trigger completeness** | Are all natural-language phrases covered? Check: English, Chinese, Japanese, Korean variants. Check both formal and casual phrasing. |
| 16 | **Title optimization** | H1 title should include key search terms. Consider adding a subtitle after `—` for extra keyword density. |
| 17 | **Comparison table** | Does SKILL.md include a comparison table vs alternatives? This enriches vector semantic coverage on ClawHub. If missing, draft one. |
| 18 | **Unique value proposition** | Can you identify what makes this skill different from doing it manually or with other tools? Is this clearly communicated in the first 2 paragraphs? |

#### C. Quality & Robustness

| # | Check | What to evaluate |
|---|-------|-----------------|
| 19 | **Error handling / fallbacks** | Does the skill define fallbacks for each major step? A single-step failure should never halt the entire pipeline. |
| 20 | **Setup complexity** | How many steps to get from install to first use? More than 3 steps = suggest simplification. |
| 21 | **Onboarding friction** | Is there a zero-config path? Can users try something before configuring everything? |

### Step 4: Generate the Review

Output a structured review with:

1. **Summary** — One paragraph: what the skill does, its core value proposition, and overall quality assessment.
2. **🔴 Must Fix** — Numbered list of items that violate repo conventions. Each with: what's wrong, how to fix it, which rule it violates.
3. **🟡 Suggested** — Numbered list of improvements that would make it better but aren't blocking.
4. **🚀 Growth & SEO** — Specific, actionable suggestions for description, slug, triggers, title, comparison table. Include ready-to-paste YAML/markdown where possible.
5. **✅ What's Good** — Acknowledge what's well done. Be specific.

### Step 5: Post the Review

```bash
gh pr review <PR_NUMBER> --request-changes --body '<review content>'
```

If everything passes (no 🔴 items), use `--approve` instead of `--request-changes`.

## Notes

- Always fetch and read the actual files — don't rely only on the diff.
- Cross-reference with existing skills in the repo for consistency.
- If the skill has a `toolkit/` or `scripts/` directory, spot-check for obvious issues (hardcoded secrets, missing error handling) but don't do a full code audit.
- The review should be thorough but actionable — every critique must include a specific fix.
