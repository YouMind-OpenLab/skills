# Generation Playbook: Idea → Dev.to-Native Draft

> Use when the user has a topic, thesis, or angle but **no existing draft**. If the user has existing content, use `content-adaptation-playbook.md` instead.

## Step 0 — Intent check

| User intent | Redirect to |
|-------------|------------|
| Has an existing article to publish on Dev.to | `content-adaptation-playbook.md` (cross-post mode) |
| Wants to update an old Dev.to post | `content-adaptation-playbook.md` (revive mode) |
| Wants to condense a long piece | `content-adaptation-playbook.md` (condense mode) |
| Wants to translate content for Dev.to | `content-adaptation-playbook.md` (translate mode) |

If the user has only a topic or thesis → continue with generation.

## Step 1 — Evidence brief

Dev.to readers are developers. They detect fluff immediately. No evidence = no engagement.

Required:
- **Thesis** (1 sentence): The core insight, solution, or technique this article delivers
- **Supporting claims** (2–5 bullets): Technical points that build the argument
- **Evidence per claim**: Working code, benchmarks, error outputs, personal experience with real details
- **Reader problem**: What specific developer challenge does this address?
- **Desired takeaway**: What can the reader build, fix, or understand after reading?
- **Voice/brand constraints**: Technical depth? Beginner-friendly? Series context?

If claims lack evidence → stop and ask. "In today's rapidly evolving landscape" is not evidence.

## Step 2 — Canonical content spec

- **Title/hook candidates** (3 options): 60–80 chars, keyword-front-loaded
- **Description** (1 option): ≤170 chars, value proposition with primary keyword
- **Outline**: Problem → Solution → Code → Result flow
- **Key assets**: Cover image (1000×420), code samples, Liquid embeds (CodePen, GitHub, YouTube)
- **CTA**: Reactions (❤️/🦄), follow, series next, discussion
- **Voice markers**: Tone descriptors
- **Tags**: 3–4 from Dev.to's popular taxonomy (lowercase only)
- **Series**: Is this part of a multi-article sequence?
- **Canonical URL**: Is this cross-posted from a personal blog?

## Step 3 — Apply platform DNA

Read `references/platform-dna.md`. Map the canonical spec to Dev.to's norms:

- **Title**: 60–80 chars; keyword-front-loaded; specific about what reader learns
- **Description**: ≤170 chars; meta description + social preview
- **TL;DR**: Plan 2–3 sentence summary for the top of the article (Dev.to convention)
- **Cover image**: 1000×420; relevant to topic; minimal text overlay
- **Code planning**: Every block needs a language tag. Plan complete, runnable examples.
- **Liquid embed opportunities**: Any tweets, CodePens, YouTube videos, GitHub repos to embed?
- **Tag selection**: 3–4, lowercase, from popular taxonomy; first tag = article category
- **Series context**: If multi-part, create series and set position
- **Canonical URL**: Set if cross-posting from personal blog
- **Frontmatter**: Plan all YAML fields

## Step 4 — Draft (Dev.to-native from scratch)

Write in Dev.to's technical-but-approachable register. Not academic, not casual — "explaining to a colleague."

### Dev.to-native article structure:

```markdown
---
title: "[60-80 chars, keyword-front-loaded]"
published: false
description: "[≤170 chars value proposition]"
tags: [tag1, tag2, tag3, tag4]
cover_image: "https://..."
canonical_url: "https://..." # if cross-posted
series: "Series Name" # if applicable
---

## TL;DR

[2-3 sentences: what this article covers and what the reader will learn]

## The Problem

[What challenge are we solving? Be specific.]
[Why existing solutions don't work or could be better]

## Solution

### Step 1: [First thing]

```typescript
// Complete, runnable code
import { something } from 'somewhere';

const result = doTheThing();
console.log(result); // Expected output
```

[What this code does and why we chose this approach]

### Step 2: [Next thing]

```typescript
// Next piece of the solution
```

[Continued explanation — honest about tradeoffs]

## Results

[Proof it works: output, benchmarks, screenshots]
[Before/after comparison if applicable]

## Gotchas

- [Real pitfall #1 and how to avoid it]
- [Real pitfall #2]

## Conclusion

[Summary of what we built/learned]
[Invitation: "What's your approach? Let me know in the comments"]
```

### Dev.to-native writing rules:
- **TL;DR at the top**: 2–3 sentences — Dev.to convention, not optional
- **Code-first**: Show the code early; don't make readers wait past "The Problem" section
- **Language tags on every code block**: No exceptions
- **"Explaining to a colleague" tone**: First-person OK, honest about limits
- **Show AND tell**: Code example → explanation of what it does → why this approach
- **No marketing language**: "revolutionary", "game-changing" → readers leave
- **No fluff openers**: Skip "In today's world of..." entirely
- **Complete, runnable code**: Include imports, setup, expected output
- **Liquid tags**: Use `{% github %}`, `{% codepen %}`, etc. where they add value
- **Honest about limitations**: "This works for X but not Y" builds trust
- **800–2,500 words**: Enough depth without padding

## Step 5 — Constraint conflict resolution

| Conflict | Resolution |
|----------|-----------|
| Content too long (>2,500 words) | Split into series with linked navigation |
| No code to show (conceptual topic) | Add minimal illustrative examples; if purely opinion, use `#discuss` tag |
| Cross-post from blog without canonical URL | Always set `canonical_url` — Dev.to strongly respects it for SEO |
| Want to gate content behind personal site | Don't — "read the rest on my blog" triggers community pushback |
| Topic is beginner-level in declining trend | Still valuable — but add unique angle, not "yet another intro to X" |
| Cover image missing | Generate or source — significantly impacts feed visibility |
| More than 4 tags needed | Prioritize: 1st tag = article category; remaining 3 by search volume |

**Never publish without a TL;DR. Never use untagged code blocks. Never gate content.**

## Step 6 — Self-critique

- [ ] **Platform-fit**: Does this read like a native Dev.to article? (Not an academic paper or marketing piece)
- [ ] **TL;DR**: Present at the top? 2–3 sentences?
- [ ] **Title**: 60–80 chars, keyword-front-loaded, specific?
- [ ] **Description**: ≤170 chars, contains primary keyword?
- [ ] **Cover image**: 1000×420, relevant?
- [ ] **Code blocks**: All have language tags? All runnable? Imports included?
- [ ] **No marketing language**: Zero "revolutionary", "game-changing", "unlock the power of"?
- [ ] **No fluff opener**: First line is substance, not "In today's..."?
- [ ] **Tags**: 3–4, lowercase, from popular taxonomy?
- [ ] **Frontmatter**: All fields complete?
- [ ] **Factuality**: Every claim backed by code, data, or explicit experience?
- [ ] **Honest about limits**: "Works for X but not Y" where applicable?
- [ ] **Word count**: 800–2,500?
- [ ] **Liquid embeds**: Used where they add value (CodePen, GitHub)?

## Step 7 — Conformance report

```
### Conformance Report
- **Platform DNA rules applied:** [which items from platform-dna.md shaped the draft]
- **Deliberate deviations:** [any rule intentionally broken and why]
- **Unresolved mismatches:** [known gaps the user should address]
- **Post stats:** [word count, code block count, Liquid embed count, tag list]
- **Dev.to fields:** [title, description, tags, cover_image, canonical_url, series, published]
```
