# YouMind Skills

AI agent skills powered by [YouMind](https://youmind.com?utm_source=github-skills-repo). Extract knowledge, create content, and manage your learning — all from your favorite AI coding tools.

## Available Skills

| Skill | Description | ClawHub |
|-------|-------------|---------|
| [youmind](skills/youmind/) | Base CLI — search, inspect, and call YouMind APIs | [![Install](https://img.shields.io/badge/clawhub-install-blue)](https://clawhub.ai/skill/youmind) |
| [youmind-youtube-transcript](skills/youmind-youtube-transcript/) | Batch extract YouTube transcripts — up to 5 at once, no yt-dlp needed | [![Install](https://img.shields.io/badge/clawhub-install-blue)](https://clawhub.ai/skill/youmind-youtube-transcript) |
| [youmind-deep-research](skills/youmind-deep-research/) | Deep research on any topic — comprehensive reports with citations and insights | [![Install](https://img.shields.io/badge/clawhub-install-blue)](https://clawhub.ai/skill/youmind-deep-research) |
| [youmind-image-generator](skills/youmind-image-generator/) | Generate AI images — one API key for GPT Image, Gemini, Seedream, and 10+ models | [![Install](https://img.shields.io/badge/clawhub-install-blue)](https://clawhub.ai/skill/youmind-image-generator) |
| [youmind-slides-generator](skills/youmind-slides-generator/) | Generate presentation slides from a topic or outline — view, edit, download | [![Install](https://img.shields.io/badge/clawhub-install-blue)](https://clawhub.ai/skill/youmind-slides-generator) |
| [youmind-web-clipper](skills/youmind-web-clipper/) | Save any URL to your YouMind board — instant web clipper from terminal | [![Install](https://img.shields.io/badge/clawhub-install-blue)](https://clawhub.ai/skill/youmind-web-clipper) |
| [youmind-blog-cover](skills/youmind-blog-cover/) | Generate blog cover images — clean 16:9 compositions with multi-model AI | [![Install](https://img.shields.io/badge/clawhub-install-blue)](https://clawhub.ai/skill/youmind-blog-cover) |
| [youmind-webpage-generator](skills/youmind-webpage-generator/) | Generate webpages — landing pages, portfolios, event pages with one click | — |
| [youmind-wechat-article](skills/youmind-wechat-article/) | Write and publish WeChat articles end-to-end — topic mining to draft box | — |

## Quick Install

### Option 1: skills CLI (from GitHub)

```bash
# Install a specific skill
npx skills add YouMind-OpenLab/skills --skill youmind-youtube-transcript

# See all available skills
npx skills add YouMind-OpenLab/skills --list

# Install everything
npx skills add YouMind-OpenLab/skills --all
```

### Option 2: ClawHub

```bash
# Install from ClawHub registry
clawhub install youmind-youtube-transcript

# Search for YouMind skills
clawhub search youmind
```

## Prerequisites

All skills require the [YouMind CLI](https://www.npmjs.com/package/@youmind-ai/cli):

```bash
npm install -g @youmind-ai/cli
export YOUMIND_API_KEY=sk-ym-xxx
```

Get your API key at [youmind.com/settings/api-keys](https://youmind.com/settings/api-keys?utm_source=github-skills-repo)

## Works With

These skills work with any AI agent that supports the skill format:

- [OpenClaw](https://openclaw.ai)
- [Claude Code](https://docs.anthropic.com/en/docs/claude-code)
- [Cursor](https://cursor.sh)
- [Codex](https://openai.com/codex)
- [Gemini CLI](https://github.com/google-gemini/gemini-cli)
- [Windsurf](https://windsurf.com)
- [Kilo Code](https://kilocode.ai)
- [OpenCode](https://opencode.ai)
- [Goose](https://block.github.io/goose)
- [Roo Code](https://roocode.com)
- Any tool supporting `npx skills add`

## Contributing

### Add a new skill

1. Create `skills/youmind-<name>/SKILL.md` following [shared/SKILL_TEMPLATE.md](shared/SKILL_TEMPLATE.md)
2. Add `version: 1.0.0` in SKILL.md frontmatter
3. Add `.clawhubignore` (see template for required excludes)
4. Run `./scripts/sync-shared.sh` to sync shared references
5. Open a PR — use `/review-skill <PR#>` in Claude Code for automated review

### Update an existing skill

1. Make your changes
2. Bump `version:` in SKILL.md frontmatter ([semver](https://semver.org/))
3. Open a PR

### Auto-publish

When a PR merges to `main`, CI automatically publishes changed skills to ClawHub. See [shared/PUBLISHING.md](shared/PUBLISHING.md) for details.

## License

MIT
