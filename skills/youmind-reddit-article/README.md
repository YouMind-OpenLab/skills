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

This skill supports two auth modes, auto-detected from your config:

| Mode | What you need | API approval? | Best for |
| ---- | ------------- | ------------- | -------- |
| **Cookie mode** | username + password | No | Quick start, no waiting |
| **OAuth mode** | username + password + client_id + client_secret | Yes (~7 days) | Already have API credentials |

### Cookie Mode (Recommended, No Approval Needed)

Only requires your Reddit username and password. **No API application needed.**

Fill in `config.yaml`:

```yaml
reddit:
  client_id: ""
  client_secret: ""
  username: "your Reddit username"
  password: "your Reddit password"
  user_agent: "youmind-reddit/1.0 by /u/yourname"
```

Leave `client_id` and `client_secret` empty — the skill will automatically use cookie-based login.

### OAuth Mode (If You Have API Credentials)

If you already have Reddit API credentials (created before Nov 2025, or approved), OAuth mode provides a more stable experience.

<details>
<summary>Expand OAuth setup steps</summary>

> **Note (Nov 2025):** Reddit discontinued self-service API app creation. You must submit an application and wait for manual approval. See [Responsible Builder Policy](https://support.reddithelp.com/hc/en-us/articles/42728983564564-Responsible-Builder-Policy).

1. Go to [reddit.com/prefs/apps](https://www.reddit.com/prefs/apps), follow prompts to submit a developer application
2. Once approved, create a **script** type app (redirect URI: `http://localhost:8080`)
3. Copy the **Client ID** (short string under app name) and **Client Secret**
4. Fill in `config.yaml`:

```yaml
reddit:
  client_id: "your Client ID"
  client_secret: "your Client Secret"
  username: "your Reddit username"
  password: "your Reddit password"
  user_agent: "youmind-reddit/1.0 by /u/yourname"
```

</details>

### Important Notes

- Both modes can only post as yourself.
- Include your username in `user_agent` to avoid rate limiting.
- Cookie mode relies on Reddit's legacy login API. If Reddit disables it, switch to OAuth mode.

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
| `reddit.client_id` | Optional | Reddit app client ID (leave empty for cookie mode) |
| `reddit.client_secret` | Optional | Reddit app client secret (leave empty for cookie mode) |
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

**Cannot create app at reddit.com/prefs/apps** — Use Cookie mode instead (no API credentials needed). Leave `client_id` and `client_secret` empty, just fill in username and password. If you need OAuth, submit a developer application and wait for approval (~7 days). See [Responsible Builder Policy](https://support.reddithelp.com/hc/en-us/articles/42728983564564-Responsible-Builder-Policy).

**403 Forbidden on publish** — In cookie mode, verify username and password. In OAuth mode, also check `client_id` and `client_secret`.

**Rate limited** — Reddit rate-limits new/low-karma accounts. Ensure `user_agent` includes your username.

**Post auto-removed** — Some subreddits have AutoModerator rules. Check posting requirements (karma threshold, account age, etc.).

**Script type limitations** — Script type can only act as yourself, not on behalf of other users.

---

## License

MIT
