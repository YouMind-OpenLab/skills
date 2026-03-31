# AGENTS.md — AI Contributor Guidelines

## Auto Version Bump (MANDATORY)

**Every code change to a skill MUST include a version bump in its `SKILL.md` frontmatter.**

The version field uses [semver](https://semver.org/) (`x.y.z`):

| Change Type | Bump | Examples |
|---|---|---|
| **Breaking changes / major feature** | `y` (minor) | New capability, restructured workflow, API change, added major reference docs |
| **Bug fix / small tweak / docs fix** | `z` (patch) | Typo fix, wording improvement, bug fix, dependency update, minor config change |

### Rules

1. **Before committing**, check the current `version:` in the skill's `SKILL.md` frontmatter.
2. Determine if the change is a feature/major change → bump `y` (reset `z` to 0), or a fix/minor change → bump `z`.
3. Update the `version:` line in the SKILL.md frontmatter accordingly.
4. CI auto-publishes to ClawHub on merge to `main` based on this version field. **If the version is not bumped, the publish is skipped.**

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

## Other Guidelines

- See `CLAUDE.md` for detailed version bump criteria (what counts as major vs fix).
- See `shared/SKILL_TEMPLATE.md` for skill structure conventions.
- See `shared/PUBLISHING.md` for publishing details.
