---
name: youmind
version: 3.1.0
description: Use this skill when the task is clearly connected to the user's YouMind workspace, YouMind APIs, or the youmind CLI. It helps agents search, inspect, and call YouMind OpenAPI endpoints to work with boards, groups, YouMind files, picks, chats, and YouMind skills.
allowed-tools:
  - Bash(command -v youmind)
  - Bash(test -n "$YOUMIND_API_KEY")
  - Bash(youmind *)
  - Bash(npm install -g @youmind-ai/cli)
---

# YouMind

YouMind is an AI creative workspace. People save webpages, PDFs, videos, podcasts, notes, and generated assets into boards, then use AI to search, organize, write, and publish from that workspace.

Use this skill when the task is clearly connected to the user's YouMind workspace, YouMind APIs, or the `youmind` CLI.

## Use When

Use this skill when the user wants to:
- work with a YouMind board, group, file, pick, chat, or skill
- search or use their YouMind library as context
- save a URL, document, generated asset, or result into YouMind
- create, update, move, publish, restore, or trash content in YouMind
- run or manage a YouMind skill
- call YouMind OpenAPI through the `youmind` CLI

## Vocabulary

- YouMind board: a workspace container.
- YouMind group: a folder inside a board.
- YouMind file: a content item inside a board, such as a document, webpage, PDF, image, audio, video, or generated artifact.
- Pick: a saved excerpt or highlight.
- Chat: an AI task or conversation in YouMind.
- Skill: a reusable YouMind capability that can be run through chat.

## Setup

Check whether the CLI is installed:

```bash
command -v youmind
```

If missing, install it:

```bash
npm install -g @youmind-ai/cli
```

Check whether authentication is configured:

```bash
test -n "$YOUMIND_API_KEY"
```

If missing, ask the human to create an API key at:

https://youmind.com/settings/api-keys

Then ask them to set it as an environment variable:

```bash
export YOUMIND_API_KEY=sk-ym-...
```

Do not ask the human to paste the API key into a `youmind` command. The CLI should read it from `YOUMIND_API_KEY`.

## Workflow

Use discover -> inspect -> call:

```bash
youmind search <keyword>
youmind info <apiName>
youmind call <apiName> '<json>'
```

Rules:
- Use `youmind search` before guessing API names.
- Use `youmind info` before calling an API you have not recently inspected.
- Pass JSON for non-trivial arguments.
- Use returned ids for follow-up calls.
- Share internal ids only when they are useful for the user's next step.

## Common Operations

Useful API names include:

- Boards: `listBoards`, `getDefaultBoard`, `getBoard`, `createBoard`, `updateBoard`, `trashBoard`
- YouMind files: `listFiles`, `getFile`, `createFileByUrl`, `createDocument`, `updateDocument`, `moveFiles`, `trashFile`, `restoreFromTrash`, `publishFile`
- Groups: `createGroup`, `updateGroup`, `ungroupGroup`
- Picks: `createPick`, `updatePick`, `trashPick`
- Search: `search`, `webSearch`
- Chats and skills: `createChat`, `listMessages`, `createSkill`, `installSkill`

## Side Effects

For actions that change the workspace or publish externally, make sure the user's intent is clear before calling the API.

This includes trashing, moving, publishing, restoring, installing skills, or any paid action.

Only say something was saved, published, installed, moved, or deleted after the CLI call succeeds. If a call fails, report the error clearly.
