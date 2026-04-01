# YouMind Dev.to Skill

AI-powered Dev.to article writing and publishing. Tell your agent a topic, it handles research, writing, formatting, and publishing.

---

## What Can It Do

| You say | Skill does |
|---------|------------|
| `Write about Docker best practices for Dev.to` | Full pipeline: research -> write -> adapt -> publish as draft |
| `Publish this markdown to Dev.to` | Skip writing, format and publish directly |
| `Validate my article for Dev.to` | Check tags, front matter, code blocks |
| `List my Dev.to articles` | Fetch and display your published articles |

---

## Getting Credentials

### Getting a Dev.to API Key

> Dev.to API Key settings page: <https://dev.to/settings/extensions>

**Step 1 -- Log in to Dev.to**

Log in to [Dev.to](https://dev.to) with your account.

**Step 2 -- Go to Settings > Extensions**

Click your avatar (top-right) -> **Settings** -> select **Extensions** from the left menu.

Direct link: <https://dev.to/settings/extensions>

**Step 3 -- Generate an API Key**

At the bottom of the page, find the **"DEV Community API Keys"** section:

1. Enter a description in the "Description" field (e.g., `youmind`)
2. Click the **"Generate API Key"** button
3. Copy the generated API Key (shown only once -- save it immediately)

**Step 4 -- Fill in Config**

Paste the API Key into `config.yaml`:

```yaml
devto:
  api_key: "your-api-key-here"
```

---

## Installation

> Prerequisites: Node.js >= 18

```bash
# 1. Install dependencies
cd toolkit && npm install && npm run build && cd ..

# 2. Create config (if config.yaml doesn't exist)
cp config.example.yaml config.yaml

# 3. Fill in API keys in config.yaml
```

Required fields in `config.yaml`:

| Field | Required | Description |
|-------|----------|-------------|
| `devto.api_key` | **Yes** | Dev.to API Key, see steps below |
| `youmind.api_key` | Recommended | For knowledge base search, web search, article archiving -> [Get API Key](https://youmind.com/settings/api-keys?utm_source=youmind-devto-article) |

---

## YouMind Integration

The Dev.to Skill integrates with the [YouMind](https://youmind.com) knowledge base for enhanced content creation.

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

### Dev.to Content Guidelines

- **TL;DR**: Add a TL;DR summary at the beginning of every article -- this is a Dev.to community convention
- **Code blocks**: Must specify the language (e.g., ` ```typescript `), otherwise no syntax highlighting
- **Tags**: Up to 4, lowercase, only alphanumeric characters and hyphens (e.g., `typescript`, `web-dev`)
- **Title**: 60-80 characters, keywords front-loaded for SEO
- **Description**: Up to 170 characters, used for SEO and social sharing
- **Tone**: Developer-to-developer, avoid marketing language

### CLI Commands

```bash
cd toolkit

# Publish a markdown file
npx tsx src/cli.ts publish article.md --tags "typescript,webdev"

# Preview and validate locally
npx tsx src/cli.ts preview article.md

# Validate API connectivity
npx tsx src/cli.ts validate

# List your articles
npx tsx src/cli.ts list --page 1
```

### Publishing Status

The skill publishes as draft by default. You can preview in the Dev.to dashboard before making it public.

---

## FAQ

**Q: API Key invalid or 401 error**

Double-check the `devto.api_key` in `config.yaml`. If the key expired or was deleted, regenerate it at <https://dev.to/settings/extensions>.

**Q: Tag doesn't exist**

Dev.to tags are community-created. You can't use non-existent tags. The skill auto-validates and suggests existing ones.

**Q: Article sounds too AI-generated**

Describe your writing style preferences in the prompt, or provide past articles as reference. The skill will adapt to your tone.

**Q: Can I update published articles?**

Yes. The Dev.to API supports updating article content, tags, and status.

---

## License

MIT
