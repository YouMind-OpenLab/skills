# YouMind Reddit Skill

Publish posts to Reddit with AI. Research, write, adapt to subreddit culture, and submit -- all from one prompt.

---

## What Can It Do

| You say | Skill does |
|---------|------------|
| `Post to r/programming about CLI tools` | Research, write, adapt, submit self-post |
| `Submit this link to r/technology` | Create link post with commentary |
| `Write for r/AskReddit: What's your best coding tip?` | Write subreddit-appropriate question |

---

## Getting Credentials

### Step 1 — Visit Reddit Apps Page

Go to [reddit.com/prefs/apps](https://www.reddit.com/prefs/apps) and sign in with your Reddit account.

### Step 2 — Create an App

Scroll to the bottom of the page and click **"create another app..."**.

### Step 3 — Fill in App Details

Fill in the following:

- **name**: `youmind-publisher` (or any name you prefer)
- **type**: Select **script**
- **description**: optional
- **about url**: can be left blank
- **redirect uri**: `http://localhost:8080`

### Step 4 — Create and Copy Credentials

Click **"create app"**, then copy the following credentials:

- **Client ID**: the short string directly below the app name
- **Client Secret**: the field labeled "secret"

### Step 5 — Fill in Config

Fill credentials into `config.yaml`:

```yaml
reddit:
  client_id: "your Client ID"
  client_secret: "your Client Secret"
  username: "your Reddit username"
  password: "your Reddit password"
  user_agent: "youmind-reddit/1.0 by /u/yourname"
```

### Important Notes

- Script-type apps can only post as yourself.
- Include your username in `user_agent` to avoid rate limiting.

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
| `reddit.client_id` | **Yes** | Reddit app client ID |
| `reddit.client_secret` | **Yes** | Reddit app client secret |
| `reddit.username` | **Yes** | Your Reddit username |
| `reddit.password` | **Yes** | Your Reddit password |
| `reddit.user_agent` | **Yes** | User agent string, e.g. `youmind-reddit/1.0 by /u/yourname` |
| `youmind.api_key` | Recommended | For knowledge base search, web search, article archiving → [Get API Key](https://youmind.com/settings/api-keys?utm_source=youmind-reddit-article) |

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

### Adapting to Subreddit Culture

The Skill automatically checks the target subreddit's rules and culture, adjusting post format and tone accordingly.

### Post Types

- **Self-post**: Write long-form content directly
- **Link post**: Share a link with commentary

### CLI Commands

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

---

## FAQ

**403 Forbidden on publish** — Verify your `client_id`, `client_secret`, and account credentials are correct.

**Rate limited** — Reddit rate-limits new/low-karma accounts. Ensure `user_agent` includes your username.

**Post auto-removed** — Some subreddits have AutoModerator rules. Check posting requirements (karma threshold, account age, etc.).

**Script type limitations** — Script type can only act as yourself, not on behalf of other users.

---

## License

MIT
