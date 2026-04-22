# Engagement Playbook — Tumblr

Use this when the user asks about comments, replies, feedback, audience, or publishing cadence.

## Tumblr “comments” mapping

Tumblr does not behave like a flat comments feed.

Translate user intent like this:

- “看评论 / 看回复” → `listTumblrNotes` with `mode=conversation`
- “看互动 / 看最近反馈” → `listTumblrNotifications`
- “看粉丝情况” → `listTumblrFollowers`
- “今天还能发多少” → `getTumblrLimits`

Reality check:

- `listTumblrNotes` depends on the post being readable through Tumblr's public notes endpoint
- drafts, private posts, and some dashboard-only share URLs may not expose notes there
- when that happens, report it clearly and fall back to notifications

## Notes modes

- `conversation`: best for replies + reblogs with commentary
- `all`: full audit
- `likes`: low-signal approval view
- `rollup`: like/reblog aggregate view
- `reblogs_with_tags`: useful when the user cares about propagation context

## Notification review

Useful activity types:

- `reply`
- `reblog_with_content`
- `follow`
- `mention_in_post`
- `conversational_note`

Recommendation:

- if the user wants qualitative learning, filter toward reply / reblog_with_content / conversational_note
- if the user wants audience growth, include follow

## Followers and limits

Followers:

- use as a snapshot, not a final KPI
- combine with notes and notifications before making content claims

Limits:

- check before batch image publishing
- check before queue-heavy experiments

## Queue editing

Use `reorderTumblrQueue` when:

- sequence matters
- you are building a narrative arc
- one post should surface earlier

Use `shuffleTumblrQueue` when:

- you want variety
- the queue is too thematically repetitive

## Interpretation rule

Do not just dump raw counts.

Always summarize:

- what kind of feedback showed up
- what it implies about the angle
- what the next Tumblr post should do differently
