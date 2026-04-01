# YouMind X (Twitter) Skill

Publish tweets and threads to X (Twitter) with AI. Research, write, and publish -- all from one prompt.

---

## What Can It Do

| You say | Skill does |
|---------|------------|
| `Tweet about AI coding tools` | Write → adapt to 280 chars → publish tweet |
| `Write a thread about Docker best practices` | Write → split into thread → publish tweet chain |
| `Tweet this: "Just shipped!"` | Format and publish directly |

---

## Getting Credentials

### Step 1 — Visit X Developer Portal

Go to [X Developer Portal](https://developer.x.com/en/portal/dashboard) and sign in with your X account.

### Step 2 — Create a Project and App

Create a new **Project** in the Dashboard, then create an **App** under that Project.

### Step 3 — Configure User Authentication

In your App settings, find **User authentication settings** and configure:

- **App permissions**: Read and Write
- **Type of App**: Web App
- **Redirect URL**: `http://localhost:3000/callback`

### Step 4 — Get Credentials

Two methods to get credentials:

**Method A: OAuth 2.0 (Recommended)**

1. Go to your App's **Keys and Tokens** page and generate an Access Token
2. Fill in `config.yaml` field `x.access_token`

**Method B: OAuth 1.0a (Legacy)**

1. Get API Key + API Secret → fill in `x.api_key`, `x.api_secret`
2. Generate Access Token + Secret → fill in `x.access_token_legacy`, `x.access_token_secret`

### Rate Limits

- **Free tier**: 1,500 tweets/month
- **Basic ($100/mo)**: 3,000 tweets/month

---

## Installation

> Prerequisites: Node.js >= 18

```bash
# 1. Install dependencies
cd toolkit && npm install && npm run build && cd ..

# 2. Create config file
cp config.example.yaml config.yaml
```

Fill in your credentials in `config.yaml`:

| Field | Required | Description |
|-------|----------|-------------|
| `x.access_token` | **Yes*** | OAuth 2.0 user access token |
| `x.api_key` | Alt* | OAuth 1.0a consumer key |
| `x.api_secret` | Alt* | OAuth 1.0a consumer secret |
| `x.access_token_legacy` | Alt* | OAuth 1.0a access token |
| `x.access_token_secret` | Alt* | OAuth 1.0a access token secret |
| `youmind.api_key` | Recommended | For knowledge base search, web search, article archiving → [Get API Key](https://youmind.com/settings/api-keys?utm_source=youmind-x-article) |

*Either OAuth 2.0 access_token OR all four OAuth 1.0a fields required.

---

## YouMind Integration

This skill integrates with [YouMind](https://youmind.com) knowledge base to enhance content quality.

| Feature | Description |
|---------|-------------|
| Semantic Search | Search your library for related articles, notes, bookmarks as research material |
| Web Search | Search the web for real-time info and trending topics |
| Article Archiving | Save published articles back to YouMind for future reference |
| Material Mining | Browse boards and extract materials for content creation |
| Board Management | List and view your boards and materials |

> **Get API Key:** [youmind.com/settings/api-keys](https://youmind.com/settings/api-keys?utm_source=youmind-article-dispatch)

---

## Usage Tips

### Single Tweet

Just say what you want to tweet. The Skill automatically adapts to the 280-character limit with proper tone and formatting.

### Threads

Provide a longer topic and the Skill splits it into a coherent thread, publishing each tweet in sequence.

### CLI Commands

```bash
# Post a single tweet
npx tsx src/cli.ts tweet --text "Your tweet here"

# Post a thread from a file
npx tsx src/cli.ts thread --file article.md

# Preview thread splitting
npx tsx src/cli.ts preview --file article.md

# Check your profile
npx tsx src/cli.ts me

# Delete a tweet
npx tsx src/cli.ts delete --id 1234567890
```

---

## FAQ

**403 Forbidden on publish** — Check that App permissions are set to "Read and Write".

**OAuth Token expired** — Regenerate your Access Token and update `config.yaml`.

**Tweet truncated** — The Skill auto-fits within 280 chars; if content is too long, it suggests splitting into a thread.

**Free tier quota exceeded** — Free tier allows 1,500 tweets/month. Upgrade to Basic ($100/mo) for 3,000/month.

---

## License

MIT
