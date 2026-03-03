---
name: youmind
description: This skill should be used when interacting with the YouMind API to manage content such as boards, crafts, notes, picks, and materials. It provides installation and usage instructions for the youmind CLI, which enables searching, inspecting, and calling YouMind's OpenAPI endpoints.
allowed-tools:
  - Bash(npx @youmind-ai/cli *)
  - Bash(YOUMIND_API_KEY=* npx @youmind-ai/cli *)
---

# YouMind CLI Skill

Interact with the YouMind API to manage boards, crafts, notes, picks, and other content through the `youmind` CLI.

## Prerequisites

1. **Node.js** (v18+) installed
2. **API Key** available — set as `YOUMIND_API_KEY` environment variable or pass via `--api-key`

No global installation required. All commands use `npx` for zero-install execution.

## Installation (Optional)

To install globally for faster repeated execution:

```bash
npm install -g @youmind-ai/cli
```

After global install, run `youmind <command>` instead of `npx @youmind-ai/cli <command>`.

## Commands

Three commands following a discover → inspect → execute workflow:

### 1. Search — Discover Available APIs

```bash
npx @youmind-ai/cli search [query]
```

- Without query: list all available API endpoints
- With query: filter APIs by name or description (e.g., `search board`, `search craft`)
- Output: JSON array of `{ name, summary }` objects

### 2. Info — Inspect API Schema

```bash
npx @youmind-ai/cli info <name>
```

- Returns the full schema including request body and response schema
- All `$ref` references are resolved inline
- Use this to understand required parameters before calling an API

### 3. Call — Execute an API

```bash
npx @youmind-ai/cli call <name> [params]
```

Requires authentication. Three ways to pass parameters:

```bash
# Key-value pairs
npx @youmind-ai/cli call createBoard --name "My Board"

# JSON string
npx @youmind-ai/cli call createBoard '{"name":"My Board"}'

# Stdin pipe
echo '{"name":"My Board"}' | npx @youmind-ai/cli call createBoard
```

## Authentication

Set the API key via environment variable (recommended):

```bash
export YOUMIND_API_KEY=sk-ym-xxx
```

Or pass per-command:

```bash
npx @youmind-ai/cli call createBoard --api-key sk-ym-xxx --name "My Board"
```

## Workflow

To accomplish a task with the YouMind API:

1. **Search** for relevant APIs: `npx @youmind-ai/cli search <keyword>`
2. **Inspect** the API schema: `npx @youmind-ai/cli info <apiName>`
3. **Call** the API with correct parameters: `npx @youmind-ai/cli call <apiName> [params]`

### Example: Create a board and add a note

```bash
# Find board-related APIs
npx @youmind-ai/cli search board

# Check createBoard schema
npx @youmind-ai/cli info createBoard

# Create the board
npx @youmind-ai/cli call createBoard --name "Research Notes"

# Find note APIs and create a note
npx @youmind-ai/cli search note
npx @youmind-ai/cli info createNote
npx @youmind-ai/cli call createNote '{"title":"First Note","boardId":"..."}'
```

## Global Options

| Option | Description |
|--------|-------------|
| `--api-key <key>` | API key (overrides `YOUMIND_API_KEY` env var) |
| `--endpoint <url>` | API endpoint (default: `https://api.youmind.com`) |
