# 公众号 Platform DNA (Index)

> Scope: this file defines what the skill should treat as platform truth, platform heuristic, and editorial inference.
> It is an index, not the full playbook.

## Evidence Model

When writing for微信公众号, distinguish three layers:

- **Platform rules:** official or directly documented constraints
- **Research-backed heuristics:** transferable evidence from WeChat studies, mobile reading, and digital sharing behavior
- **House playbook:** operational defaults that work well but are not official rules

The skill should never present house playbook or inferred heuristics as if WeChat officially confirmed them.

## What You Can Treat as Hard Platform Truth

Read these first when correctness matters:

- `references/wechat-constraints.md`
- `references/runtime-rules.md`

Stable principles:

- external links and jumps are constrained; use native pathways first
- originality and source attribution matter; do not misuse 原创声明
- titles must not imitate official notices or use exaggerated scare tactics
- post-publish editing exists but is limited; publish as if major changes will be expensive
- platform capabilities such as 视频号嵌入, 话题, 合集, 底部承接组件 may vary by account and rollout

## What Strong Accounts Consistently Do

Consult these when the draft needs stronger strategy, not by default for every run:

- `references/professional-playbook.md`
- `references/attention-sharing-psychology.md`
- `references/conversion-architecture.md`
- `references/writing-guide.md`

Observable patterns that should shape the skill:

- title clarity matters more than ornamental cleverness
- the first screen must quickly establish reader payoff
- mobile rhythm matters more than desktop-style exposition
- a professional account behaves like a column system, not a random article feed
- the ending should hand the reader to one next action, not several

## Operational Defaults Used by This Skill

These are workflow defaults, not public platform guarantees:

- article H1 is the publish title, so title quality must be treated as a publishing concern, not a cosmetic one
- keep the key subject and payoff in the first half of the title because mobile surfaces are scanned, truncated, and socially reshared
- design the first 120-200 Chinese characters as the true opening battleground
- default to 2-4 short lines per paragraph on mobile
- plan one `primary_conversion_goal` per article
- when the user already has a finished article and only wants to send it, skip ideation/research and focus on mobile-native adaptation plus publish

## Anti-Patterns the Skill Should Actively Avoid

- unsupported pseudo-precision about recommendation weights or pool sizes
- recycled "爆文模板" advice with no evidence boundary
- titles that create curiosity but fail to deliver relevance
- multi-CTA endings that ask for everything at once
- assuming every account has every native feature enabled

## Reading Order by Need

| Need | Read first |
|------|------------|
| Platform-safe publishing | `wechat-constraints.md`, `runtime-rules.md` |
| Existing article ready to publish | `runtime-rules.md`, then `content-adaptation-playbook.md` |
| Stronger titles, hooks, and sharing | `seo-rules.md`, then `attention-sharing-psychology.md` if needed |
| Better columns, rhythm, and professional structure | `writing-guide.md`, then `professional-playbook.md` if needed |
| Better handoff into private domain or service flow | `operations.md`, then `conversion-architecture.md` if needed |
