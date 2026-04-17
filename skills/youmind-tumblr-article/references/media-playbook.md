# Media Playbook — Tumblr

Use this before publishing images to Tumblr.

## First decision: photo post or text post with lead image?

Choose **photo post** when:

- there is one main image
- the caption is supporting context
- the image is the reason the post exists

Choose **text post + cover image** when:

- the argument is primary
- the image only sets context
- the post still needs multiple sections

## Image requirements

- the current OpenAPI path expects a **public image URL**
- prefer a stable CDN URL
- avoid expiring signed URLs when possible

## Caption structure

Strong photo caption pattern:

1. What this is
2. Why it matters
3. One thought worth replying to

Keep it tight. If the caption keeps expanding, reconsider the format.

## State strategy

- `published`: when the user explicitly wants immediate distribution
- `draft`: default safe mode for image experiments
- `queue`: when the image is part of a sequence or schedule
- `private`: when the user wants storage/testing without public visibility

## Result hygiene

After publishing a photo post:

- always return the resolved URL when available
- otherwise return the blog URL fallback
- if the run was for testing, clean up with `delete` after validation when appropriate
