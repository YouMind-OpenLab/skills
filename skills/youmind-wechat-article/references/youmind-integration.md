# YouMind Integration Guide

> YouMind is the user's personal knowledge base. It stores saved articles, research notes, documents,
> and highlights. This skill integrates with YouMind to mine materials for writing, search for context,
> and archive published articles. For full API details, see the OpenAPI reference at the end of this file.

---

## When to Use YouMind

**Trigger conditions** — any of these means you should check YouMind:

| User says | Action |
|-----------|--------|
| "Search my materials" / "What do I have about X?" | `search` the knowledge base |
| "Use my notes to write" / "Based on this doc" | `get-material` or `get-craft` to read full content, use as primary source |
| "What boards do I have?" / "Show my knowledge base" | `list-boards` |
| "Save this article to YouMind" | `save-article` to a specific board |
| "Find something I saved about X" | `search` with relevant keywords |
| "Look up recent news about X" | `web-search` with freshness filter |
| Any writing task with YouMind configured | Automatic: `mine-topics` in Step 1.5 |

---

## Integration Points in the Pipeline

### Step 1.5 — Knowledge Mining (Automatic)

When `config.yaml` has `youmind.api_key` and the client's `style.yaml` has `youmind.source_boards`:

```bash
node dist/youmind-api.js mine-topics "{topics_csv}" --board "{board_id}" --top-k 10
```

This searches the user's knowledge base for materials related to the client's topic areas. Results become `knowledge_context` used in topic scoring (+1 boost) and as source material during writing.

### Step 4 — Deep Reading for Writing

When `knowledge_context` contains relevant items, read the full content:

```bash
node dist/youmind-api.js get-material "{id}"   # For saved articles/snips
node dist/youmind-api.js get-craft "{id}"       # For documents/crafts
```

Use retrieved content as SOURCE MATERIAL — extract facts, unique perspectives, data points. Attribute naturally. This is the primary mechanism for adding depth that comes from the user's own accumulated expertise.

### Step 7.5b — Archiving

After publishing, save the article back to YouMind:

```bash
node dist/youmind-api.js save-article "{board_id}" --title "{title}" --file "{path}"
```

This creates a feedback loop: published articles become future reference material.

### Ad-hoc — Search and Browse

```bash
node dist/youmind-api.js search "{query}" --top-k 10
node dist/youmind-api.js web-search "{query}" --freshness day
node dist/youmind-api.js list-boards
node dist/youmind-api.js list-materials "{board_id}"
node dist/youmind-api.js list-crafts "{board_id}"
```

---

## Advanced Integration Scenarios

These go beyond what the toolkit CLI wraps. For these, call the YouMind OpenAPI directly using `curl` or equivalent.

### 1. Create a research board for a new client

When onboarding a new client, create a dedicated YouMind board to collect their materials:

```bash
curl -X POST https://youmind.com/openapi/v1/createBoard \
  -H "Content-Type: application/json" \
  -H "x-api-key: {api_key}" \
  -d '{"name": "WeChat - {client_name}"}'
```

Save the returned `id` to `style.yaml` → `youmind.source_boards`.

### 2. Save web references as research material

When finding useful sources during writing research, clip them to the knowledge base:

```bash
curl -X POST https://youmind.com/openapi/v1/createMaterialByUrl \
  -H "Content-Type: application/json" \
  -H "x-api-key: {api_key}" \
  -d '{"url": "{source_url}", "board_id": "{board_id}"}'
```

### 3. Create a document from the article Markdown

For a richer archive than `save-article` (which uses plain text), use the Markdown-native endpoint:

```bash
curl -X POST https://youmind.com/openapi/v1/createDocumentByMarkdown \
  -H "Content-Type: application/json" \
  -H "x-api-key: {api_key}" \
  -d '{"board_id": "{board_id}", "title": "{title}", "content": "{markdown_content}"}'
```

### 4. Create quick notes during research

Save fleeting ideas, interesting data points, or article seeds as notes:

```bash
curl -X POST https://youmind.com/openapi/v1/createNote \
  -H "Content-Type: application/json" \
  -H "x-api-key: {api_key}" \
  -d '{"content": "{note_text}", "board_id": "{board_id}", "gen_title": true}'
```

### 5. Semantic search with filters

For targeted research — search only within specific boards, content types, or time ranges:

```bash
curl -X POST https://youmind.com/openapi/v1/search \
  -H "Content-Type: application/json" \
  -H "x-api-key: {api_key}" \
  -d '{
    "query": "{search_query}",
    "top_k": 10,
    "filter_types": ["article", "page"],
    "filter_source_ids": ["{board_id}"],
    "filter_updated_at": {"from": {unix_ms_30_days_ago}}
  }'
```

### 6. AI-powered analysis via Chat API

For complex analysis tasks (summarize a board, compare materials, extract themes):

```bash
curl -X POST https://youmind.com/openapi/v1/createChat \
  -H "Content-Type: application/json" \
  -H "x-api-key: {api_key}" \
  -d '{
    "message": "Summarize the key themes across all materials in this board",
    "at_references": [{"type": "board", "id": "{board_id}"}]
  }'
```

The Chat API has access to all YouMind AI tools including image generation (Nano Banana Pro), web search, and knowledge base search — all invoked automatically based on the message content.

### 7. Scheduled content automation

Create recurring tasks that run on a schedule (e.g., weekly digest of new materials):

```bash
curl -X POST https://youmind.com/openapi/v1/createScheduledTask \
  -H "Content-Type: application/json" \
  -H "x-api-key: {api_key}" \
  -d '{
    "board_id": "{board_id}",
    "name": "Weekly content digest",
    "trigger_config": {
      "schedule_type": "interval",
      "interval_value": 1,
      "interval_unit": "week",
      "repeat_days": [1],
      "at_time": "09:00",
      "timezone": "Asia/Shanghai"
    },
    "action_config": {
      "prompt": "Summarize all new materials added this week and suggest 3 article topics"
    }
  }'
```

---

## Configuration

In `config.yaml`:

```yaml
youmind:
  api_key: "sk-ym-xxxxxxxxxxxxxxxxxxxx"   # Required for all YouMind features
  base_url: "https://youmind.com"     # Optional, defaults to this
```

In `clients/{client}/style.yaml`:

```yaml
youmind:
  source_boards: ["board-uuid-1"]    # Boards to search for writing material
  save_board: "board-uuid-2"         # Board to archive published articles to
```

---

## API Authentication

All requests require an API key via either header:

- `x-api-key: sk-ym-xxxxxxxxxxxxxxxxxxxx` (recommended)
- `Authorization: Bearer sk-ym-xxxxxxxxxxxxxxxxxxxx`

Base URL: `https://youmind.com/openapi/v1/`

All endpoints use `POST` with `Content-Type: application/json`.

---

## OpenAPI Reference — Full Endpoint List

For complete request/response schemas, see `{skill_dir}/references/openapi-document.md`.

| # | Endpoint | Description |
|---|----------|-------------|
| 1 | `createBoard` | Create a board |
| 2 | `listBoards` | List all boards |
| 3 | `getBoard` | Get a board by ID |
| 4 | `getDefaultBoard` | Get the default (Unsorted) board |
| 5 | `updateBoard` | Update a board |
| 6 | `trashBoard` | Move a board to trash |
| 7 | `moveMaterials` | Batch move materials between boards |
| 8 | `createMaterialByUrl` | Create a material from URL (web clip) |
| 9 | `getMaterial` | Get a material by ID |
| 10 | `listMaterials` | List materials in a board |
| 11 | `trashMaterial` | Move a material to trash |
| 12 | `publishMaterial` | Publish a material (generate share link) |
| 13 | `createDocument` | Create a document |
| 14 | `createDocumentByMarkdown` | Create a document from Markdown |
| 15 | `updateDocument` | Update a document |
| 16 | `createSlides` | Create a slides deck |
| 17 | `updateSlides` | Update slides |
| 18 | `getCraft` | Get a craft (document/slides/group) |
| 19 | `listCrafts` | List crafts in a board |
| 20 | `publishCraft` | Publish a craft (generate share link) |
| 21 | `moveCrafts` | Batch move crafts |
| 22 | `trashCraft` | Move a craft to trash |
| 23 | `createNote` | Create a quick note |
| 24 | `updateNote` | Update a note |
| 25 | `createPick` | Create a highlight/excerpt |
| 26 | `updatePick` | Update a pick |
| 27 | `trashPick` | Move a pick to trash |
| 28 | `createMaterialGroup` | Create a material group |
| 29 | `updateMaterialGroup` | Update a material group |
| 30 | `ungroupMaterialGroup` | Dissolve a material group |
| 31 | `createCraftGroup` | Create a craft group |
| 32 | `updateCraftGroup` | Update a craft group |
| 33 | `ungroupCraftGroup` | Dissolve a craft group |
| 34 | `createChat` | Create a chat (AI conversation) |
| 35 | `sendMessage` | Send a message in an existing chat |
| 36 | `listChats` | List chats |
| 37 | `getChat` | Get a chat |
| 38 | `listMessages` | List messages in a chat |
| 39 | `createSkill` | Create a reusable AI skill |
| 40 | `getSkill` | Get a skill |
| 41 | `updateSkill` | Update a skill |
| 42 | `installSkill` | Install a public skill |
| 43 | `trashSkill` | Remove a skill |
| 44 | `search` | Semantic search across knowledge base |
| 45 | `webSearch` | Internet search with freshness filter |
| 46 | `createScheduledTask` | Create a recurring automated task |
| 47 | `updateScheduledTask` | Update a scheduled task |
| 48 | `getScheduledTask` | Get a scheduled task with run history |
| 49 | `trashScheduledTask` | Remove a scheduled task |
| 50 | `listScheduledTasks` | List all scheduled tasks |
| 51 | `chat/anthropic/v1/messages` | Anthropic API relay (LLM proxy) |
| 52 | `chat/openai/v1/chat/completions` | OpenAI API relay (LLM proxy) |
