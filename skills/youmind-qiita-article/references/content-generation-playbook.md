# Generation Playbook: Idea → Qiita-Native Draft

> Use when the user has a topic, thesis, or angle but **no existing draft**. If the user has any existing content, use `content-adaptation-playbook.md` instead.

## Step 0 — Intent check

Before generating, confirm the user wants **new content creation**:

| User intent | Redirect to |
|-------------|------------|
| Has an English article to publish on Qiita | `content-adaptation-playbook.md` (translate/transcreate mode) |
| Wants to condense a long piece | `content-adaptation-playbook.md` (condense mode) |
| Wants to update an old article | `content-adaptation-playbook.md` (revive mode) |

If the user has only an idea, topic, or rough notes → continue with generation.

## Step 1 — Evidence brief

Qiita's community values technical precision. An article without evidence is a 宣伝 (advertisement) waiting to happen.

Required:
- **Thesis** (1 sentence): The single technical insight or solution this article delivers
- **Supporting claims** (2–5 bullets): The steps, findings, or design decisions
- **Evidence per claim**: Code that runs, benchmark data, error messages, screenshots, version numbers
- **Reader problem**: What specific technical challenge does the reader have?
- **Desired takeaway**: What can the reader DO after reading this?
- **Voice/brand constraints**: Technical depth? Beginner-friendly? Memo-style?

If no evidence exists for claims → stop and ask. Qiita readers will call out unsubstantiated claims.

## Step 2 — Canonical content spec

Platform-agnostic content specification:

- **Title/hook candidates** (3 options): Focus on technology name + what the reader learns
- **Outline**: Ordered list of sections (problem → approach → implementation → result)
- **Key assets**: Code samples (with versions), screenshots, diagrams, environment info
- **CTA**: What should the reader try next?
- **Voice markers**: Tone descriptors

## Step 3 — Apply platform DNA

Read `references/platform-dna.md`. Map the canonical spec to Qiita's norms:

- **Language decision**: Is the user writing in Japanese or English? Match their language. If Japanese, use 丁寧語 (です/ます) as default register.
- **Title format**: Map to Qiita convention: 「<技術名>で<問題>を解決する方法」or similar pattern
- **Structure mapping**: Map outline to Qiita's expected flow: はじめに → 環境 → 手順 → まとめ → 参考
- **Code planning**: Every code block needs language tag + optional filename. Plan which files to show.
- **Callout planning**: Where should `:::note info/warn/alert` appear? (gotchas, prerequisites, important caveats)
- **Tag selection**: Choose up to 5 from Qiita's popular taxonomy (correct casing!)
- **Image handling**: Plan images via Qiita's native image store — NO cdn.gooo.ai URLs
- **Math/diagram**: Does any section benefit from `$$` math or Mermaid diagrams?

## Step 4 — Draft (Qiita-native from scratch)

Write directly in Qiita's discourse conventions. Do NOT write a generic English blog post and translate it.

### Qiita-native article structure:

```markdown
# [技術名]で[問題]を解決する方法

## はじめに

[2-3 sentences: what this article covers and why it matters]
[「この記事では〜について解説します」]

## 環境

| Tool | Version |
|------|---------|
| OS | macOS 14.x / Ubuntu 22.04 |
| Node.js | v20.x |
| [Library] | v3.x |

## [手順1: First major step]

[Explanation in 丁寧語]

:::note info
[Important note or prerequisite]
:::

```typescript:src/example.ts
// Complete, runnable code
```

[Explanation of what the code does and why]

## [手順2: Second major step]

[Continue pattern: explanation → code → explanation]

:::note warn
[Common gotcha or pitfall]
:::

## まとめ

- [Bullet point recap of key learnings]
- [What the reader can now do]

## 参考

- [Official documentation link]
- [Related Qiita article link]
- [GitHub repository link]
```

### Qiita-native writing rules:
- Register: 丁寧語 (です/ます) unless user explicitly requests casual
- Technical terms in English mixed with Japanese: 「`useState`フックを使って状態管理を行います」
- Every code block: language tag + filename when relevant
- Environment section: always include OS, runtime versions, library versions
- `:::note info/warn/alert` for callouts — not blockquotes or bold text
- 目次: include for articles >1,000 字
- No self-promotion — if referencing a product, the technical depth must stand alone
- Footnotes `[^1]` for citations to official documentation

## Step 5 — Constraint conflict resolution

| Conflict | Resolution |
|----------|-----------|
| Topic requires marketing language | Reframe as pure technical knowledge-sharing; remove product pitch |
| Content too long (>5,000 字) | Split into series with consistent title prefix |
| No code examples available | Add minimal reproducible examples; if impossible, clearly label as conceptual |
| Images from cdn.gooo.ai | Download → re-upload to Qiita image store → replace URLs |
| English-only content for Japanese audience | Transcreate to Japanese; or publish English with note |
| Topic already well-covered on Qiita | Add unique angle: your environment, your gotchas, your benchmarks |

**Never silently truncate or skip the environment section.**

## Step 6 — Self-critique

Before presenting to the user:

- [ ] **Platform-fit**: Does this read like a native Qiita article? (Not a translated English blog post)
- [ ] **Register check**: Consistent 丁寧語 throughout (or user-specified register)
- [ ] **環境 section**: OS, versions, tools all listed?
- [ ] **Code completeness**: Every code block runnable? Imports included? Language tags present?
- [ ] **:::note usage**: Gotchas marked with `:::note warn`? Prerequisites with `:::note info`?
- [ ] **Factuality**: Every claim backed by code, data, or explicit personal experience?
- [ ] **宣伝チェック**: Does any section read like product marketing? Remove or reframe.
- [ ] **Image URLs**: Zero `cdn.gooo.ai` references remaining in body?
- [ ] **Tags**: 1–5 tags, correct casing, from popular taxonomy?
- [ ] **Title**: Follows 「技術名+内容」pattern?

## Step 7 — Conformance report

Output alongside the draft:

```
### 適合性レポート (Conformance Report)
- **適用したルール:** [which platform-dna.md items shaped the draft]
- **意図的な逸脱:** [any rule intentionally broken and why]
- **未解決の不一致:** [known gaps the user should address]
- **記事統計:** [word count, code block count, image count, tag list]
```
