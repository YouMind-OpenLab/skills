---
name: youmind
description: Use this skill when working with YouMind through the official YouMind CLI and API. Trigger it for YouMind boards, notes, crafts, picks, materials, chats, documents, slides, skills, scheduled tasks, board content management, API discovery, schema inspection, or direct YouMind operations from OpenClaw. Especially relevant when the user wants to list or create boards, create notes, add URL materials, inspect board content, create documents or slides, interact with chats, manage YouMind skills, manage scheduled tasks, discover the correct API for a task, or call YouMind APIs safely.
---

# YouMind CLI Skill

Use the official `youmind` CLI as the default interface to YouMind.

This skill is optimized for OpenClaw usage, so it should help with both:

- discovering what YouMind APIs exist
- directly executing common YouMind tasks

## Runtime assumptions

- Prefer the official CLI over older custom local wrappers.
- The CLI is installed at `~/.local/bin/youmind` in this environment.
- If `youmind` is not in PATH, use:

```bash
export PATH="$HOME/.local/bin:$PATH"
```

- Authenticate with `YOUMIND_API_KEY` or `--api-key`.
- Prefer read-first exploration before writes when the exact API is not already known.

## Current local status

This environment has already been validated.

Installed CLI:

```bash
npm install -g @youmind-ai/cli --prefix "$HOME/.local"
```

Verified working commands:

- `youmind search`
- `youmind info`
- `youmind call`

Verified working APIs in this workspace:

- `createBoard`
- `getBoard`
- `createNote`
- `createMaterialByUrl`
- `listMaterials`

Known APIs discovered from the installed CLI include:

- Boards: `listBoards`, `getBoard`, `createBoard`, `updateBoard`, `trashBoard`, `getDefaultBoard`
- Notes: `createNote`, `updateNote`
- Materials: `createMaterialByUrl`, `getMaterial`, `listMaterials`, `moveMaterials`, `trashMaterial`, `publishMaterial`, `createMaterialGroup`, `updateMaterialGroup`, `ungroupMaterialGroup`
- Crafts: `listCrafts`, `getCraft`, `publishCraft`, `trashCraft`, `createCraftGroup`, `updateCraftGroup`, `ungroupCraftGroup`, `moveCrafts`
- Picks: `createPick`, `updatePick`, `trashPick`
- Documents: `createDocument`, `createDocumentByMarkdown`, `updateDocument`
- Slides: `createSlides`, `updateSlides`
- Chats: `createChat`, `sendMessage`, `listChats`, `getChat`, `listMessages`
- Skills: `createSkill`, `getSkill`, `updateSkill`, `installSkill`, `trashSkill`
- Search: `search`, `webSearch`
- Scheduled tasks: `createScheduledTask`, `updateScheduledTask`, `trashScheduledTask`, `getScheduledTask`, `listScheduledTasks`

## Core workflow

Use this three-step pattern when the exact API is unclear:

1. Search for a relevant API
2. Inspect the schema
3. Execute the API call

Example:

```bash
export PATH="$HOME/.local/bin:$PATH"
export YOUMIND_API_KEY="..."
youmind search board
youmind info createBoard
youmind call createBoard '{"name":"Research Notes"}'
```

If the exact API is already known and simple, it is fine to call it directly.

## Command reference

### Search available APIs

```bash
youmind search [query]
```

Use this to discover endpoint names by keyword.

Examples:

```bash
youmind search
youmind search board
youmind search note
youmind search material
youmind search craft
youmind search pick
youmind search document
youmind search slides
youmind search chat
youmind search skill
youmind search scheduled
```

### Inspect API schema

```bash
youmind info <apiName>
```

Use this before writes or whenever required fields are uncertain.

Examples:

```bash
youmind info createBoard
youmind info createNote
youmind info createMaterialByUrl
youmind info createDocumentByMarkdown
youmind info createSlides
youmind info createChat
```

### Execute an API call

```bash
youmind call <apiName> [params]
```

Supported parameter styles:

```bash
# Key-value pairs
youmind call createBoard --name "My Board"

# JSON string
youmind call createBoard '{"name":"My Board"}'

# Stdin JSON
echo '{"name":"My Board"}' | youmind call createBoard
```

## Functional index

Use this section as a quick task-to-CLI map.

### 1. Boards

Typical tasks:

- list boards
- get board details
- create a board
- update a board
- trash a board
- get default board

Discovery commands:

```bash
youmind search board
```

Common board APIs:

```bash
youmind info listBoards
youmind info getBoard
youmind info createBoard
youmind info updateBoard
youmind info trashBoard
youmind info getDefaultBoard
```

Examples:

```bash
youmind call createBoard '{"name":"My Board"}'
youmind call getBoard '{"id":"<board-id>"}'
```

### 2. Notes

Typical tasks:

- create a note
- update a note
- attach note to a board

Discovery commands:

```bash
youmind search note
```

Known note APIs:

```bash
youmind info createNote
youmind info updateNote
```

Examples:

```bash
youmind call createNote '{"content":"hello"}'
youmind call createNote '{"boardId":"<board-id>","title":"My Note","content":"hello","genTitle":false}'
```

Notes:

- `content` is required.
- `boardId` is optional if the note should live inside a board.
- `genTitle` can be used for AI-generated titles.
- `createNote` has been verified working.

### 3. Materials

Typical tasks:

- add a URL as material
- inspect a material
- list materials in a board
- group or move materials
- trash or publish materials

Discovery commands:

```bash
youmind search material
```

Known material APIs:

```bash
youmind info createMaterialByUrl
youmind info getMaterial
youmind info listMaterials
youmind info createMaterialGroup
youmind info updateMaterialGroup
youmind info ungroupMaterialGroup
youmind info moveMaterials
youmind info trashMaterial
youmind info publishMaterial
```

Examples:

```bash
youmind call createMaterialByUrl '{"boardId":"<board-id>","url":"https://example.com"}'
youmind call listMaterials '{"boardId":"<board-id>"}'
```

Notes:

- URL material creation has been verified working.
- A newly created web material may initially appear with a status like `fetching`.
- `listMaterials` has been verified working.
- `listMaterials` returns both materials and related board content entities in the board listing model.
- No local file upload API has been discovered in the current official CLI surface. Searches for `file`, `upload`, `pdf`, and `office` returned no file-upload endpoint.

### 4. Crafts

Typical tasks:

- list crafts in a board
- inspect craft details
- publish or trash crafts
- group or move crafts

Discovery commands:

```bash
youmind search craft
```

Known craft APIs:

```bash
youmind info listCrafts
youmind info getCraft
youmind info publishCraft
youmind info trashCraft
youmind info createCraftGroup
youmind info updateCraftGroup
youmind info ungroupCraftGroup
youmind info moveCrafts
```

When handling a craft request, search first if the exact API is not already obvious.

### 5. Picks

Typical tasks:

- create a pick
- update a pick
- trash a pick

Discovery commands:

```bash
youmind search pick
```

Known pick APIs:

```bash
youmind info createPick
youmind info updatePick
youmind info trashPick
```

### 6. Documents

Typical tasks:

- create a document
- create a document from Markdown
- update a document

Discovery commands:

```bash
youmind search document
```

Known document APIs:

```bash
youmind info createDocument
youmind info createDocumentByMarkdown
youmind info updateDocument
```

Use `createDocumentByMarkdown` when the user already has markdown content and wants a document quickly.

### 7. Slides

Typical tasks:

- create slides
- update slides

Discovery commands:

```bash
youmind search slides
```

Known slide APIs:

```bash
youmind info createSlides
youmind info updateSlides
```

### 8. Chats

Typical tasks:

- create a chat
- send a follow-up message
- list chats
- inspect a chat
- read messages

Discovery commands:

```bash
youmind search chat
youmind search message
```

Known chat APIs:

```bash
youmind info createChat
youmind info sendMessage
youmind info listChats
youmind info getChat
youmind info listMessages
```

### 9. Skills

Typical tasks:

- create a skill in YouMind
- inspect a skill
- update a skill
- install a skill
- uninstall or trash a skill

Discovery commands:

```bash
youmind search skill
```

Known skill APIs:

```bash
youmind info createSkill
youmind info getSkill
youmind info updateSkill
youmind info installSkill
youmind info trashSkill
```

### 10. Scheduled tasks

Typical tasks:

- create a scheduled task
- update a scheduled task
- list scheduled tasks
- get a scheduled task
- trash a scheduled task

Discovery commands:

```bash
youmind search scheduled
youmind search task
```

Known scheduled-task APIs:

```bash
youmind info createScheduledTask
youmind info updateScheduledTask
youmind info trashScheduledTask
youmind info getScheduledTask
youmind info listScheduledTasks
```

### 11. Search and research

Typical tasks:

- semantic search across a board or library
- web search for fresh external information

Known search APIs:

```bash
youmind info search
youmind info webSearch
```

### 12. General library or unknown tasks

If the user asks for a YouMind action but the API name is unknown, start from keyword discovery.

Examples:

```bash
youmind search library
youmind search content
youmind search board
youmind search note
youmind search material
youmind search document
```

Then inspect with `youmind info <apiName>` before calling.

## Recommended operating patterns

### Safe read-first pattern

For unfamiliar or risky tasks:

```bash
youmind search <keyword>
youmind info <apiName>
youmind call <readApi> '{...}'
```

Only perform writes after understanding the schema.

### Fast path for common operations

When the API is already known and low risk, call it directly.

Examples:

```bash
youmind call getBoard '{"id":"<board-id>"}'
youmind call createNote '{"boardId":"<board-id>","content":"..."}'
youmind call listMaterials '{"boardId":"<board-id>"}'
```

### Destructive actions

Before operations like `trashBoard`, `trashMaterial`, `trashPick`, `trashCraft`, or `trashSkill`, confirm with the user unless they were already explicit.

## Authentication

Preferred local shell style:

```bash
export YOUMIND_API_KEY="sk-ym-..."
```

Or pass directly:

```bash
youmind --api-key "sk-ym-..." search board
```

Prefer environment variables in shell sessions to reduce accidental key exposure in repeated commands.

## Global options

```text
--api-key <key>    API key
--base-url <url>   API endpoint, default https://youmind.com
```

## OpenClaw usage guidance

- If the task is known and already covered by a verified API, call it directly.
- If the task is ambiguous, start with `youmind search`.
- Before non-trivial writes, use `youmind info`.
- Summarize discovered API options briefly before executing if there is any ambiguity.
- Prefer the official CLI over the archived older wrapper implementation.
- Treat local file upload as unsupported unless the official CLI later exposes a file-upload API.

## Archived older implementation

An older custom local implementation was retained only as backup/reference:

```text
skills/youmind-skill.backup-20260413-1432/
```

Do not use it as the default path unless there is a specific migration or comparison reason.
