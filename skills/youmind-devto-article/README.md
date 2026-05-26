# YouMind Dev.to Skill

AI-powered Dev.to article writing and publishing. Tell your agent a topic, and it can research, write, format, and publish through the Dev.to account you already connected in YouMind.

---

## What It Does

| You say | Skill does |
|---------|------------|
| `Write about Docker best practices for Dev.to` | Research -> write -> adapt -> publish as draft |
| `Publish this markdown to Dev.to` | Skip writing, format and publish directly |
| `Validate my article for Dev.to` | Check tags, front matter, code blocks |
| `List my Dev.to articles` | Fetch your Dev.to articles through YouMind |

---

## Setup

> Prerequisites: Node.js >= 18

```bash
# 1. Install dependencies
cd toolkit && npm install && npm run build && cd ..

# 2. Create shared config (recommended)
mkdir -p ~/.youmind/config
cp shared/config.example.yaml ~/.youmind/config.yaml
```

`~/.youmind/config.yaml` only needs the YouMind API key:

```yaml
youmind:
  api_key: "sk-ym-..."
  base_url: "https://youmind.com/openapi/v1"
```

Commands resolve config in this order: `~/.youmind/config/youmind-devto-article.yaml` -> `~/.youmind/config.yaml`.
Keep the documented domain as `https://youmind.com/openapi/v1`. If you need to test against a local `youapi`, change `~/.youmind/config.yaml` or add a skill-specific override under `~/.youmind/config/`.

### Publishing prerequisite

Before publishing, connect your Dev.to account inside YouMind. The skill no longer reads `devto.api_key` locally and should never ask the user to paste a Dev.to token into this repo.

### Get a YouMind API Key

Visit [YouMind API Key Settings](https://youmind.com/settings/api-keys?utm_source=youmind-devto-article), create a key, and place it in `~/.youmind/config.yaml` under `youmind.api_key`.

---

## Usage Tips

### Dev.to Content Guidelines

- **TL;DR**: Add a TL;DR summary at the beginning of every article
- **Code blocks**: Must specify the language, e.g. ` ```typescript `
- **Tags**: Up to 4, lowercase, alphanumeric or hyphen
- **Title**: 60-80 characters, keywords front-loaded for SEO
- **Description**: Up to 170 characters
- **Tone**: Developer-to-developer, avoid marketing language

### CLI Commands

Put local source Markdown under the skill's `output/` directory so it stays out of git status.

```bash
cd toolkit

# Publish a markdown file
npx tsx src/cli.ts publish ../output/article.md --tags "typescript,webdev"

# Preview and validate locally
npx tsx src/cli.ts preview ../output/article.md

# Validate YouMind + Dev.to connectivity
npx tsx src/cli.ts validate

# List your articles
npx tsx src/cli.ts list --page 1

# List only drafts
npx tsx src/cli.ts list-drafts --page 1

# List only published articles
npx tsx src/cli.ts list-published --page 1

# Publish an existing article by ID
npx tsx src/cli.ts publish-article 12345

# Move an article back to draft by ID
npx tsx src/cli.ts unpublish-article 12345
```

### Publishing Status

The skill publishes as draft by default. Drafts should be opened from the Dev.to dashboard at `https://dev.to/dashboard`, because the public article URL may 404 until you publish it. If you want immediate publishing, use `--publish`.

All local article drafts should live under `output/`, which is already git-ignored.

### Paid Plan Requirement

Dev.to OpenAPI now requires a paid YouMind plan (Pro / Max). If the current account is not eligible, the API returns `402` and points the user to [YouMind Pricing](https://youmind.com/pricing).

---

## FAQ

**Q: I get a 401 or auth error**

Check `youmind.api_key` in `~/.youmind/config.yaml`. The skill now authenticates only with YouMind.

**Q: Publishing says Dev.to is not connected**

Connect Dev.to inside YouMind first. The Dev.to token lives there, not in `~/.youmind/config.yaml`.

**Q: Tag doesn't exist**

Dev.to tags are community-created. The skill validates and trims tags automatically.

**Q: Can I update published articles?**

Yes. The YouMind Dev.to OpenAPI supports create, get, update, and list flows.

**Q: Can I publish a draft or unpublish an article explicitly?**

Yes. The CLI and the YouMind Dev.to OpenAPI now support `publishArticle`, `unpublishArticle`, `listDrafts`, and `listPublished`.

---

## License

MIT
