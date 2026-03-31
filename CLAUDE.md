# CLAUDE.md — AI Contributor Guidelines

## Auto Version Bump (MANDATORY)

**Every code change to a skill MUST include a version bump in its `SKILL.md` frontmatter.**

The version field uses [semver](https://semver.org/) (`x.y.z`):

| Change Type | Bump | Examples |
|---|---|---|
| **Breaking changes / major feature** | `y` (minor) | New capability, restructured workflow, API change, added major reference docs |
| **Bug fix / small tweak / docs fix** | `z` (patch) | Typo fix, wording improvement, bug fix, dependency update, minor config change |

### Rules

1. **Before your first commit on a branch**, check the current `version:` in the skill's `SKILL.md` frontmatter.
2. Determine if the change is a feature/major change → bump `y` (reset `z` to 0), or a fix/minor change → bump `z`.
3. Update the `version:` line in the SKILL.md frontmatter accordingly.
4. **One bump per branch/PR.** If you already bumped the version in an earlier commit on the same branch, do NOT bump again on subsequent commits. The version reflects the entire PR, not individual commits.
5. If a branch starts as a patch (z bump) but later adds a feature, upgrade to a minor (y bump) — but still only one bump total.
6. CI auto-publishes to ClawHub on merge to `main` based on this version field. **If the version is not bumped, the publish is skipped.**

### Examples

```
# Bug fix: typo in SKILL.md instructions
version: 1.0.0 → version: 1.0.1

# New feature: added image generation support
version: 1.0.1 → version: 1.1.0

# Fix error handling in scripts
version: 1.1.0 → version: 1.1.1

# Major restructure of the skill workflow
version: 1.1.1 → version: 1.2.0
```

### What counts as "major change" (bump y)?

- Adding a new command or workflow step
- Adding/removing required environment variables
- Changing the skill's API interface or expected input/output
- Adding significant new reference docs or scripts
- Restructuring the skill directory

### What counts as "fix/small tweak" (bump z)?

- Fixing a bug in scripts or instructions
- Fixing typos, grammar, or formatting
- Updating dependency versions
- Minor wording improvements
- Adding comments or clarifications

## Other Guidelines

- See `shared/SKILL_TEMPLATE.md` for skill structure conventions.
- See `shared/PUBLISHING.md` for publishing details.
- Every skill must have a `.clawhubignore` file.
- SKILL.md must be written in English (multilingual triggers in description are OK).
- Every user-facing `youmind.com` link must include `?utm_source=<skill-slug>`.
