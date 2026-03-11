# Setup

## Installation

Install the YouMind CLI (lightweight, zero dependencies):

```bash
npm install -g @youmind-ai/cli
```

Verify: `youmind --help`

If not found, install it first before proceeding.

## Authentication

Check if `YOUMIND_API_KEY` is already set in the environment. If yes, proceed.

If not set, ask the user to provide their YouMind API key. **Do NOT show `export` commands** — most users don't know what that means. Instead:

1. Ask: "Please provide your YouMind API key. Don't have one? Get a free key at https://youmind.com/settings/api-keys"
2. Once the user gives the key, the agent sets it: `export YOUMIND_API_KEY=<key the user provided>`
3. Proceed with the workflow

The user should only need to paste the key — the agent handles the rest.
