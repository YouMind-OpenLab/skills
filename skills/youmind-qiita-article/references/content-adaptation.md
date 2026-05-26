# Qiita Content Adaptation Guide

Rules for writing articles that resonate with the Qiita developer community.

## Target Audience

- Japanese software developers (primary)
- International developers reading Japanese tech content
- Engineering teams sharing internal knowledge publicly
- Students and junior developers learning technologies
- DevOps, infrastructure, and SRE engineers

## Language

- **Primary language:** Japanese (most Qiita content is in Japanese)
- **English articles:** Accepted but much smaller audience
- **Mixed:** Japanese text with English technical terms is the norm
- If user writes in Japanese, keep it in Japanese. If in English, keep English.

## Title Rules

- **No strict length limit** (up to 255 chars), but concise is better (40-80 chars)
- **Technology name first:** Start with the main technology
- **Be specific:** What the reader will learn or solve
- **Common patterns:**
  - `[Technology] で [What you do]` (e.g., `Python で Qiita API を使って記事を投稿する`)
  - `[Technology] の [Topic] まとめ` (summary format)
  - `[Problem] を [Solution] で解決する`

**Good titles:**
- `TypeScript の型パズルを理解する: Conditional Types 入門`
- `Docker Compose で開発環境を構築するベストプラクティス`
- `React Server Components: 仕組みと実践ガイド`

**Bad titles:**
- `メモ` (too vague)
- `すごいことがわかった！` (clickbait)
- `プログラミングについて` (too broad)

## Article Structure

Qiita articles tend to follow a clear, structured format:

1. **Introduction/Background** — Why this topic matters, what problem it solves
2. **Prerequisites/Environment** — Versions, tools, OS used
3. **Main content** — Step-by-step explanation with code
4. **Working code** — Complete, runnable examples
5. **Results/Output** — Screenshots, terminal output, benchmarks
6. **Gotchas/Notes** — Common pitfalls, edge cases
7. **References** — Links to official docs, related articles

## Code Block Rules

- Every code block MUST have a language tag
- Qiita supports extended syntax: ` ```python:filename.py ` to show filename
- Use `diff` blocks to highlight changes: ` ```diff `
- Keep individual blocks concise; split into steps for long code
- Show both input and output when relevant
- Include version numbers for dependencies

## Images and the `cdn.gooo.ai` hotlink trap

YouMind's AI-generated images are served from `cdn.gooo.ai`, which enforces
Referer-based anti-hotlink protection. If an article embeds those URLs
directly (e.g. `![cover](https://cdn.gooo.ai/gen-images/...jpg)`), Qiita
readers' browsers will send a `qiita.com` Referer and the CDN will reject
the request, so the article shows broken image icons.

**Workaround — re-host every image on Qiita before publishing:**

1. Download the `cdn.gooo.ai` image locally (the agent can `curl`/`fetch`
   without a Referer header, so the download itself works).
2. Upload the local file into Qiita's own image store so it ends up on a
   Qiita-owned domain (e.g. `qiita-image-store.s3.amazonaws.com`). Qiita's
   editor accepts drag-and-drop upload and returns a stable Markdown snippet
   — use that URL in the article body. The monthly image-upload quota for
   the connected account is reported by `POST /qiita/validateConnection`
   via `imageMonthlyUploadLimit` / `imageMonthlyUploadRemaining`; respect it.
3. Replace every `cdn.gooo.ai` URL in the Markdown body with the
   Qiita-hosted URL before calling `POST /qiita/createItem` or
   `POST /qiita/updateItem`.

Never leave a `cdn.gooo.ai` URL in the final `body` sent to Qiita.

## Tags

- **Max 5 tags recommended** per article
- Tags are **free-form** — any string works, new tags auto-created
- **Case matters:** `Python` and `python` are different tags
- Use **existing popular tags** for discoverability:
  - `Python`, `JavaScript`, `TypeScript`, `React`, `Vue.js`, `Go`, `Rust`, `Docker`, `AWS`, `機械学習`, `初心者`, `Rails`, `Node.js`, `Linux`
- First tag is most prominent in search results

## Tone and Voice

- **Knowledge-sharing spirit:** Qiita's culture is "share what you learned"
- **Humble and helpful:** "I struggled with X, here's what worked" is valued
- **Technical precision:** Japanese dev community values accuracy
- **Personal experience OK:** "I tried X and found Y" builds credibility
- **Memo-style articles:** Short "notes to self" are common and accepted on Qiita
- **Avoid marketing language:** Pure technical content performs best

## Anti-Patterns (Avoid These)

| Anti-pattern | Why it fails | Fix |
|-------------|-------------|-----|
| No environment info | Readers can't reproduce | Always list versions, OS, tools |
| Untested code examples | Broken code destroys trust | Test all code before publishing |
| Copy-paste from docs only | No original value added | Add your experience, gotchas, use cases |
| No tags | Article is undiscoverable | Add 1-5 relevant tags |
| Marketing/promotional tone | Qiita community rejects self-promotion | Focus on technical value |
| Outdated content without notice | Misleads readers | Mark outdated sections or update regularly |

## Word Count Guidelines

| Type | Length | When to use |
|------|--------|-------------|
| Memo/Tip | 200-500 words | Quick notes, single technique |
| Tutorial | 800-2000 words | Step-by-step guide |
| Deep dive | 2000-5000 words | Architecture, comparison, analysis |
| Series part | 800-1500 words | Part of a multi-article series |

## Private vs Public

- **Public (`private: false`):** Visible to everyone, indexed by search engines, appears in feeds
- **Private (`private: true`):** Only accessible via direct URL. Useful for drafts or team sharing
- Default to **private** for safety. User can change to public when ready.

## Qiita-Specific Features

- **Organizations:** Publish under a company/team organization for collective knowledge
- **Slide mode:** Converts the article into a presentation (split by `---` or `# headings`)
- **LGTM (Likes):** Community approval signal; high-quality technical content gets LGTMs
- **Stocks:** Users bookmark useful articles; indicates lasting reference value
- **Series:** No built-in series feature, but use consistent title prefixes
