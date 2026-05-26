# Qiita Platform DNA

> **Scope:** This file describes observable platform behavior — format constraints, discourse norms, moderation signals, and content patterns derived from Qiita's platform data, community guidelines, and high-performing articles. It does NOT make claims about audience psychology, ethnicity, or cultural generalizations. All guidance derives from what the platform rewards and tolerates.

## Platform snapshot (2025)

- 1.5 million registered members (March 2025)
- 50 million monthly page views
- 1 million+ cumulative articles (November 2024)
- ~40% of engineers under 34 (Engineer White Paper 2024)
- Advent Calendar 2024: 23,000+ registrations, biggest in platform history
- Primary content language: Japanese (日本語)
- Articles in English tolerated but rarely surface in default discovery feeds
- Top AI tools among Qiita users: ChatGPT (#1), GitHub Copilot (#2)

## Format constraints

| Element | Constraint |
|---------|-----------|
| Post length | No hard limit; 1,000–3,000 字 typical for tutorials |
| Title | Up to 255 chars; 40–80 chars typical |
| Tags | Up to 5; free-form; **case-sensitive** (`Python` ≠ `python`) |
| Markup | Qiita-flavored Markdown (GFM superset) |
| Code blocks | Language tag + optional filename: ` ```ruby:app.rb ` |
| Callouts | `:::note info` / `:::note warn` / `:::note alert` |
| Footnotes | `[^1]` supported |
| Math | `$$...$$` LaTeX inline and block |
| Diagrams | Mermaid and PlantUML supported |
| Emoji | Shortcodes `:sparkles:` supported |
| `diff` blocks | ` ```diff ` for highlighting changes |
| Images | Upload to Qiita's native image store (qiita-image-store.s3.amazonaws.com) |

## Discourse norms (observable)

### Register

- Default register: **丁寧語** (です/ます polite form) — the dominant register on the platform
- Casual register (だ/である form) appears in memo-style posts but is less common in tutorials
- Technical terms in English mixed with Japanese prose is standard: 「Reactの`useState`フックを使って…」
- Marketing or promotional register is rejected by the community (see Anti-patterns)

### Opening patterns

- **背景 (Context):** State what you were trying to do and why
- **問題 (Problem):** Clearly define the specific issue
- **解決策 preview:** Preview the answer upfront
- Common opener: 「この記事では〜について解説します」(In this article, I explain ~)
- 目次 (Table of contents) at the top for articles >1,000 字

### Closing patterns

- **まとめ (Summary):** Bullet-point recap of key learnings
- **参考 (References):** Links to official docs, related Qiita articles, GitHub repos
- Common closer: 「参考になれば幸いです」(I hope this is helpful)

### Citation conventions

- Blockquote `>` for direct quotes from documentation
- Footnotes `[^1]` for longer citations
- Inline links to official docs preferred over paraphrasing
- Attribution for code samples with source links

### Self-promo tolerance

- **LOW.** Product marketing articles are downvoted and receive critical comments
- Product mention acceptable ONLY when the technical content carries the article independently
- "宣伝臭い" (smells like advertising) is the most common community complaint
- Organization accounts (企業アカウント) have slightly more latitude but still judged by technical value

## Moderation & flagging patterns

- **Downvoted / reported:** Marketing disguised as technical content, duplicate content, low-effort copy-paste from docs
- **Low engagement:** English-only articles when Japanese translation is feasible, clickbait titles, code-free theory articles
- **Community norms:** Errata corrections via polite comments are expected and welcomed; authors are expected to update articles when issues are pointed out
- **Quality signal:** LGTM count (likes) + ストック count (saves); ratio of saves-to-likes indicates lasting reference value

## Platform-native features to leverage

| Feature | When / why |
|---------|-----------|
| `:::note info/warn/alert` | Gotchas, prerequisites, important caveats — visually prominent |
| Code blocks with filename | ` ```ruby:Gemfile ` — shows file context |
| `diff` code blocks | Highlight what changed between versions |
| Math `$$` | Algorithm explanations, data science articles |
| Mermaid diagrams | Architecture visualization, flow diagrams |
| LGTM (Like) | Community approval signal; drives feed ranking |
| ストック (Stock/Save) | Lasting reference value indicator |
| 限定共有 (Private) | Draft review, team sharing via direct URL |
| Organizations | Company-branded knowledge sharing |
| Advent Calendar | Annual community event; high-visibility participation |

## Hard limits (must not violate)

- 5 tags maximum per article
- Tags are case-sensitive (`Python` ≠ `python`) — use popular casing
- Japanese content strongly preferred for discoverability (search and recommendation algorithms favor Japanese)
- Image monthly upload quota reported by `POST /qiita/validateConnection` — respect `imageMonthlyUploadLimit` / `imageMonthlyUploadRemaining`
- External images from `cdn.gooo.ai` WILL FAIL due to Referer-based anti-hotlink protection — must re-upload to Qiita's native image store before publishing

## Anti-patterns

| Anti-pattern | Why it fails |
|-------------|-------------|
| 宣伝臭い (smells like advertising) | Community's #1 complaint; gets downvoted and commented on |
| No environment info | Readers cannot reproduce; expect 「環境書いてください」 comments |
| Untested code examples | Broken code destroys trust; Qiita readers test everything |
| English-only (when Japanese translation feasible) | Invisible to majority of readers |
| Clickbait titles | 「すごいことがわかった！」→ dismissed as unserious |
| No 目次 for long posts | Long articles without table of contents lose readers |
| Copy-paste from official docs | No original value; "公式ドキュメント読めばいい" comments |
| Code without explanation | Code dumps without context receive low LGTM |
| cdn.gooo.ai image URLs in body | Images appear broken to all readers on Qiita |

## Example calibration patterns

**High-LGTM article structure:**
1. Title: 「<技術名>で<問題>を解決する方法」
2. 目次 (Table of contents)
3. はじめに (Introduction) — 2-3 sentences: what this solves
4. 環境 (Environment) — OS, language version, library versions
5. 手順 (Steps) — H2 per step; code block + explanation alternating
6. `:::note warn` for gotchas
7. まとめ (Summary)
8. 参考 (References)

**Word count benchmarks:**

| Type | Length |
|------|--------|
| メモ / Tip | 200–500 字 |
| チュートリアル / Tutorial | 800–2,000 字 |
| 詳解 / Deep dive | 2,000–5,000 字 |
| Advent Calendar entry | 800–1,500 字 |

**Popular tags (use established casing):**
`Python`, `JavaScript`, `TypeScript`, `React`, `Vue.js`, `Go`, `Rust`, `Docker`, `AWS`, `機械学習`, `初心者`, `Rails`, `Node.js`, `Linux`
