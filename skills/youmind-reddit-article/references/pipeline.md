# Reddit Pipeline Execution Detail

> Read this file when running the full writing pipeline (Steps 1–8).

---

## Step 1: Load Client Configuration

Read `{skill_dir}/clients/{client}/style.yaml` if it exists.

**Routing:**
- User gave a specific subreddit + topic → Skip Steps 2–3, go to 1.5 → 3.5
- User gave raw Markdown → Skip to Step 7

## Step 1.5: YouMind Knowledge Mining

> Only runs when `config.yaml` contains `youmind.api_key`.

Use `youmind-api.js mine-topics` with the target topics. Keep top 10 results as `knowledge_context`.

**[Fallback]:** API error → skip, set `knowledge_context` to empty.

## Step 2: Subreddit Trending Analysis

Use `cli.js hot <subreddit>` to fetch hot posts from the target subreddit. Analyze:
- Common title patterns and hooks
- Typical post length and formatting
- Popular topics and recurring themes
- Flair usage patterns

Also check subreddit rules (sidebar) for posting requirements.

**[Fallback]:** API error → YouMind `web-search` for "reddit {subreddit} trending" → ask user.

## Step 2.5: Dedup + Trend Scoring

1. Read `history.yaml` — check for recently posted topics (last 30 days).
2. Score trending topics by: upvote momentum, comment engagement, recency, relevance to user's niche.

## Step 3: Topic Generation

Generate **10 topic ideas** tailored to the target subreddit. Each must include:
- A working title
- The core insight or value proposition
- Why this subreddit's audience would engage with it
- Estimated engagement potential (based on hot post analysis)

**Auto mode:** Select highest scorer and continue.
**Interactive mode:** Present all 10 for user selection.

## Step 3.5: Framework Selection

Choose from Reddit-optimized frameworks:
- **Experience Share:** "I did X, here's what I learned" — personal, authentic
- **Tutorial/Guide:** Step-by-step how-to with code/examples
- **Discussion Starter:** Provocative question or observation to spark debate
- **Resource List:** Curated list of tools, links, resources
- **Analysis/Deep Dive:** Detailed breakdown of a topic or technology
- **AMA-style:** Open format sharing expertise

## Step 4: Writing

**Voice requirements:**
- First person, conversational, authentic
- NO marketing language, NO promotional tone
- Include personal experience or specific examples
- Use Reddit conventions: TL;DR, edit notes, formatting
- Match subreddit culture (technical subs want depth, casual subs want personality)

**Hard rules:**
- Title: 100–300 characters, specific and honest
- Body: 200–10,000 characters (sweet spot: 500–3,000)
- Include TL;DR for posts >500 words
- Use Markdown formatting (headers, lists, code blocks, bold)
- No external links in the first paragraph (Reddit penalizes this)

Save to: `{skill_dir}/output/{client}/{YYYY-MM-DD}-{slug}.md`

## Step 5: Reddit Algorithm Optimization

1. **Title hooks:** Question-based, number-based, or contrarian titles perform best
2. **Post timing:** Consider subreddit peak hours (usually US evening)
3. **Engagement triggers:** End with a question to invite comments
4. **De-AI pass:** Remove any corporate or AI-sounding language

## Step 6: Visual AI

Reddit supports image posts but not inline images in self-posts.

- **Image posts:** Single compelling image with title
- **Self-posts:** No inline images (they render as links)
- Cover images are only useful if crossposting to image-friendly subs

## Step 7: Submit to Subreddit

Use `cli.js publish` with `--subreddit` and optional `--flair`.

**[Fallback]:** Submit fails → save as local Markdown + HTML preview.

## Step 7.5: History + Archive

Append to `clients/{client}/history.yaml`: date, title, subreddit, post_id, post_url.

## Step 8: Final Output

Report: title, subreddit, post URL, flair, word count, crosspost status.
