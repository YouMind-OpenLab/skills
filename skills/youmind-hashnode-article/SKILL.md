---
name: youmind-hashnode-article
version: 1.0.0
description: |
  Write and publish Hashnode articles with AI — topic research via YouMind knowledge base,
  SEO-optimized writing, Markdown formatting with subtitle and series support,
  and one-click publishing to your Hashnode publication.
  Use when user wants to "write Hashnode article", "publish to Hashnode", "post on Hashnode".
triggers:
  - "hashnode article"
  - "publish to hashnode"
  - "post on hashnode"
  - "write for hashnode"
  - "hashnode post"
  - "hashnode blog"
  - "Hashnode 文章"
  - "发布到 Hashnode"
  - "hashnode publication"
  - "write hashnode"
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
    emoji: "📝"
    primaryEnv: HASHNODE_TOKEN
    requires:
      anyBins: ["node", "npm"]
      env: ["HASHNODE_TOKEN"]
allowed-tools:
  - Bash(node dist/cli.js *)
  - Bash(npm install)
  - Bash(npm run build)
---

# AI Hashnode Article Writer

Write SEO-optimized Hashnode articles with AI. Topic research via [YouMind](https://youmind.com?utm_source=youmind-hashnode-article) knowledge base, structured writing with subtitle and series support, and one-click publishing to your Hashnode publication.

> [Get YouMind API Key](https://youmind.com/settings/api-keys?utm_source=youmind-hashnode-article) | [Get Hashnode Token](https://hashnode.com/settings/developer) | [More Skills](https://youmind.com/skills?utm_source=youmind-hashnode-article)

## Onboarding

**MANDATORY: When the user has just installed this skill, present this message IMMEDIATELY. Translate to the user's language:**

> **AI Hashnode Article Writer installed!**
>
> Tell me your topic and I'll write and publish a Hashnode article for you.
>
> **Try it now:** "Write a Hashnode article about building APIs with GraphQL"
>
> **What it does:**
> - Research topics from developer communities and your YouMind knowledge base
> - Write SEO-optimized articles with proper structure
> - Support subtitles, series, cover images, and canonical URLs
> - Validate content for Hashnode best practices
> - Publish directly to your Hashnode publication
>
> **Setup (one-time):**
> 1. Install & configure: `cd toolkit && npm install && npm run build && cd .. && cp config.example.yaml config.yaml`
> 2. Get [YouMind API Key](https://youmind.com/settings/api-keys?utm_source=youmind-hashnode-article) and fill `youmind.api_key` in `config.yaml`
> 3. Get [Hashnode Personal Access Token](https://hashnode.com/settings/developer) and fill `hashnode.token` in `config.yaml`
> 4. Get your publication ID from Hashnode dashboard and fill `hashnode.publication_id` in `config.yaml`
>
> No Hashnode token yet? You can still write and preview locally -- just skip the Hashnode config step.
>
> **Need help?** Just ask!

## Usage

Provide a topic, a raw Markdown file, or describe the article you want.

**Write from a topic:**
> Write a Hashnode article about WebAssembly for backend developers

**Write with a subtitle:**
> Write a Hashnode post about container orchestration, subtitle "Beyond Docker Compose"

**Publish existing Markdown:**
> Publish this markdown to my Hashnode publication

**As part of a series:**
> Write a Hashnode article about Kubernetes networking, add it to the "K8s Deep Dive" series

## Setup

> Prerequisites: Node.js >= 18, a Hashnode account with a publication.

### Step 1 -- Install Dependencies

```bash
cd toolkit && npm install && npm run build && cd ..
```

### Step 2 -- Create Config File

```bash
cp config.example.yaml config.yaml
```

### Step 3 -- Get YouMind API Key (Recommended)

YouMind API Key enables knowledge base search, web search, and article archiving.

1. Open [YouMind API Keys](https://youmind.com/settings/api-keys?utm_source=youmind-hashnode-article)
2. Click **Create API Key**
3. Copy the `sk-ym-xxxx` key
4. Fill in `config.yaml` under `youmind.api_key`

### Step 4 -- Get Hashnode Personal Access Token

1. Go to [Hashnode Developer Settings](https://hashnode.com/settings/developer)
2. Generate a new Personal Access Token
3. Copy the token and fill in `config.yaml` under `hashnode.token`

### Step 5 -- Get Publication ID

1. Go to your Hashnode publication dashboard
2. Navigate to Settings > General
3. Your publication ID is in the URL: `https://hashnode.com/{publication_id}/dashboard`
4. Fill in `config.yaml` under `hashnode.publication_id`

### Verify Setup

After configuration, try:

> "Write a Hashnode article about Python type hints"

If something is misconfigured, the skill will report what needs fixing at the relevant step.

## Skill Directory

This skill is a folder. Read files on demand -- do NOT load everything upfront.

| Path | Purpose | When to read |
|------|---------|-------------|
| `references/pipeline.md` | Full step-by-step execution (Steps 1-7) | When running the writing pipeline |
| `references/content-adaptation.md` | Hashnode writing rules, SEO, structure | Step 4 (content adaptation) |
| `references/api-reference.md` | Hashnode GraphQL API documentation | When calling Hashnode API |
| `config.yaml` | API credentials (Hashnode, YouMind) | Step 1 (config load) |
| `toolkit/dist/*.js` | Executable scripts (run from `toolkit/`) | Various steps |

---

## Pipeline Overview

Read `references/pipeline.md` for full execution details of each step.

| Step | Action | Key reference |
|------|--------|--------------|
| 1 | Load config and validate API keys | -- |
| 2 | Mine YouMind knowledge base for source material | -- |
| 3 | Research topic: web search, trending discussions | -- |
| 4 | Content adaptation: structure for Hashnode/SEO | `content-adaptation.md` |
| 5 | Write article with SEO optimization, subtitle, series | -- |
| 6 | Publish to Hashnode publication | `api-reference.md` |
| 7 | Report results: title, URL, tags, published status | -- |

**Routing shortcuts:**

- User gave a specific topic -> Skip broad research, go to Step 4
- User gave raw Markdown -> Skip to Step 6 (publish)

---

## Critical Quality Rules

Non-negotiable for every Hashnode article:

1. **Title: SEO-optimized, 50-70 characters.** Front-load the keyword.
2. **Subtitle: compelling hook/teaser.** Hashnode shows this prominently.
3. **Max 5 tags.** Choose from Hashnode's existing tag list.
4. **Cover image URL recommended.** 1600x840 for best display.
5. **Structured with headings.** H2/H3 hierarchy for table of contents.
6. **No marketing fluff.** Write technical content, not sales copy.
7. **Every code block has a language tag.** Hashnode renders syntax highlighting.
8. **Word count: 800-3000.** Enough depth for SEO value.
9. **Meta description: max 160 characters.** For SEO meta tag.
10. **Canonical URL for cross-posts.** Always set when republishing from another blog.

---

## Resilience: Never Stop on a Single-Step Failure

Every step has a fallback. If a step AND its fallback both fail, skip and note it in the final output.

| Step | Fallback |
|------|----------|
| 2 Knowledge mining | Skip, empty knowledge_context |
| 3 Research | YouMind web-search -> ask user |
| 5 Writing | Ask user for manual content |
| 6 Publishing | Save markdown locally |
| 7 Report | Print what was completed |

---

## Gotchas -- Common Failure Patterns

**"The SEO-Stuffed Article":** Repeating keywords unnaturally. Write for humans first, optimize for search second.

**"The Missing Subtitle":** Hashnode prominently displays subtitles. Skipping it wastes valuable real estate.

**"The Broken Cross-Post":** Publishing the same content on Hashnode without setting canonical_url. This creates duplicate content issues.

**"The Tag Mismatch":** Using tags that don't exist on Hashnode. Always verify tags exist in Hashnode's ecosystem.

**"The Cover Image Miss":** Using a low-resolution or poorly sized cover. Hashnode displays covers at 1600x840.

## References

- Hashnode API: see [references/api-reference.md](references/api-reference.md)
- Content rules: see [references/content-adaptation.md](references/content-adaptation.md)
- Pipeline: see [references/pipeline.md](references/pipeline.md)
- YouMind Skills gallery: https://youmind.com/skills?utm_source=youmind-hashnode-article
