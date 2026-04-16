# Publishing Guidelines

This file captures shared publishing rules for YouMind skills that create drafts, publish posts, or hand content off to external platforms.

## Default Safety Rules

- Prefer draft mode first unless the user explicitly asks for direct publish.
- Validate the remote connection before the first publish attempt.
- Report the platform object ID and public URL when available.

## Smoke Test Rules

- Use clearly labeled test content.
- Clean up published artifacts after verification when the platform supports deletion.
- If deletion is unavailable, unpublish or revert to draft.
- If the upstream platform cannot delete test artifacts, state that limitation explicitly.

## Failure Handling

- Do not treat a single publish failure as a total pipeline failure unless no fallback exists.
- Surface the exact upstream error message when possible.
- Distinguish auth failure, plan limitation, content validation failure, and transport failure.

## Output Expectations

A successful publish or draft operation should return enough information for follow-up actions:

- `title`
- `status`
- `url`
- `post_id` or `draft_id`
- `notes`

## Shared Config Rule

Publishing-capable skills should load runtime configuration from `~/.youmind/`.
