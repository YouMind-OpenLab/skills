# YouMind Reddit Skill

Publish posts to Reddit with AI. Research, write, adapt to subreddit culture, and submit -- all from one prompt.

---

## Quick Start

| You say | Skill does |
|---------|-----------|
| `Post to r/programming about CLI tools` | Research, write, adapt, submit self-post |
| `Submit this link to r/technology` | Create link post with commentary |
| `Write for r/AskReddit: What's your best coding tip?` | Write subreddit-appropriate question |

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
| `reddit.client_id` | **Yes** | Reddit app client ID |
| `reddit.client_secret` | **Yes** | Reddit app client secret |
| `reddit.username` | **Yes** | Your Reddit username |
| `reddit.password` | **Yes** | Your Reddit password |
| `reddit.user_agent` | **Yes** | User agent string |
| `youmind.api_key` | Recommended | For knowledge base search |

## CLI Commands

```bash
# Submit a self-post
npx tsx src/cli.ts submit --subreddit programming --title "My Title" --file article.md

# Submit a link post
npx tsx src/cli.ts submit-link --subreddit technology --title "Interesting Article" --url https://example.com

# Preview adapted content
npx tsx src/cli.ts preview --file article.md

# Check subreddit rules
npx tsx src/cli.ts subreddit-info --sub programming

# Check flairs
npx tsx src/cli.ts flairs --sub programming

# Check your profile
npx tsx src/cli.ts me
```

## Reddit App Setup

1. Go to [reddit.com/prefs/apps](https://www.reddit.com/prefs/apps)
2. Click "create another app..."
3. Select **script** type
4. Fill in name and redirect URI (`http://localhost:8080`)
5. Copy client ID and secret into `config.yaml`

## License

MIT
