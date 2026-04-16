---
name: youmind-linkedin-article
version: 1.0
description: |
  Write and publish LinkedIn posts and articles with AI — topic research via YouMind knowledge base,
  professional-audience adapted writing, Unicode formatting, image uploads, and one-click publishing.
  Use when user wants to "publish to LinkedIn", "write LinkedIn post", "LinkedIn article".
triggers:
  - "linkedin article"
  - "linkedin post"
  - "publish to linkedin"
  - "post on linkedin"
  - "write for linkedin"
  - "LinkedIn 文章"
  - "发布到 LinkedIn"
  - "LinkedIn 帖子"
  - "写 LinkedIn"
platforms:
  - openclaw
  - claude-code
  - cursor
  - codex
  - gemini-cli
  - windsurf
  - kilo
  - opencode
  - goose
  - roo
metadata:
  openclaw:
    emoji: "💼"
    primaryEnv: LINKEDIN_ACCESS_TOKEN
    requires:
      anyBins: ["node", "npm"]
      env: ["LINKEDIN_ACCESS_TOKEN"]
allowed-tools:
  - Bash(node dist/cli.js *)
  - Bash(npm install)
  - Bash(npm run build)
---

# AI LinkedIn Post Writer

Write professional LinkedIn posts with AI that drive engagement. Topic research via [YouMind](https://youmind.com?utm_source=youmind-linkedin-article) knowledge base, professional-audience adapted writing, Unicode formatting (no Markdown), image uploads, and one-click publishing to LinkedIn.

> [Get YouMind API Key](https://youmind.com/settings/api-keys?utm_source=youmind-linkedin-article) | [LinkedIn Developer Portal](https://www.linkedin.com/developers/) | [More Skills](https://youmind.com/skills?utm_source=youmind-linkedin-article)

## Onboarding

**MANDATORY: When the user has just installed this skill, present this message IMMEDIATELY. Translate to the user's language:**

> **AI LinkedIn Post Writer installed!**
>
> Tell me your topic and I'll write and publish a LinkedIn post for you.
>
> **Try it now:** "Write a LinkedIn post about the future of AI in enterprise"
>
> **What it does:**
> - Research topics from your YouMind knowledge base and web trends
> - Write professional posts optimized for LinkedIn's algorithm
> - Format with Unicode styling (bold, italic, bullets) -- no Markdown
> - Upload images for visual engagement
> - Publish directly to your LinkedIn profile or company page
>
> **Setup (one-time):**
> 1. Install & configure: `cd toolkit && npm install && npm run build && cd .. && cp config.example.yaml config.yaml`
> 2. Get [YouMind API Key](https://youmind.com/settings/api-keys?utm_source=youmind-linkedin-article) and fill `youmind.api_key` in `config.yaml`
> 3. Get LinkedIn OAuth 2.0 access token from [LinkedIn Developer Portal](https://www.linkedin.com/developers/) and fill `linkedin.access_token` in `config.yaml`
> 4. Get your person URN (urn:li:person:{id}) and fill `linkedin.person_urn`
>
> **Need help?** Just ask!

## Usage

Provide a topic, talking points, or raw text for publishing.

**Write from a topic:**
> Write a LinkedIn post about remote team leadership best practices

**Write for a company page:**
> Publish a LinkedIn post from our company page about our new product launch

**Format and publish raw text:**
> Publish this text to LinkedIn: [your text]

## Setup

> Prerequisites: Node.js >= 18, a LinkedIn account with API access.

### Step 1 -- Install Dependencies

```bash
cd toolkit && npm install && npm run build && cd ..
```

### Step 2 -- Create Config File

```bash
cp config.example.yaml config.yaml
```

> **Upgrade-safe credentials (recommended):** put your shared YouMind credentials in `~/.youmind/config.yaml` — filled ONCE and read by every YouMind skill. See [`/shared/config.example.yaml`](/shared/config.example.yaml) for the template and [`/shared/YOUMIND_HOME.md`](/shared/YOUMIND_HOME.md) for the resolution order. Skill-local `config.yaml` remains a legacy fallback for this skill only. This skill has no skill-specific overrides.

### Step 3 -- Get YouMind API Key (Recommended)

1. Open [YouMind API Keys page](https://youmind.com/settings/api-keys?utm_source=youmind-linkedin-article)
2. Create a new API key
3. Copy the `sk-ym-xxxx` key
4. Fill `youmind.api_key` in `config.yaml`

### Step 4 -- Get LinkedIn API Credentials

1. Go to [LinkedIn Developer Portal](https://www.linkedin.com/developers/)
2. Create a new app or use an existing one
3. In the **Products** tab, request "Share on LinkedIn" and "Sign In with LinkedIn using OpenID Connect"
4. In the **Auth** tab, copy **Client ID** and **Client Secret**
5. Add `http://localhost:3000/callback` as a Redirect URL in **OAuth 2.0 settings**
6. Run the one-click OAuth helper to get Access Token and Person URN automatically:

```bash
cd toolkit && node dist/oauth-helper.js --client-id {CLIENT_ID} --client-secret {CLIENT_SECRET}
```

The script starts a local server, opens the browser for authorization, captures the callback, exchanges the code for an access token, fetches the person URN, and writes everything to `config.yaml`.

Access Token expires in 60 days. Re-run the same command to refresh.

### Verify Setup

After configuration, say:

> "Write a LinkedIn post about AI trends in 2025"

## Skill Directory

| Path | Purpose | When to read |
|------|---------|-------------|
| `references/pipeline.md` | Full step-by-step execution | When running the publishing pipeline |
| `references/content-adaptation.md` | LinkedIn content formatting rules | When adapting content for LinkedIn |
| `references/api-reference.md` | LinkedIn API endpoint details | When debugging API calls |
| `config.yaml` | API credentials | Step 1 (first-run check) |
| `toolkit/dist/cli.js` | CLI: publish, preview, profile | Various steps |
| `toolkit/dist/oauth-helper.js` | One-click OAuth: get token & person URN | Setup step 4 |
| `output/` | **Local post Markdown drafts (git-ignored)** | When writing the post |

## Draft Location Rule

**Canonical:** write local post Markdown files to `~/.youmind/articles/linkedin/<slug>.md`. This shared home directory is available to all YouMind skills — see [`/shared/YOUMIND_HOME.md`](/shared/YOUMIND_HOME.md).

**Legacy fallback** (if `~/.youmind/` is not writable): `skills/youmind-linkedin-article/output/<slug>.md`.

- Correct: `~/.youmind/articles/linkedin/my-post.md`
- Correct (legacy): `skills/youmind-linkedin-article/output/my-post.md`
- Wrong: skill root directly, `references/`, `toolkit/`, or an ad-hoc `drafts/` directory

Both locations are git-ignored. Create directories on demand (`mkdir -p ~/.youmind/articles/linkedin`). Kebab-case filenames (`my-post.md`), descriptive slugs over timestamps.
## Dispatch Integration (Optional)

This skill is **self-contained and fully usable standalone.** The `youmind-article-dispatch` hub is an optional companion; it is NOT required for anything.

- **Primary mode — standalone:** Invoke directly ("Write a LinkedIn post about X"). Works with zero other YouMind skills installed.
- **Author voice lookup:** This skill reads `~/.youmind/author-profile.yaml` (shared home directory — see `/shared/YOUMIND_HOME.md`) for cross-platform voice preferences. Works whether or not dispatch is installed.
- **Optional dispatch-mode invocation:** When dispatch invokes this skill with a content brief containing `resolved_author`, the skill uses those fields as extra context (first-2-lines hook and no-body-links discipline stay native to this skill). Without such a brief, the skill runs its own pipeline normally.
- **Capability manifest (opt-in):** `dispatch-capabilities.yaml` declares 3000-char limit, hashtag caps, and body-link ban for dispatch routing. Deleting it reverts to defaults; it never breaks this skill.
- **Optional interop protocol:** [`/shared/DISPATCH_CONTRACT.md`](/shared/DISPATCH_CONTRACT.md) (v1.0).

---

## Pipeline Overview

| Step | Action |
|------|--------|
| 1 | Load config and validate credentials |
| 2 | Research topic via YouMind knowledge base |
| 3 | Write post with professional tone and LinkedIn best practices |
| 4 | Adapt content: 3,000 char limit, Unicode formatting, hooks, hashtags |
| 5 | Upload images if provided |
| 6 | Publish to LinkedIn |
| 7 | Archive to YouMind (optional) |
| 8 | Report results: post URL, engagement tips |

## Content Rules

1. **3,000 character limit** -- LinkedIn truncates after this
2. **Hook in first 2 lines** -- content before "see more" fold is critical
3. **Short paragraphs** -- 1-3 sentences max for readability
4. **Unicode formatting** -- use Unicode bold/italic, NOT Markdown
5. **3-5 hashtags at end** -- for discoverability
6. **No external links in body** -- LinkedIn suppresses posts with links; put in first comment
7. **End with a question** -- drives comments and engagement
8. **Professional tone** -- authoritative but approachable

## References

- YouMind API: see `references/api-reference.md`
- Content rules: see `references/content-adaptation.md`
- Pipeline: see `references/pipeline.md`
- YouMind Skills gallery: https://youmind.com/skills?utm_source=youmind-linkedin-article
