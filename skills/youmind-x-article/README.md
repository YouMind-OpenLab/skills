# YouMind X Skill

Publish tweets and threads to X (Twitter) with AI. Research, write, and publish -- all from one prompt.

---

## Quick Start

| You say | Skill does |
|---------|-----------|
| `Write a tweet about AI trends` | Research, write, publish single tweet |
| `Write a thread about how LLMs work` | Split into threaded reply chain |
| `Tweet this: "Just shipped!"` | Format and publish directly |

---

## Install

> Requirements: Node.js >= 18

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
| `youmind.api_key` | Recommended | For knowledge base search |

*Either OAuth 2.0 access_token OR all four OAuth 1.0a fields required.

## CLI Commands

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

## License

MIT
