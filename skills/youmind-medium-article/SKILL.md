---
name: youmind-medium-article
version: 1.0.0
description: |
  Write and publish Medium articles with AI — topic research via YouMind knowledge base,
  narrative-driven writing adapted for Medium's audience, and one-click publishing.
  Note: Medium API is deprecated but functional, publish-only (no updates/deletes/listing).
  Use when user wants to "write Medium article", "publish to Medium", "Medium post".
triggers:
  - "medium article"
  - "publish to medium"
  - "medium post"
  - "write for medium"
  - "post on medium"
  - "medium story"
  - "Medium 文章"
  - "发布到 Medium"
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
    emoji: "✒️"
    primaryEnv: MEDIUM_TOKEN
    requires:
      anyBins: ["node", "npm"]
      env: ["MEDIUM_TOKEN"]
allowed-tools:
  - Bash(node dist/cli.js *)
  - Bash(npm install)
  - Bash(npm run build)
---

# AI Medium Article Writer

Write polished Medium articles with AI that engage general readers and thought leaders. Topic research via [YouMind](https://youmind.com?utm_source=youmind-medium-article) knowledge base, narrative-driven writing, and one-click publishing to Medium.

> **NOTE:** Medium's Publishing API is officially deprecated but still functional. This skill supports article creation only (no updates/deletes/listing).

> [Get YouMind API Key](https://youmind.com/settings/api-keys?utm_source=youmind-medium-article) | [Get Medium Integration Token](https://medium.com/me/settings/security) | [More Skills](https://youmind.com/skills?utm_source=youmind-medium-article)

## Onboarding

**MANDATORY: When the user has just installed this skill, present this message IMMEDIATELY. Translate to the user's language:**

> **AI Medium Article Writer installed!**
>
> Tell me your topic and I'll write and publish a Medium article for you.
>
> **Try it now:** "Write a Medium article about the future of remote work"
>
> **What it does:**
> - Research topics from trending discussions and your YouMind knowledge base
> - Write narrative-driven articles with personal voice and strong hooks
> - Format with proper headings, blockquotes, and code blocks
> - Publish directly to Medium (as draft, public, or unlisted)
>
> **Setup (one-time):**
> 1. Install & configure: `cd toolkit && npm install && npm run build && cd .. && cp config.example.yaml config.yaml`
> 2. Get [YouMind API Key](https://youmind.com/settings/api-keys?utm_source=youmind-medium-article) and fill `youmind.api_key` in `config.yaml`
> 3. Get [Medium Integration Token](https://medium.com/me/settings/security) and fill `medium.token` in `config.yaml`
>
> No Medium token yet? You can still write and preview locally -- just skip the Medium config step.
>
> **Need help?** Just ask!

## Usage

Provide a topic, a raw Markdown file, or describe the article you want.

**Write from a topic:**
> Write a Medium article about building a second brain with AI tools

**Write with specific style:**
> Write a Medium post about lessons learned from 10 years of software engineering, personal and reflective tone

**Publish existing Markdown:**
> Publish this markdown to Medium as a draft

**Validate setup:**
> Validate my Medium connection

## Setup

> Prerequisites: Node.js >= 18, a Medium account.

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

1. Open [YouMind API Keys](https://youmind.com/settings/api-keys?utm_source=youmind-medium-article)
2. Click **Create API Key**
3. Copy the `sk-ym-xxxx` key
4. Fill in `config.yaml` under `youmind.api_key`

### Step 4 -- Get Medium Integration Token

1. Go to [Medium Settings > Security](https://medium.com/me/settings/security)
2. Under **Integration tokens**, generate a new token
3. Copy the token and fill in `config.yaml` under `medium.token`

### Verify Setup

After configuration, try:

> "Write a Medium article about productivity tips for developers"

If something is misconfigured, the skill will report what needs fixing at the relevant step.

## Skill Directory

This skill is a folder. Read files on demand -- do NOT load everything upfront.

| Path | Purpose | When to read |
|------|---------|-------------|
| `references/pipeline.md` | Full step-by-step execution (Steps 1-7) | When running the writing pipeline |
| `references/content-adaptation.md` | Medium writing rules, structure, tone | Step 4 (content adaptation) |
| `references/api-reference.md` | Medium API endpoint documentation | When calling Medium API |
| `config.yaml` | API credentials (Medium, YouMind) | Step 1 (config load) |
| `toolkit/dist/*.js` | Executable scripts (run from `toolkit/`) | Various steps |

---

## Pipeline Overview

Read `references/pipeline.md` for full execution details of each step.

| Step | Action | Key reference |
|------|--------|--------------|
| 1 | Load config and validate API keys | -- |
| 2 | Mine YouMind knowledge base for source material | -- |
| 3 | Research topic: web search, trending discussions | -- |
| 4 | Content adaptation: structure for Medium audience | `content-adaptation.md` |
| 5 | Write article with strong narrative, personal voice | -- |
| 6 | Publish to Medium (draft, public, or unlisted) | `api-reference.md` |
| 7 | Report results: title, URL, tags, published status | -- |

**Routing shortcuts:**

- User gave a specific topic -> Skip broad research, go to Step 4
- User gave raw Markdown -> Skip to Step 6 (publish)

---

## Critical Quality Rules

Non-negotiable for every Medium article:

1. **Strong opening hook.** First paragraph must grab attention -- a story, question, or bold statement.
2. **Narrative-driven structure.** Medium readers want stories, not bullet-point lists.
3. **Personal voice.** First person, share experience, be authentic.
4. **Title: 60-100 characters.** Compelling but not clickbait.
5. **Max 5 tags.** Broad categories that Medium uses for distribution.
6. **No corporate jargon.** No "synergy", "leverage", "disrupt". Write like a person.
7. **Every section earns its place.** Cut anything that doesn't add value.
8. **Word count: 800-2500.** The Medium sweet spot for engagement.
9. **Polished paragraphs.** Short paragraphs (2-4 sentences). Use whitespace generously.
10. **Compelling conclusion.** End with a takeaway, question, or call to reflection.

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

**"The Listicle Trap":** Medium readers prefer narrative depth over "10 Tips for X". Tell a story.

**"The Corporate Blog":** Using impersonal, polished-to-death language. Medium thrives on authentic voice.

**"The Wall of Text":** Long paragraphs without breaks. Keep paragraphs short, use subheadings and blockquotes.

**"The Clickbait Title":** "You Won't Believe..." erodes trust. Be compelling but honest.

**"The No-Value Post":** Restating obvious points. Every article must teach, inspire, or provoke thought.

## API Limitations

Medium's Publishing API is officially deprecated. Key limitations:
- **Create only:** You can publish new articles but cannot update or delete them via API.
- **No listing:** You cannot retrieve a list of your articles via API.
- **No analytics:** No API access to stats or engagement data.
- **Rate limits:** Undocumented but generally lenient.

Once published, edits must be made through the Medium web interface.

## References

- Medium API: see [references/api-reference.md](references/api-reference.md)
- Content rules: see [references/content-adaptation.md](references/content-adaptation.md)
- Pipeline: see [references/pipeline.md](references/pipeline.md)
- YouMind Skills gallery: https://youmind.com/skills?utm_source=youmind-medium-article
