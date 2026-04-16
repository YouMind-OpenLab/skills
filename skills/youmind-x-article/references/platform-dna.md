# X (Twitter) Platform DNA

> **Scope:** This file describes observable platform behavior — format constraints, discourse norms, moderation signals, and content patterns derived from platform data and high-performing posts. It does NOT make claims about audience psychology, ethnicity, or cultural generalizations. All guidance derives from what the platform's algorithm rewards and what its community tolerates.

## Platform snapshot (2025)

- 557 million monthly active users
- Largest age cohort: 25–34 (37.5%), followed by 18–24 (32.1%) — together ~70% of users
- 63.7% male / 36.3% female
- Average daily usage: 28 minutes
- 60% use X for news and breaking events (primary use case)
- Higher-income skew: 29% of US users earn $100K+
- Retweets up 35% year-over-year (2025); shareable atomic claims drive distribution
- Thread engagement: 2–4% average vs single-tweet 0.5–1.5%

## Format constraints

| Element | Constraint |
|---------|-----------|
| Post length | 280 characters (free); 25,000 characters (Premium Long Post) |
| Thread length | No hard cap; 5–15 posts practical; 25+ risks severe completion drop-off |
| URLs | Always count as 23 characters regardless of actual length |
| Media per post | 1–4 images OR 1 video OR 1 GIF (media does not count toward char limit) |
| Hashtags | 0–2 per post; algorithm treats 3+ as spam signal |
| Mentions | @username counts toward character limit |
| Polls | 2–4 options; 5 min to 7 days duration |
| Alt text | Up to 1,000 characters per image |
| Video length | 2 min 20 sec (free); up to 60 min (Premium) |

## Discourse norms (observable)

### Opening patterns (high-performing hooks)

- **Contrarian take:** "Everyone says X. Wrong." — earns engagement through disagreement
- **Stat / proof lead:** "90% of Y. Here's why that matters:" — data earns credibility
- **Story opener:** "3 years ago I X. Today Y. Here's what I learned:" — personal journey
- **Checklist promise:** "How to X in 5 steps:" — clear value proposition
- **Curiosity gap:** "The most underrated X is Y." — earns the scroll

### Closing patterns

- Thread TL;DR in final tweet (1-sentence recap)
- CTA: follow / RT / bookmark / link to canonical long-form
- Link placement: external links in the LAST tweet only (algorithm de-amplifies mid-thread links)

### Citation conventions

- Quote tweet for attribution (higher engagement than reply-with-link)
- Screenshot of source with credit line
- Thread-native: no footnotes, no bibliography; each tweet is self-contained

### Self-promo tolerance

- Moderate. "Build in public" culture rewards transparent self-promotion
- Overt ads and affiliate links are de-amplified
- Product launches via personal story threads perform well
- Pure marketing copy without personal context underperforms

## Moderation & flagging patterns

- **Removed:** Hate speech, doxxing, impersonation, spam bots, coordinated inauthentic behavior
- **De-amplified:** Engagement bait ("Am I the only one who...?"), excessive hashtags (3+), external links mid-thread, reply-spam, rapid-fire posting without engagement
- **Shadowban signals:** Posting identical content repeatedly, follow/unfollow churn, bulk mentions

## Platform-native features to leverage

| Feature | When / why |
|---------|-----------|
| Threads (reply chain) | Content >280 chars; 2–4% engagement vs 0.5–1.5% single tweet |
| Quote tweets | Attribution + commentary; higher reach than reply-with-link |
| Polls | Audience validation; high native completion rate |
| Spaces (live audio) | Discussion / Q&A; notification push drives attendance |
| Communities | Niche targeting; focused distribution |
| Premium Long Post | Essay-length; search-indexed; no thread fragmentation |
| Bookmark prompt | Mid-thread signals save-worthy value to the algorithm |

## Hard limits (must not violate)

- 280 characters per post (free tier) — absolutely enforced, no exceptions
- 4 images per post maximum
- 1 video per post maximum
- No markdown rendering — plain text + line breaks only
- External link previews work best in the last tweet of a thread
- Numbering ("1/N"): optional; many high-performing threads omit it entirely
- Code does not render with syntax highlighting — use screenshots for code blocks

## Anti-patterns

| Anti-pattern | Why it fails |
|-------------|-------------|
| "This is a thread 🧵" without substance | Hook wasted on announcement, not value |
| Generic advice listicle | Indistinguishable from thousands of identical threads |
| Thread bloat (25+ posts) | Completion rate drops sharply past ~15 |
| Teaser without payoff | "Ever wondered why X?" then silence — kills trust |
| Engagement bait | "Am I the only one who..." — de-amplified |
| Premature reveal | Hook gives away the answer — no reason to continue |
| Code blocks in tweet text | No syntax highlighting; wraps poorly; unreadable |
| Mid-thread external links | Algorithm deprioritizes distribution |
| Images from cdn.gooo.ai in tweets | YouMind CDN URLs work (allowlisted for X posts via API) but only up to 4 per tweet |

## Example calibration patterns

**High-performing thread (observable structure):**
1. Hook tweet: stat or contrarian take (earns the scroll)
2. Body tweets 2–10: each self-contained, one claim per tweet, rebloggable in isolation
3. Final tweet: TL;DR + CTA + link to canonical source

**High-performing single tweet:**
- Clear opinion + evidence in ≤200 chars + relevant image
- Or: short personal story with specific outcome

**Thread engagement benchmarks (2025):**
- Threads: 2–4% engagement rate average
- Single tweets: 0.5–1.5% engagement rate average
- Text posts: 0.48% influencer engagement (slightly above average 0.39%)
- Short-form video growing: 37% of users interact with brand video content
