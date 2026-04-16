# 公众号 Platform DNA (Index)

> **Scope:** This file describes observable platform behavior — format constraints, discourse norms, moderation signals, and content patterns derived from WeChat Official Account platform data and high-performing articles. It does NOT make claims about audience psychology, ethnicity, or cultural generalizations. All guidance derives from what the platform rewards and tolerates.
>
> **This is an INDEX file.** The youmind-wechat-article skill has extensive existing references covering platform behavior in depth. This file consolidates key dimensions and points to authoritative sources rather than duplicating them.

## Platform snapshot (2025)

- WeChat: 1.4 billion+ monthly active users globally
- 3.5 million+ business Official Accounts
- 4.44 billion articles published in 2024; 307,800 articles hit 100K+ reads
- 49.5% of Official Account readers under 30; 50.5% over 31
- 74% mobile-primary access; average user follows 10–20 accounts
- 62% of followers engage with brand updates at least weekly
- 75% of users aged 55+ regularly read subscription articles
- 1 billion+ daily interactions across views, comments, and likes

## Format constraints

**Authoritative source:** `wechat-constraints.md`

Key constraints (see source for full details):

| Element | Constraint |
|---------|-----------|
| Title | ≤64 chars hard limit; **≤14 汉字 optimal** for mobile subscription list |
| 副标题 (Subtitle) | Supported in some templates |
| 封面图 (Cover) | **Mandatory**; 16:9 ratio; 900×500px minimum |
| 首图 (Lead image) | Often same as cover or variant |
| Body | Rich-text HTML subset; restricted CSS attributes |
| Paragraph length | **2–4 sentences max** (mobile vertical scroll) |
| 摘要 (Digest) | ≤120 UTF-8 bytes (≈54 汉字) |
| Word count | 1,500–2,500 字 sweet spot |
| External links | Restricted — 公众号 interlinks OK; external only via 阅读原文 |

## Discourse norms (observable)

**Authoritative sources:** `writing-guide.md` §tone, `topic-selection.md` §hooks

Additional platform norms not fully covered in existing references:

- **底部引流卡片 (Bottom traffic card):** Near-universal on professional accounts — guides to follow, read more, or visit mini-program
- **原创声明 (Original declaration):** High-quality accounts use on every post; unlocks 赞赏 (tips) and 原创 badge
- **合集 (Collections):** Grouping related articles; growing in importance for discovery
- **话题标签 (Topic tags):** Platform-level hashtags for cross-account discovery (separate from article tags)

### Opening patterns

See `writing-guide.md` §pre-writing framework for detailed guidance.

- 痛点钩子 (Pain-point hook): Lead with a problem readers recognize
- 反差钩子 (Contrast hook): Subvert expectations in the first sentence
- 故事钩子 (Story hook): Personal anecdote framing the thesis
- 数字钩子 (Number hook): "87% of... but only 3% actually..."

### Closing patterns

- 引导关注 CTA: "觉得有用就点个关注吧"
- 底部卡片: Mini-program / related article / QR code
- 赞赏 (Tip jar): Enabled for 原创 articles
- 阅读原文: Only placement for external URL links

### Self-promo tolerance

- **High** (the account IS the product) — but 硬广 (hard advertising) penalizes engagement
- Soft promo through educational/storytelling content performs best
- Product placement acceptable when wrapped in genuine value

## Moderation & flagging patterns

**Authoritative source:** `wechat-constraints.md` §flagging

Key patterns:
- **Removed:** Politically sensitive content, health misinformation, financial fraud, copyright violation
- **Restricted:** Excessive external links, 诱导分享 (inducing shares), extreme 标题党 (clickbait)
- **Penalized in distribution:** Low-quality reposts, 洗稿 (article spinning)
- **Platform review:** 原创 articles may be checked for originality

## Platform-native features to leverage

**Authoritative sources:** `wechat-constraints.md` §features, `visual-prompts.md`

| Feature | When / why |
|---------|-----------|
| 原创声明 | Every original article — unlocks 赞赏 and 原创 badge |
| 赞赏 (Tips) | Monetization for quality content |
| 付费阅读 (Paid reading) | Premium content behind paywall |
| 视频号 embed | When video supplements the article |
| 投票 (Poll) | Reader engagement, opinion gathering |
| 话题标签 | Cross-account discovery |
| 合集 (Collections) | Series organization |
| 底部引流卡片 | Every article — follow, read more, mini-program |
| 阅读原文 link | Only way to link to external URLs |
| Markdown → HTML | Via toolkit converter; see `style-template.md` for layout blocks |
| Theme system | See `theme-dsl.md` and `style-template.md` |

## Hard limits

**Authoritative source:** `wechat-constraints.md` (canonical for all hard limits)

## Anti-patterns

**Authoritative source:** `writing-guide.md` §anti-patterns

Additional observable anti-patterns:
- **大段长文无分节:** Walls of text without subheadings — mobile users scroll past
- **标题不吸引:** Generic titles lose in the subscription list feed
- **首图质量差:** Low-res or irrelevant cover images reduce open rate
- **无 CTA:** Articles without closing CTA miss follow/share conversion
- **尾部无引导关注:** Missing bottom follow guide — biggest missed opportunity
- **代码块过多:** 公众号 code rendering is poor; prefer screenshots or minimal inline code

## Example calibration patterns

See `writing-guide.md` for voice examples and `style-template.md` for layout patterns.

**High-performing article template:**
1. 标题: ≤14 字, 痛点/反差/数字 hook
2. 封面图: High-quality, topic-relevant, 16:9
3. 开头: Hook in first 2 sentences (第一屏即钩)
4. Body: Short paragraphs (2–4 句), 小标题 every 3–5 paragraphs, images every 300–500 字
5. 引用/数据: Concrete evidence grounding claims
6. 结尾: Summary + CTA + 引导关注
7. 底部: 引流卡片 or 阅读原文 link
