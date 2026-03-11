# Setup

## Installation

Install the YouMind CLI (lightweight, zero dependencies):

```bash
npm install -g @youmind-ai/cli
```

Verify: `youmind --help`

If not found, install it first before proceeding.

## Authentication

Check if `YOUMIND_API_KEY` is already set in the environment:

```bash
echo $YOUMIND_API_KEY
```

If set, proceed to the workflow.

If not set, tell the user to configure it themselves (do NOT ask them to paste the key in chat):

> "You need a YouMind API key. Get one free at https://youmind.com/settings/api-keys then set it in your environment:
>
> `export YOUMIND_API_KEY=sk-ym-your-key-here`
>
> Or add it to your `.env` file. Let me know when it's ready!"

Wait for confirmation, then verify with `echo $YOUMIND_API_KEY` before proceeding.
