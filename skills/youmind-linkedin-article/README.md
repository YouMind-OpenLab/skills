# YouMind LinkedIn Skill

Publish professional LinkedIn posts with AI. Research, write, format, and publish -- all from one prompt.

---

## What Can It Do

| You say | Skill does |
|---------|------------|
| `Write a LinkedIn post about AI trends` | Research → write → format → publish to LinkedIn |
| `Publish this to LinkedIn: [text]` | Skip writing, format and publish directly |
| `Write a company page post about our launch` | Publish to organization page |
| `Check my LinkedIn profile info` | View profile info and connection status |

---

## Getting Credentials

### Getting a LinkedIn Access Token

> LinkedIn Developer Portal: <https://developer.linkedin.com/>

Since LinkedIn uses OAuth 2.0 authorization flow, getting an Access Token is more involved. Follow these steps carefully.

**Step 1 — Go to LinkedIn Developer Portal**

Open [LinkedIn Developer Portal](https://developer.linkedin.com/) and sign in with your LinkedIn account.

**Step 2 — Create an App**

Click **"Create App"**, fill in the app details, and associate it with your LinkedIn Company Page (you need to create one first if you don't have one).

**Step 3 — Request Product Access**

Go to the **Products** tab of your app and request access to:
- **"Share on LinkedIn"** — for publishing content
- **"Sign In with LinkedIn using OpenID Connect"** — for authentication

**Step 4 — Get Client ID and Client Secret**

Go to the **Auth** tab and copy your **Client ID** and **Client Secret**.

**Step 5 — Configure Redirect URL**

In the **"OAuth 2.0 settings"** section of the Auth tab, add a Redirect URL (e.g., `http://localhost:3000/callback`).

**Step 6 — One-Click: Get Access Token & Person URN**

Run the built-in OAuth helper script to automate the entire authorization flow:

```bash
cd toolkit && node dist/oauth-helper.js --client-id {YOUR_CLIENT_ID} --client-secret {YOUR_CLIENT_SECRET}
```

The script will automatically:
1. Start a local server on `http://localhost:3000`
2. Open your browser to the LinkedIn authorization page
3. Capture the Authorization Code after you log in and approve
4. Exchange the code for an Access Token
5. Fetch your Person URN via the LinkedIn API
6. Write all credentials to `config.yaml`

When the browser shows "Authorization Complete", you can close the page.

> **Note:**
> - Access Token is valid for **60 days** — re-run this script to refresh when it expires
> - You need a LinkedIn Company Page before creating an app
> - `w_member_social` scope requires "Share on LinkedIn" product approval

**Optional: Enable Read Posts Permission**

The default "Share on LinkedIn" product only supports publishing posts, not reading them (e.g., querying Post ID and URL after publishing). To enable reading posts, you need to request the **Community Management API** product for the `r_member_social` permission.

> **Important limitation:** LinkedIn requires Community Management API to be the **only product** on the application — it cannot coexist with "Share on LinkedIn" or other products. You will need to:
>
> 1. Create a **new application** on [LinkedIn Developer Portal](https://developer.linkedin.com/)
> 2. Request **only** the Community Management API product
> 3. After approval, run the OAuth script with the new app's credentials (scope must include `r_member_social`):
>
> ```bash
> cd toolkit && node dist/oauth-helper.js --client-id {NEW_CLIENT_ID} --client-secret {NEW_CLIENT_SECRET}
> ```
>
> Note: `r_member_social` is a restricted permission and may not be available to all developers.

---

## Installation

> Prerequisites: Node.js >= 18

```bash
# 1. Install dependencies
cd toolkit && npm install && npm run build && cd ..

# 2. Create config file
cp config.example.yaml config.yaml
```

Fill in the following credentials in `config.yaml`:

| Field | Required | Description |
|-------|----------|-------------|
| `linkedin.access_token` | **Yes** | OAuth 2.0 Access Token (valid for 60 days) |
| `linkedin.person_urn` | **Yes** | Your LinkedIn Person URN (format `urn:li:person:{id}`) |
| `linkedin.organization_urn` | No | Company page URN for org posts |
| `youmind.api_key` | Recommended | For knowledge base search and web research → [Get API Key](https://youmind.com/settings/api-keys?utm_source=youmind-linkedin-article) |

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

### CLI Commands

```bash
# Publish a text post
npx tsx src/cli.ts publish --text "Your post content" --visibility PUBLIC

# Preview formatted content
npx tsx src/cli.ts preview --file article.md

# Check profile info
npx tsx src/cli.ts profile

# Publish with image
npx tsx src/cli.ts publish --text "Post with image" --image cover.png

# Validate credentials
npx tsx src/cli.ts validate
```

### LinkedIn Content Tips

- **Personal vs Company Posts** — Defaults to personal profile; configure `organization_urn` for company page posts
- **Visibility** — Supports `PUBLIC` (visible to all) and `CONNECTIONS` (connections only)
- **Images and Rich Media** — Supports attaching images to posts for better engagement
- **Best Posting Times** — LinkedIn engagement peaks on weekdays 8-10 AM and 12-1 PM

---

## FAQ

**Publishing fails with 401/403 error** — The Access Token may have expired (60-day validity). Re-run the OAuth flow to get a new token.

**Can't find "Share on LinkedIn" product** — Make sure your app is associated with a LinkedIn Company Page. Go to Developer Portal → your app → Settings to check.

**Failed to get Person URN** — Ensure your Access Token includes `openid` and `profile` scopes. Use the `validate` command to test if the token is valid.

**Organization post failed** — Ensure you are an admin of the Company Page and `organization_urn` format is correct (`urn:li:organization:{id}`).

**Access Token expires too quickly** — LinkedIn's standard Access Token is valid for 60 days and cannot be extended. Set a calendar reminder to re-authorize before it expires.

---

## License

MIT
