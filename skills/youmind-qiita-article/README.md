# YouMind Qiita Skill

AI-powered Qiita article writing and publishing. Tell your agent a topic, and it can research, write, format, and publish through the Qiita account you already connected in YouMind.

---

## What It Does

| You say | Skill does |
|---------|------------|
| `Write about Docker best practices for Qiita` | Research -> write -> adapt -> publish as private |
| `Publish this markdown to Qiita` | Skip writing, format and publish directly |
| `Validate my article for Qiita` | Check tags, code blocks, structure |
| `List my Qiita articles` | Fetch your Qiita articles through YouMind |

---

## Setup

> Prerequisites: Node.js >= 18

```bash
# 1. Install dependencies
cd toolkit && npm install && npm run build && cd ..

# 2. Create config (if config.yaml doesn't exist)
cp config.example.yaml config.yaml
```

`config.yaml` only needs the YouMind API key:

```yaml
youmind:
  api_key: "sk-ym-..."
  base_url: "https://youmind.com/openapi/v1"
```

Commands read `youmind.api_key` and `youmind.base_url` from local `config.yaml`.
Keep the documented domain as `https://youmind.com/openapi/v1`. If you need to test against a local `youapi`, change only your local `config.yaml`.

### Publishing prerequisite

Before publishing, connect your Qiita account inside YouMind. The skill no longer reads `qiita.access_token` locally and should never ask the user to paste a Qiita token into this repo.

### Get a YouMind API Key

Visit [YouMind API Key Settings](https://youmind.com/settings/api-keys?utm_source=youmind-qiita-article), create a key, and place it in `youmind.api_key`.

---

## YouMind Integration

The Qiita Skill integrates with the [YouMind](https://youmind.com) knowledge base for enhanced content creation.

### Knowledge Base Search

Search your YouMind library for related articles, notes, and bookmarks as research material. AI matches content semantically, not just by keywords.

### Web Search

Search the web for real-time information and trending topics. Automatically cite the latest data and trends when writing.

### Article Archiving

After publishing, save the article back to your YouMind knowledge base for future reference and repurposing.

### Material Mining

Browse boards and extract relevant materials from your YouMind workspace for content creation.

### Get API Key

Visit [YouMind API Key Settings](https://youmind.com/settings/api-keys) to get your API Key, then fill it into the `youmind.api_key` field in `config.yaml`.

---

## Usage Tips

### Qiita Content Guidelines

- **Environment info**: Always include versions, OS, tools used -- Qiita readers expect reproducible examples
- **Code blocks**: Must specify the language (e.g., ` ```python `). Use ` ```python:main.py ` to show filename
- **Tags**: Up to 5, free-form (e.g., `Python`, `Docker`, `TypeScript`, `初心者`)
- **Title**: Specific, technology-first (e.g., `TypeScript で CLI ツールを作る`)
- **Tone**: Knowledge-sharing, technical, peer-to-peer
- **Language**: Match the user's language (Japanese or English)

### CLI Commands

Put local source Markdown under the skill's `output/` directory so it stays out of git status.

```bash
cd toolkit

# Publish a markdown file
npx tsx src/cli.ts publish ../output/article.md --tags "Python,API,Qiita"

# Preview and validate locally
npx tsx src/cli.ts preview ../output/article.md

# Validate YouMind + Qiita connectivity
npx tsx src/cli.ts validate

# List your articles
npx tsx src/cli.ts list --page 1
```

### Publishing Status

The skill publishes as private (limited sharing) by default. Use `--public` to publish publicly, or change the visibility in the Qiita dashboard.

All local article drafts should live under `output/`, which is already git-ignored.

### Paid Plan Requirement

Qiita OpenAPI requires a paid YouMind plan (Pro / Max). If the current account is not eligible, the API returns `402` and points the user to [YouMind Pricing](https://youmind.com/pricing).

---

## FAQ

**Q: I get a 401 or auth error**

Check `youmind.api_key` in `config.yaml`. The skill now authenticates only with YouMind.

**Q: Publishing says Qiita is not connected**

Connect Qiita inside YouMind first. The Qiita token lives there, not in `config.yaml`.

**Q: Tags not working**

Qiita tags are free-form — any tag name works. Tags are case-sensitive (`Python` != `python`). Use existing popular tags for best discoverability.

**Q: Should I write in Japanese or English?**

Most Qiita content is in Japanese. English articles are accepted but have a smaller audience. The skill follows the language of your prompt.

**Q: What is private mode?**

Private articles are only accessible via direct URL. They don't appear in search results or feeds. Useful for drafts or team sharing.

**Q: Can I update published articles?**

Yes. The YouMind Qiita OpenAPI supports create, get, update, and list flows.

---

## License

MIT
