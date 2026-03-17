# Setup

## Installation

Install the YouMind CLI (lightweight, zero dependencies):

```bash
npm install -g @youmind-ai/cli
```

Verify: `youmind --help`

If not found, install it first before proceeding.

## Authentication

Check if `YOUMIND_API_KEY` is already set (without exposing the value):

```bash
[ -n "$YOUMIND_API_KEY" ] && echo "YOUMIND_API_KEY is set" || echo "YOUMIND_API_KEY is not set"
```

If set, proceed to the workflow.

If not set, guide the user to configure it themselves. **Do NOT ask the user to paste the key in chat — it would be exposed in chat history.**

Tell the user (in their language):

> "You need a YouMind API key to use this skill.
>
> 1. Get your free key at: https://youmind.com/settings/api-keys
> 2. Add it to your config — see the skill page for setup instructions.
>
> Let me know when you've set it up!"

Wait for confirmation, then verify again before proceeding.
