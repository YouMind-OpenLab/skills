# Tumblr Publishing Pipeline

This skill has four main lanes. Pick the lane first, then run the minimum steps needed.

## Lane A — Text post publishing

1. Load `~/.youmind/config.yaml`
2. Understand the request: generate vs adapt
3. Read `platform-dna.md`
4. Draft or adapt the article
5. Convert to simple Tumblr-safe HTML
6. Publish via `createTumblrPost`
7. Return title, state, post ID, result links, warnings

Fallback:

- If publish fails, save the adapted HTML locally

## Lane B — Photo post publishing

1. Read `media-playbook.md`
2. Decide: true photo post vs text post with lead image
3. Validate that the image is a public URL
4. Write a short caption with a real point of view
5. Publish via `createTumblrPhotoPost`
6. Return post ID, state, result links, and any caption warnings

Fallback:

- If photo publish fails, save the caption HTML locally and return the source image URL

## Lane C — Feedback review

1. Read `engagement-playbook.md`
2. Decide the right source:
   - direct post replies / commentary → `listTumblrNotes`
   - broader blog activity → `listTumblrNotifications`
   - audience snapshot → `listTumblrFollowers`
   - rate / quota check → `getTumblrLimits`
3. Summarize what the feedback means, not just raw counts
4. Turn that into concrete next-step recommendations

Fallback:

- If notes are unavailable, use notifications + blog URL fallback

## Lane D — Queue / editorial control

1. List `queue` or `draft`
2. Decide whether the queue needs curation or randomization
3. Use `reorderTumblrQueue` when sequence matters
4. Use `shuffleTumblrQueue` when variety matters more than sequence
5. Report the new intent clearly

## Decision rules

- Use **text post** when the thesis is the object
- Use **photo post** when the image is the object and the caption is supporting context
- Read **notes** when the user says “评论 / replies / reblogs”
- Read **notifications** when the user says “最近反馈 / activity”
- Read **limits** before bulk posting or image-heavy runs
- Use **queue reorder/shuffle** only for queued posts, not published posts
