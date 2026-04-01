# YouMind Medium Skill

Write and publish polished Medium articles with AI. Tell your agent a topic, it handles research, writing, and publishing.

> **Important:** Medium's Publishing API is officially deprecated but still functional. This skill supports **article creation only** -- no updates, deletes, or listing via API. Edits must be made through the Medium web interface.

---

## What Can It Do

| You say | Skill does |
|---------|------------|
| `Write a Medium article about AI productivity tools` | Full pipeline: research -> write -> adapt -> publish as draft |
| `Publish this markdown to Medium` | Skip writing, format and publish directly |
| `Validate my Medium token` | Check token validity and get user info |
| `List my Medium publications` | Fetch and display your publications |

---

## Getting Credentials

### Getting a Medium Integration Token

> Medium security settings page: <https://medium.com/me/settings/security>

**Step 1 -- Log in to Medium**

Log in to [Medium](https://medium.com) with your account.

**Step 2 -- Go to Settings > Security and apps**

Click your avatar (top-right) -> **Settings** -> select **Security and apps**.

Direct link: <https://medium.com/me/settings/security>

**Step 3 -- Generate an Integration Token**

Find the **"Integration tokens"** section on the page:

1. Enter a description in the "Token description" field (e.g., `youmind`)
2. Click the **"Get integration token"** button
3. Copy the generated token (shown only once -- save it immediately)

**Step 4 -- Get Publication ID (Optional)**

If you want to publish to a specific Publication instead of your personal profile:

1. After configuring `medium.token`, run the `validate` command
2. Run the `publications` command to get your Publications list
3. Copy the target Publication's ID from the list

```bash
cd toolkit
npx tsx src/cli.ts validate       # Verify token
npx tsx src/cli.ts publications   # List publications
```

**Step 5 -- Fill in Config**

Paste the token into `config.yaml`:

```yaml
medium:
  token: "your-integration-token-here"
  publication_id: ""     # Optional: publish to a specific publication
```

> **Warning:** Medium API is deprecated but still functional. Only article creation (POST) is supported -- no updates, deletes, or listing. Tokens may stop working in the future; regenerate if needed.

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
| `medium.token` | **Yes** | Medium Integration Token, see steps below |
| `medium.publication_id` | No | Optional, publish to a specific Publication (use the `publications` command to get the ID) |
| `youmind.api_key` | Recommended | For knowledge base search, web search, article archiving -> [Get API Key](https://youmind.com/settings/api-keys?utm_source=youmind-medium-article) |

---

## YouMind Integration

The Medium Skill integrates with the [YouMind](https://youmind.com) knowledge base for enhanced content creation.

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

### Medium Content Guidelines

- **Title**: Concise and powerful, 6-12 words is ideal
- **Subtitle**: Supplements the title, entices readers to click
- **Opening**: The first two paragraphs are critical -- Medium uses them as preview. Start with a story or question
- **Paragraphs**: Short paragraphs (2-3 sentences), mobile-friendly
- **Images**: Medium natively supports image embedding -- use images to enhance the reading experience
- **Tags**: Up to 5, choose popular and relevant tags to boost exposure

### CLI Commands

```bash
cd toolkit

# Publish as draft (default)
npx tsx src/cli.ts publish article.md --draft

# Publish publicly
npx tsx src/cli.ts publish article.md --public

# Publish as unlisted
npx tsx src/cli.ts publish article.md --unlisted

# With tags
npx tsx src/cli.ts publish article.md --tags "ai,writing,productivity"

# Publish to a specific publication
npx tsx src/cli.ts publish article.md --publication "pub-id-here"

# Set canonical URL
npx tsx src/cli.ts publish article.md --canonical-url "https://myblog.com/post"

# Validate token
npx tsx src/cli.ts validate

# List your publications
npx tsx src/cli.ts publications
```

### Publishing Status Options

| Option | Description |
|--------|-------------|
| `--draft` | Save as draft (default) |
| `--public` | Publish publicly |
| `--unlisted` | Publish but hidden from Medium feed |

### Medium API Limitations

Medium API only supports:

- Creating articles (POST)
- Getting authenticated user info (GET)
- Getting user's publications (GET)

**Not available**: Update articles, delete articles, list articles, analytics.

---

## FAQ

**Q: Token invalid or 401 error**

Double-check the `medium.token` in `config.yaml`. If the token expired, regenerate it at <https://medium.com/me/settings/security>.

**Q: Does the Medium API still work?**

As of now, it still works. Medium officially deprecated the API but hasn't shut it down. If the API is eventually closed, the skill will report errors.

**Q: How to edit after publishing?**

The Medium API doesn't support editing. After publishing, edit directly on the Medium website (<https://medium.com>).

**Q: Can I publish to a Publication?**

Yes. Set `medium.publication_id` in `config.yaml`, or use the `--publication` flag when publishing. Use the `publications` command to see your available Publications.

**Q: How are images handled?**

The Medium API supports images via URL. The skill auto-converts Markdown image links to Medium format. Local images need to be uploaded to an image host first.

---

## License

MIT
