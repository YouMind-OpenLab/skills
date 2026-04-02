# YouMind Qiita Skill

AI-powered Qiita article writing and publishing. Tell your agent a topic, it handles research, writing, formatting, and publishing.

---

## What Can It Do

| You say | Skill does |
|---------|------------|
| `Write about Docker best practices for Qiita` | Full pipeline: research -> write -> adapt -> publish as private |
| `Publish this markdown to Qiita` | Skip writing, format and publish directly |
| `Validate my article for Qiita` | Check tags, code blocks, structure |
| `List my Qiita articles` | Fetch and display your published articles |

---

## Getting Credentials

### Getting a Qiita Access Token

> Qiita access token settings page: <https://qiita.com/settings/applications>

**Step 1 -- Log in to Qiita**

Log in to [Qiita](https://qiita.com) with your account.

**Step 2 -- Go to Settings > Applications**

Click your avatar (top-right) -> **Settings** -> select **Applications** from the menu.

Direct link: <https://qiita.com/settings/applications>

**Step 3 -- Generate a Personal Access Token**

Under **Personal Access Tokens**:

1. Click **"Generate new token"**
2. Enter a description (e.g., `youmind`)
3. Select the **`write_qiita`** scope (required for creating and updating articles)
4. Click **"Generate token"**
5. Copy the token (shown only once -- save it immediately)

**Step 4 -- Fill in Config**

Paste the access token into `config.yaml`:

```yaml
qiita:
  access_token: "your-access-token-here"
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
| `qiita.access_token` | **Yes** | Qiita personal access token, see steps above |
| `youmind.api_key` | Recommended | For knowledge base search, web search, article archiving -> [Get API Key](https://youmind.com/settings/api-keys?utm_source=youmind-qiita-article) |

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

```bash
cd toolkit

# Publish a markdown file
npx tsx src/cli.ts publish article.md --tags "Python,API,Qiita"

# Preview and validate locally
npx tsx src/cli.ts preview article.md

# Validate API connectivity
npx tsx src/cli.ts validate

# List your articles
npx tsx src/cli.ts list --page 1
```

### Publishing Status

The skill publishes as private (limited sharing) by default. Use `--public` to publish publicly, or change the visibility in the Qiita dashboard.

---

## FAQ

**Q: Access token invalid or 401 error**

Double-check the `qiita.access_token` in `config.yaml`. Make sure the token has the `write_qiita` scope. If expired, regenerate at <https://qiita.com/settings/applications>.

**Q: Tags not working**

Qiita tags are free-form — any tag name works. Tags are case-sensitive (`Python` != `python`). Use existing popular tags for best discoverability.

**Q: Should I write in Japanese or English?**

Most Qiita content is in Japanese. English articles are accepted but have a smaller audience. The skill follows the language of your prompt.

**Q: What is private mode?**

Private articles are only accessible via direct URL. They don't appear in search results or feeds. Useful for drafts or team sharing.

**Q: Can I update published articles?**

Yes. The Qiita API supports updating article content, tags, and visibility.

---

## License

MIT
