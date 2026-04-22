# Generation Playbook: Idea → Hashnode-Native Draft

> Use when the user has a topic, thesis, or angle but **no existing draft**. If the user has existing content, use `content-adaptation-playbook.md` instead.

## Step 0 — Intent check

| User intent | Redirect to |
|-------------|------------|
| Has an existing article for Hashnode | `content-adaptation-playbook.md` (cross-post mode) |
| Wants to update an old Hashnode post | `content-adaptation-playbook.md` (revive mode) |
| Wants to expand a short piece into deep-dive | `content-adaptation-playbook.md` (adapt mode) |
| Wants to extract a section for promotion | `content-adaptation-playbook.md` (excerpt mode) |

If the user has only a topic or thesis → continue with generation.

## Step 1 — Evidence brief

Hashnode rewards depth. Surface-level content doesn't surface in feeds.

Required:
- **Thesis** (1 sentence): The technical insight, solution, or architecture decision
- **Supporting claims** (2–5 bullets): Technical steps, findings, or design decisions
- **Evidence per claim**: Working code, benchmarks, architecture diagrams, real metrics
- **Reader problem**: What specific technical challenge are they facing?
- **Desired takeaway**: What can the reader build, fix, or understand after reading?
- **Voice/brand constraints**: Depth level? Audience expertise? Brand tone?

If claims lack code or data evidence → stop and ask. Hashnode readers expect proof.

## Step 2 — Canonical content spec

- **Title/hook candidates** (3 options): ~70 chars, specific technical topic
- **Subtitle candidates** (2 options): Context or secondary hook
- **Outline**: Technical flow (problem → approach → implementation → results → gotchas)
- **Key assets**: Cover image (1600×840), code samples (with filenames), architecture diagrams, benchmark data
- **CTA**: Try the repo? Read the next series part? Comment?
- **Voice markers**: Technical depth level, tone
- **Series context**: Is this a standalone or part of a series?
- **Canonical URL**: Is this cross-posted from another site? (set canonical)

## Step 3 — Apply platform DNA

Read `references/platform-dna.md`. Map the canonical spec to Hashnode's norms:

- **Title**: ~70 chars; signals technical depth (not clickbait)
- **Subtitle**: Expand the title with context or problem framing
- **Cover image**: 1600×840 — required for featured placement
- **Depth check**: Is the article ≥1,500 words? Hashnode audiences expect depth.
- **Code blocks**: Plan with language tags AND filenames: ` ```ts:src/handler.ts `
- **Series**: If this is a multi-part topic, set up the series and specify position
- **Tags**: Choose up to 5 from Hashnode's taxonomy (tags have dedicated audiences)
- **Canonical URL**: Set if cross-posting from personal blog
- **OG meta**: Customize title + description for social sharing
- **Table of Contents**: Will auto-generate for long posts — structure headings to support this

## Step 4 — Draft (Hashnode-native from scratch)

Write in Hashnode's technical depth register. Not a quick tip — a thorough exploration.

### Hashnode-native article structure:

```markdown
# [~70 char title — specific technical topic]
## [Subtitle: secondary hook or context]

[Opening: Problem with real numbers or scenario]
[1-2 paragraphs establishing the problem and what this article delivers]

## The Problem

[Concrete description of the challenge with specific details]
[Real metrics, error messages, or architecture context]

## Approach

[Why this approach was chosen over alternatives]
[Brief comparison if relevant]

## Implementation

### [Step 1 heading]

```typescript:src/handler.ts
// Complete, runnable code with filename
```

[Explanation of what the code does and design decisions]

### [Step 2 heading]

```typescript:src/config.ts
// Next piece of the implementation
```

[Continued explanation with real examples]

## Results

[Benchmarks, metrics, before/after comparison]
[Data-driven proof that the approach works]

## Gotchas & Pitfalls

[Real issues encountered during implementation]
[Edge cases and how to handle them]

## Summary

- [Bullet point recap of key insights]
- [What to try next]

## Resources

- [GitHub repository link]
- [Official documentation]
- [Related Hashnode articles]
```

### Hashnode-native writing rules:
- **Depth over breadth**: 1,500–3,000 words expected; don't pad but don't skim
- **Code blocks with filenames**: Always include: ` ```ts:src/file.ts `
- **Real metrics**: Before/after numbers, benchmark methodology, specific versions
- **Architecture context**: Explain WHY, not just HOW
- **Gotchas section**: Real pitfalls from hands-on experience (not generic warnings)
- **Series navigation**: If multi-part, reference previous and tease next
- **Table of Contents friendly**: Use clear, descriptive H2/H3 headings
- **No marketing language**: Technical depth must carry the article

## Step 5 — Constraint conflict resolution

| Conflict | Resolution |
|----------|-----------|
| Topic too broad (>4,000 words needed) | Split into series with linked navigation |
| Too shallow (<800 words) | Expand with real examples, benchmarks, gotchas — or reconsider if Hashnode is the right platform |
| No code to show | Add minimal reproducible examples; if purely conceptual, consider Ghost/WordPress instead |
| Cross-post without canonical URL | Always set canonical to original source — SEO penalty otherwise |
| Cover image missing | Generate or source — posts without cover don't appear in featured feeds |
| Clickbait title temptation | Rewrite to signal depth: "How X works under the hood" > "You won't believe what X does" |

**Never publish shallow content on Hashnode. Never skip the cover image.**

## Step 6 — Self-critique

- [ ] **Platform-fit**: Does this read like a native Hashnode deep-dive? (Not a quick blog post)
- [ ] **Depth**: ≥1,500 words with substance (not padding)?
- [ ] **Title**: ~70 chars, signals technical depth?
- [ ] **Subtitle**: Provides useful context?
- [ ] **Cover image**: 1600×840, relevant?
- [ ] **Code blocks**: All have language tags AND filenames where applicable?
- [ ] **Real metrics**: Benchmarks, version numbers, concrete data present?
- [ ] **Gotchas section**: Real pitfalls from experience (not generic warnings)?
- [ ] **Tags**: 3–5 from Hashnode taxonomy?
- [ ] **Series**: Position set if multi-part?
- [ ] **Canonical URL**: Set correctly if cross-posted (trailing slash matches)?
- [ ] **Factuality**: Every claim backed by code, data, or explicit experience?
- [ ] **No marketing**: Article stands on technical merit alone?

## Step 7 — Conformance report

```
### Conformance Report
- **Platform DNA rules applied:** [which items from platform-dna.md shaped the draft]
- **Deliberate deviations:** [any rule intentionally broken and why]
- **Unresolved mismatches:** [known gaps the user should address]
- **Post stats:** [word count, code block count (with filenames), image count, tag list]
- **Hashnode fields:** [title, subtitle, cover image, canonical URL, series, tags, OG meta]
```
