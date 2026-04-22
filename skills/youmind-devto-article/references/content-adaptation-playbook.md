# Adaptation Playbook: Existing Article → Dev.to-Native

> Use when the user has an existing draft, published article, or content from another platform to bring to Dev.to. If the user only has an idea/topic, use `content-generation-playbook.md` instead.

## Step 0 — Intent check + sub-mode

| Sub-mode | Input | Output |
|----------|-------|--------|
| **Cross-post** | Article from personal blog/Ghost/Medium | Dev.to post with canonical URL |
| **Revive** | Old Dev.to post | Updated content with current versions |
| **Condense** | Long piece | Focused Dev.to article (800–2,500 words) |
| **Translate** | Article in another language | English Dev.to post |
| **Localize** | Same language, different platform tone | Dev.to-native voice + tags + frontmatter |
| **Excerpt** | Section from larger work | Standalone Dev.to post |

If no source content → redirect to `content-generation-playbook.md`.

The **cross-post** (with canonical URL) sub-mode is Dev.to's bread and butter — the platform strongly supports and respects `canonical_url` for SEO.

## Step 1 — Source analysis

- **Origin platform**: Blog, Ghost, Hashnode, Medium, etc.
- **Core thesis** (1 sentence)
- **Claims inventory**: Distinct technical points
- **Asset inventory**: Code blocks (language tags present?), images, embeds
- **Canonical URL**: Original URL (set `canonical_url` for cross-posts)
- **Word count**: Dev.to sweet spot is 800–2,500; plan condensation or expansion

## Step 2 — Extract canonical content spec

- **Title candidates** (3): 60–80 chars, keyword-front-loaded
- **Description**: ≤170 chars, value proposition
- **Outline**: Problem → Solution → Code → Result flow
- **Key assets**: Cover image (1000×420), code, Liquid embed opportunities
- **Tags**: 3–4 from Dev.to's popular taxonomy (lowercase)
- **Series**: Part of a multi-article sequence?
- **Canonical URL**: Origin URL
- **Frontmatter**: Plan all YAML fields

## Step 3 — Gap analysis vs platform DNA

Read `references/platform-dna.md`. Assess the source:

| Dimension | Gap analysis |
|-----------|-------------|
| TL;DR | Present at top? (Dev.to convention) |
| Title | 60–80 chars? Keyword-front-loaded? |
| Description | ≤170 chars? |
| Cover image | 1000×420? |
| Tags | 3–4, lowercase, popular taxonomy? |
| Code blocks | Language tags on all? Complete and runnable? |
| Tone | "Explaining to a colleague"? No marketing? No academic? |
| Word count | 800–2,500? |
| Liquid embeds | Any tweets/CodePens/YouTube/GitHub to embed? |
| Canonical URL | Set for cross-posts? |
| No fluff | Zero "In today's rapidly evolving..."? |
| No gating | Full content on Dev.to? (No "read the rest on my blog") |

## Step 4 — Restructure

### Dev.to-first transformation

```
Source structure            → Dev.to structure
──────────────────────────────────────────────
(missing)                   → TL;DR at the top (2-3 sentences)
Academic/formal title       → 60-80 chars, keyword-front-loaded
(missing)                   → Description (≤170 chars)
(missing)                   → Cover image (1000×420)
(missing)                   → Frontmatter YAML block
Long introduction           → Problem statement (get to the point)
Theory without code         → Code-first (show the solution early)
Code without language tags  → Add language tags on every block
No runnable examples        → Make code complete (imports, setup, output)
Formal tone                 → Conversational technical
No engagement hook          → Add conclusion CTA (reactions, follow)
(missing)                   → Tags (3-4, lowercase)
External embeds             → Liquid tags where applicable
```

### Frontmatter construction

```yaml
---
title: "[60-80 chars, keyword-front-loaded]"
published: false
description: "[≤170 chars value proposition]"
tags: [tag1, tag2, tag3, tag4]
cover_image: "https://..."
canonical_url: "https://original-source.com/article"
series: "Series Name"
---
```

### Code block upgrade

- Add language tags to all code blocks
- Add complete imports and setup
- Add expected output as comments
- Keep individual blocks ≤40 lines (split into steps if longer)
- Replace platform-specific embeds with Liquid tags: `{% github %}`, `{% codepen %}`

### Content completeness check

Dev.to community pushes back hard on gated content. The FULL article must be on Dev.to:
- No "read the rest on my blog" — publish everything here
- Use `canonical_url` to give SEO credit to the original
- If source has gated sections, include them in Dev.to version

## Step 5 — Transcreate

- **Academic → colleague-tone**: "Explaining to a colleague over coffee"
- **Marketing → pure technical**: Strip "revolutionary", "game-changing" — state benefits directly
- **Formal → first-person**: "I ran into this..." builds trust on Dev.to
- **Hedge honestly**: "This works for X but not Y" — Dev.to readers respect honesty

For translations:
- Rebuild for Dev.to voice (not literal translation)
- Code examples should use current versions
- Tags in English (Dev.to's taxonomy is English)

## Step 6 — Constraint conflict resolution

| Conflict | Resolution |
|----------|-----------|
| Source >2,500 words | Split into series or condense to key insights |
| No code examples | Add illustrative code; if impossible, use `#discuss` tag |
| Source is gated/paywalled | Publish full content on Dev.to; canonical URL gives origin credit |
| >4 tags needed | Prioritize: 1st tag = category; remaining 3 by relevance |
| Source from non-English platform | Translate + adapt; rebuild code examples for current versions |
| Cover image missing or wrong ratio | Create 1000×420 or accept auto-crop |
| Source has marketing language | Strip completely; Dev.to community rejects it |

**Never gate content. Never use marketing language. Never skip the TL;DR.**

## Step 7 — Self-critique

- [ ] **Platform-fit**: Reads like a native Dev.to article?
- [ ] **TL;DR**: Present at top?
- [ ] **Title**: 60–80 chars, keyword-front-loaded?
- [ ] **Description**: ≤170 chars?
- [ ] **Cover image**: 1000×420?
- [ ] **Code blocks**: All language-tagged? Runnable?
- [ ] **No marketing language**: Zero "revolutionary" etc.?
- [ ] **No fluff opener**: First sentence is substance?
- [ ] **Full content**: No gating? No "read rest on blog"?
- [ ] **Tags**: 3–4, lowercase, popular?
- [ ] **Canonical URL**: Set for cross-posts?
- [ ] **Frontmatter**: Complete?
- [ ] **Word count**: 800–2,500?
- [ ] **Thesis fidelity**: Core preserved?

## Step 8 — Conformance report

```
### Conformance Report
- **Platform DNA rules applied:** [list]
- **Deliberate deviations:** [rules broken and why]
- **Unresolved mismatches:** [gaps]
- **Adaptation stats:** [source words → Dev.to words, code blocks enriched]
- **Dev.to fields:** [title, description, tags, cover, canonical, series, published]
- **Fidelity:** [thesis preserved ✓/✗]
```
