# Adaptation Playbook: Existing Article → Qiita-Native

> Use when the user has an existing draft, published article, or content from another platform to bring to Qiita. If the user only has an idea/topic, use `content-generation-playbook.md` instead.
>
> This playbook supersedes the legacy `content-adaptation.md` and incorporates all operational knowledge from it, including the CDN hotlink workaround.

## Step 0 — Intent check + sub-mode

| Sub-mode | Input | Output |
|----------|-------|--------|
| **Translate** | English article → Japanese | Transcreated Qiita article in 丁寧語 |
| **Cross-post** | Article from Dev.to/Hashnode/blog | Qiita-native version with Qiita markdown |
| **Condense** | Long piece (>5,000 字) | Shorter focused Qiita article |
| **Revive** | Old Qiita article | Updated content with current versions |
| **Excerpt** | Section from larger work | Standalone Qiita memo-style article |
| **Localize** | Same language, different platform conventions | Re-register and re-format for Qiita |

If no source content exists → redirect to `content-generation-playbook.md`.

The **translate** (English → Qiita Japanese) and **cross-post** sub-modes are the most common.

## Step 1 — Source analysis

- **Origin platform**: Where was this published? (Dev.to, Hashnode, blog, etc.)
- **Core thesis** (1 sentence): What does this article prove or teach?
- **Claims inventory**: List every distinct technical point
- **Asset inventory**: Code blocks (with languages), images (check URLs!), diagrams, links
- **Canonical URL**: Original publication URL
- **Language**: Source language (English, Japanese, other)
- **Environment info**: Are versions/OS/tools mentioned in the source?

## Step 2 — Extract canonical content spec

Same schema as `content-generation-playbook.md` Step 2:
- **Title candidates** (3): Mapped to Qiita convention: 「<技術名>で<問題>を解決する方法」
- **Outline**: Sections mapped to Qiita's expected flow
- **Key assets**: Code samples, diagrams, images (flagged for re-hosting)
- **Tags**: Up to 5 from Qiita's taxonomy (correct casing)
- **Voice markers**: 丁寧語 register target

## Step 3 — Gap analysis vs platform DNA

Read `references/platform-dna.md`. Assess the source against Qiita's norms:

| Dimension | Gap analysis question |
|-----------|----------------------|
| Language | Is the source in Japanese? If not, full transcreation needed |
| Register | Is the source in 丁寧語? If not, register shift needed |
| Environment section | Does the source include OS/version/tool info? |
| Code blocks | Do they have language tags + filenames? |
| Callouts | Are gotchas/warnings using `:::note` syntax? |
| Marketing content | Does the source have promotional language? Must be stripped |
| Images | Are any images from cdn.gooo.ai? (Hotlink trap!) |
| Structure | Does it follow はじめに → 環境 → 手順 → まとめ → 参考? |
| Citations | Are references formatted as footnotes or blockquotes? |

## Step 4 — Restructure

Re-skeleton the content for Qiita's expected structure:

### Structure mapping

```
Source structure          → Qiita structure
─────────────────────────────────────────
Introduction/Background   → はじめに (2-3 sentences, what this solves)
(missing)                 → 環境 (add OS, versions, tools table)
Tutorial steps            → 手順 (H2 per step, code + explanation)
Notes/warnings            → :::note info/warn/alert callouts
Code examples             → Code blocks with language + filename
Results                   → 結果 (screenshots, output)
Conclusion                → まとめ (bullet summary)
References                → 参考 (links, footnotes)
```

### Image re-hosting (CRITICAL — cdn.gooo.ai hotlink trap)

YouMind's AI-generated images are served from `cdn.gooo.ai`, which enforces Referer-based anti-hotlink protection. When an article on Qiita references these URLs, the reader's browser sends a `qiita.com` Referer and the CDN rejects the request → **broken image icons**.

**Mandatory workaround — re-host every cdn.gooo.ai image:**

1. **Download** the `cdn.gooo.ai` image locally (the agent can `curl`/`fetch` without a Referer header, so the download works fine).
2. **Upload** the local file to Qiita's native image store, which returns a URL on `qiita-image-store.s3.amazonaws.com`. The monthly image-upload quota is reported by `POST /qiita/validateConnection` via `imageMonthlyUploadLimit` / `imageMonthlyUploadRemaining` — respect it.
3. **Replace** every `cdn.gooo.ai` URL in the Markdown body with the Qiita-hosted URL before calling `POST /qiita/createItem` or `POST /qiita/updateItem`.

**Never leave a `cdn.gooo.ai` URL in the final `body` sent to Qiita.**

### Code block upgrade

- Add language tags if missing: ` ```python ` → ` ```python:script.py `
- Add filenames where applicable
- Convert `diff` blocks for change highlighting
- Ensure code is complete and runnable (add imports, setup)

### Qiita-specific formatting

- Convert blockquote warnings → `:::note warn`
- Convert info boxes → `:::note info`
- Convert important notes → `:::note alert`
- Add 目次 for articles >1,000 字
- Add footnotes `[^1]` for citations

## Step 5 — Transcreate

If translating from English to Japanese (the most common adaptation for Qiita):

### Register shift
- Target: **丁寧語** (です/ます form) as default
- Technical terms stay in English: `useState`, `Docker Compose`, `API`
- Mix naturally: 「`useState`フックを使って状態管理を行います」
- Avoid literal translation that sounds unnatural (機械翻訳臭)

### Example localization
- Western service examples → Japan-ecosystem equivalents where meaningful
  - e.g., AWS-specific examples are fine (global); Venmo → PayPay if payment context
- Japanese-specific tooling references where relevant (e.g., Zenn as comparison)

### Idiom replacement
- "out of the box" → 「デフォルトで」
- "under the hood" → 「内部的に」or 「裏側で」
- "boilerplate" → 「ボイラープレート」(already loan-word in Japanese dev community)
- "gotcha" → 「ハマりポイント」

### Title transcreation
- Don't literally translate the English title
- Rebuild using Qiita convention: 「<技術名>で<やること>」
- Example: "Building REST APIs with Hono" → 「Honoを使ってREST APIを構築する方法」

## Step 6 — Constraint conflict resolution

| Conflict | Resolution |
|----------|-----------|
| Source is marketing-heavy | Strip all promotional language; reframe as pure technical sharing |
| Source has no environment info | Add environment section by inspecting code/context |
| Source images all from cdn.gooo.ai | Re-host ALL via Qiita image store (Step 4) |
| Source is too long (>5,000 字) | Split with consistent title prefix for series-like grouping |
| English source, audience expects Japanese | Full transcreation, not machine translation |
| Source code is untested/pseudocode | Add real, runnable versions or explicitly label as conceptual |
| Source uses platform-specific embeds | Replace with Qiita-native equivalents or plain markdown |

## Step 7 — Self-critique

- [ ] **Platform-fit**: Does this read like a native Qiita article?
- [ ] **Register**: Consistent 丁寧語 throughout?
- [ ] **環境 section**: Present with versions?
- [ ] **Code blocks**: All have language + filename? All runnable?
- [ ] **:::note callouts**: Used for warnings and prerequisites?
- [ ] **Images**: Zero `cdn.gooo.ai` URLs remaining?
- [ ] **宣伝チェック**: Zero marketing language remaining?
- [ ] **Tags**: 1–5, correct casing, popular taxonomy?
- [ ] **Thesis fidelity**: Core argument preserved from source?
- [ ] **Attribution**: Source credited? Canonical URL considered?
- [ ] **Transcreation quality**: Reads naturally in Japanese? (Not 機械翻訳臭?)

## Step 8 — Conformance report

```
### 適合性レポート (Conformance Report)
- **適用したルール:** [which platform-dna items shaped the adaptation]
- **意図的な逸脱:** [rules intentionally broken and why]
- **未解決の不一致:** [known gaps]
- **変換統計:** [source language, source word count → Qiita word count, images re-hosted count]
- **CDN再ホスト:** [N images re-hosted from cdn.gooo.ai ✓ / 0 remaining in body ✓]
- **忠実性:** [thesis preserved ✓/✗, key claims preserved N/M]
```
