---
name: youmind
description: This skill should be used when interacting with the YouMind API to manage content such as boards, crafts, notes, picks, and materials. It provides installation and usage instructions for the youmind CLI, which enables searching, inspecting, and calling YouMind's OpenAPI endpoints.
allowed-tools:
  - Bash(youmind *)
  - Bash(YOUMIND_API_KEY=* youmind *)
  - Bash(npm install -g @youmind-ai/cli)
---

# YouMind CLI Skill

Interact with the YouMind API to manage boards, crafts, notes, picks, and other content through the `youmind` CLI.

## Installation

```bash
npm install -g @youmind-ai/cli
```

To verify installation: `youmind` (should print usage info).

If the command is not found, install it first before proceeding.

## Authentication

Set the API key as environment variable:

```bash
export YOUMIND_API_KEY=sk-ym-xxx
```

Or pass per-command with `--api-key sk-ym-xxx`.

## Commands

Three commands following a discover → inspect → execute workflow:

### 1. Search — Discover Available APIs

```bash
youmind search [query]
```

- Without query: list all available API endpoints
- With query: filter APIs by name or description (e.g., `search board`, `search craft`)
- Output: JSON array of `{ name, summary }` objects

### 2. Info — Inspect API Schema

```bash
youmind info <name>
```

- Returns the full schema including request body and response schema
- All `$ref` references are resolved inline
- Use this to understand required parameters before calling an API

### 3. Call — Execute an API

```bash
youmind call <name> [params]
```

Requires authentication. Three ways to pass parameters:

```bash
# Key-value pairs
youmind call createBoard --name "My Board"

# JSON string
youmind call createBoard '{"name":"My Board"}'

# Stdin pipe
echo '{"name":"My Board"}' | youmind call createBoard
```

## Workflow

To accomplish a task with the YouMind API:

1. **Search** for relevant APIs: `youmind search <keyword>`
2. **Inspect** the API schema: `youmind info <apiName>`
3. **Call** the API with correct parameters: `youmind call <apiName> [params]`

### Example: Create a board and add a note

```bash
# Find board-related APIs
youmind search board

# Check createBoard schema
youmind info createBoard

# Create the board
youmind call createBoard --name "Research Notes"

# Find note APIs and create a note
youmind search note
youmind info createNote
youmind call createNote '{"title":"First Note","boardId":"..."}'
```

## Global Options

| Option | Description |
|--------|-------------|
| `--api-key <key>` | API key (overrides `YOUMIND_API_KEY` env var) |
| `--endpoint <url>` | API endpoint (default: `https://api.youmind.com`) |
