# YouMind OpenAPI Documentation

> **For this skill (youmind-wechat-article)**, the relevant sections are: **Board**, **Material**, **Document/Craft**, **Note**, **Search**, **Web Search**, and **Chat**. Other sections (Pick, Material Group, Craft Group, Skill, Scheduled Task, Relay) are included for completeness but not used by the WeChat article pipeline. For quick API lookups, prefer `youmind search` / `youmind info <api>` over reading this file.

YouMind OpenAPI 是面向第三方开发者的 API 接口，允许通过 API Key 访问 YouMind 的核心能力，包括知识库管理、AI 对话、语义搜索、定时任务等。

---

## Table of Contents

- [Authentication](#authentication)
- [Base URL](#base-url)
- [Request & Response Convention](#request--response-convention)
- [Content Field Convention](#content-field-convention)
- [API Reference](#api-reference)
  - [Board (Board Management)](#1-board-board-management)
  - [Material (Material Management)](#2-material-material-management)
  - [Document / Craft (Document Management)](#3-document--craft-document-management)
  - [Note (Note Management)](#4-note-note-management)
  - [Pick (Highlight Management)](#5-pick-highlight-management)
  - [Material Group (Material Group Management)](#6-material-group-material-group-management)
  - [Craft Group (Craft Group Management)](#7-craft-group-craft-group-management)
  - [Chat (AI Chat)](#8-chat-ai-chat)
  - [Skill (Skill Management)](#9-skill-skill-management)
  - [Search (Semantic Search)](#10-search-semantic-search)
  - [Web Search (Internet Search)](#11-web-search-internet-search)
  - [Scheduled Task (Scheduled Task Management)](#12-scheduled-task-scheduled-task-management)
  - [Relay (LLM API Relay)](#13-relay-llm-api-relay)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)

---

## Authentication

所有 OpenAPI 接口均需要通过 **API Key** 进行身份认证。

### 获取 API Key

通过 YouMind 客户端的 Settings 页面创建 API Key，创建后会返回完整的 Key（仅展示一次），格式为：

```
sk-ym-xxxxxxxxxxxxxxxxxxxx
```

### 使用方式

**方式 1：`x-api-key` Header（推荐）**

```bash
curl -X POST https://youmind.com/openapi/v1/listBoards \
  -H "Content-Type: application/json" \
  -H "x-api-key: sk-ym-your-api-key" \
  -d '{}'
```

**方式 2：`Authorization: Bearer` Header**

```bash
curl -X POST https://youmind.com/openapi/v1/listBoards \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-ym-your-api-key" \
  -d '{}'
```

> Note: Only API Keys with the `sk-ym-` prefix are supported via Bearer token.

---

## Base URL

```
https://youmind.com
```

All endpoints are prefixed with `/openapi/v1/`.

---

## Request & Response Convention

- **HTTP Method**: All endpoints use `POST`
- **Content-Type**: `application/json`
- **Response Status**: All successful responses return HTTP `200`
- **Response Format**: JSON, all field names are in `snake_case`
- **Error Format**: Standard HTTP error codes with JSON error body

---

## Content Field Convention

For endpoints that involve rich content fields (e.g., Note content, Document content), the OpenAPI interface simplifies the content format:

- **Request**: Send content as a plain **string** (plain text or Markdown)
- **Response**: Content is returned as a plain **string**

The system automatically handles the internal conversion between plain text and the rich content format used internally.

This applies to the following fields:

- Note `content`
- Document/Page `content`
- Webpage `content`

---

## API Reference

### 1. Board (Board Management)

Board is the top-level container for organizing materials, documents, and notes.

---

#### `POST /openapi/v1/createBoard`

Create a new board.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Board name |
| `icon` | object | No | Board icon (`{ name: string, color: string }`) |
| `parent_board_group_id` | string (UUID) | No | Parent board group ID |

**Response:** `BoardDto`

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Board ID |
| `name` | string | Board name |
| `icon` | object | Board icon |
| `type` | string | Board type |
| `status` | string | Board status |
| `visibility` | string | Visibility (e.g., `"visible"`) |
| `space_id` | string | Space ID |
| `creator_id` | string | Creator user ID |
| `created_at` | string (ISO 8601) | Creation timestamp |
| `updated_at` | string (ISO 8601) | Last update timestamp |
| `position` | object | Position info within board list |
| `metadata` | object | Board metadata |

**Example:**

```bash
curl -X POST https://youmind.com/openapi/v1/createBoard \
  -H "Content-Type: application/json" \
  -H "x-api-key: sk-ym-your-api-key" \
  -d '{
    "name": "My Research Board"
  }'
```

---

#### `POST /openapi/v1/listBoards`

List all boards for the current user.

**Request Body:** Empty `{}`

**Response:** `BoardWithCountDto[]`

Returns an array of `BoardDto` objects, each with an additional `count` field representing the number of items in the board.

---

#### `POST /openapi/v1/getBoard`

Get a specific board by ID.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string (UUID) | Yes | Board ID |

**Response:** `BoardDto`

---

#### `POST /openapi/v1/getDefaultBoard`

Get the default (Unsorted) board.

**Request Body:** Empty `{}`

**Response:** `BoardDto`

---

#### `POST /openapi/v1/updateBoard`

Update a board.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string (UUID) | Yes | Board ID |
| `name` | string | No | New board name |
| `icon` | object | No | New board icon |

**Response:** `BoardDto`

---

#### `POST /openapi/v1/trashBoard`

Move a board to trash.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string (UUID) | Yes | Board ID |

**Response:**

| Field | Type | Description |
|-------|------|-------------|
| `trash_item_ids` | string[] | Trash item IDs (for undo) |

---

#### `POST /openapi/v1/moveMaterials`

Batch move materials to different boards or groups.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `items` | array | Yes | Array of materials to move (min 1) |

Each item in `items`:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string (UUID) | Yes | Material ID |
| `board_id` | string | Yes | Target board ID, or `"unsorted"` for default board |
| `group_id` | string (UUID) | No | Target group ID within board |
| `insert_after_id` | string (UUID) | No | Insert after this material ID |

**Response:**

| Field | Type | Description |
|-------|------|-------------|
| `success_count` | number | Number of successfully moved materials |
| `failed_count` | number | Number of failed moves |
| `failures` | array | Details of failed moves (`[{ id, error }]`) |

---

### 2. Material (Material Management)

Material is a general term for items stored in a board, including snips (web clippings), notes, and board groups.

---

#### `POST /openapi/v1/createMaterialByUrl`

Create a material (snip) from a URL. Supports webpages, images, PDFs, audio, and video.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `url` | string (URL) | Yes | URL to create material from (e.g., `"https://example.com/article"`) |
| `board_id` | string (UUID) | No | Target board ID |
| `parent_board_group_id` | string (UUID) | No | Parent board group ID |
| `title` | string | No | Custom title override (max 2048 chars) |
| `album_url_for_voice_snip` | string (URL) | No | Album cover URL for voice/audio snips |

**Response:** One of the following types depending on the URL content:

- `ImageDto` - for image URLs
- `VoiceDto` - for audio URLs
- `PdfDto` - for PDF URLs
- `UnknownWebpageDto` - for general webpages

---

#### `POST /openapi/v1/getMaterial`

Get a specific material by ID.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string (UUID) | Yes | Material ID |

**Response:** `MaterialDto` (polymorphic: SnipDto / NoteDto / BoardGroupDto)

---

#### `POST /openapi/v1/listMaterials`

List materials in a specific board.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `board_id` | string (UUID) | Yes | Board ID |
| `group_id` | string (UUID) | No | Filter by specific group within board |

**Response:** `BoardItemDto[]` - Array of board items (materials and groups)

---

#### `POST /openapi/v1/trashMaterial`

Move a material to trash.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string (UUID) | Yes | Material ID |

**Response:**

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether the operation succeeded |

---

#### `POST /openapi/v1/publishMaterial`

Publish a material (snip or note) to make it publicly accessible and generate a share link.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string (UUID) | Yes | Material ID |
| `type` | string | Yes | Material type: `"snip"` or `"thought"` |

**Response:** `ShortLinkDto`

| Field | Type | Description |
|-------|------|-------------|
| `url` | string | Full share URL |
| `code` | string | Short link code |

---

### 3. Document / Craft (Document Management)

Documents (internally called "Craft / Page") are rich-text documents that can be created, edited, and published.

---

#### `POST /openapi/v1/createDocument`

Create a new document.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `board_id` | string (UUID) | Yes | Board ID |
| `title` | string | Yes | Document title (max 255 chars) |
| `content` | string | Yes | Document content (plain text or Markdown) |
| `style` | object | No | Page style configuration |
| `parent_craft_group_id` | string (UUID) | No | Parent craft group ID |

**Response:** `PageDto`

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Document ID |
| `title` | string | Document title |
| `content` | string | Document content (plain text) |
| `board_id` | string | Board ID |
| `space_id` | string | Space ID |
| `creator_id` | string | Creator user ID |
| `type` | string | Craft type |
| `visibility` | string | Visibility status |
| `status` | string \| null | Craft status |
| `rank` | string | Rank for ordering |
| `parent_id` | string \| null | Parent page ID |
| `root_id` | string | Root page ID |
| `style` | object \| null | Page style |
| `metadata` | object | Craft metadata |
| `parent_craft_group_id` | string \| null | Parent craft group ID |
| `created_at` | string (ISO 8601) | Creation timestamp |
| `updated_at` | string (ISO 8601) | Last update timestamp |

---

#### `POST /openapi/v1/createDocumentByMarkdown`

Create a document from Markdown content. The Markdown will be automatically converted to the internal rich-text format.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `board_id` | string (UUID) | Yes | Board ID |
| `title` | string | No | Document title (max 255 chars; auto-generated if omitted) |
| `content` | string | Yes | Markdown content |

**Response:** `PageDto` (same as `createDocument`)

**Example:**

```bash
curl -X POST https://youmind.com/openapi/v1/createDocumentByMarkdown \
  -H "Content-Type: application/json" \
  -H "x-api-key: sk-ym-your-api-key" \
  -d '{
    "board_id": "your-board-uuid",
    "title": "My Research Notes",
    "content": "# Introduction\n\nThis is a research note about..."
  }'
```

---

#### `POST /openapi/v1/updateDocument`

Update an existing document.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string (UUID) | Yes | Document (Page) ID |
| `title` | string | No | New title (max 255 chars) |
| `content` | string | No | New content (plain text or Markdown) |
| `style` | object | No | Page style |
| `metadata` | object | No | Page metadata |

**Response:** `PageDto`

---

#### `POST /openapi/v1/createSlides`

Create a slides deck in a board.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `board_id` | string (UUID) | Yes | Board ID |
| `title` | string | Yes | Slides title (max 255 chars) |
| `content` | string | Yes | Slides content (serialized JSON string of SlidesEditorDescriptor) |
| `parent_craft_group_id` | string (UUID) | No | Parent craft group ID |

**Response:** `SlidesDto`

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Slides ID |
| `title` | string | Slides title |
| `content` | string | Slides content |
| `board_id` | string | Board ID |
| `type` | string | Craft type (`"slides"`) |
| ... | | (inherits all CraftDto fields) |

---

#### `POST /openapi/v1/updateSlides`

Update an existing slides deck.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string (UUID) | Yes | Slides ID |
| `title` | string | No | New title (max 255 chars) |
| `content` | string | No | New slides content |
| `metadata` | object | No | Slides metadata |

**Response:** `SlidesDto`

---

#### `POST /openapi/v1/getCraft`

Get a specific craft (document or craft group).

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string (UUID) | Yes | Craft ID |

**Response:** `CraftDto`

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Craft ID |
| `title` | string | Title |
| `board_id` | string | Board ID |
| `space_id` | string | Space ID |
| `creator_id` | string | Creator user ID |
| `type` | string | Craft type (`"page"`, `"slides"`, `"craft_group"`, etc.) |
| `visibility` | string | Visibility status |
| `status` | string \| null | Craft status |
| `rank` | string | Rank for ordering |
| `metadata` | object | Craft metadata |
| `parent_craft_group_id` | string \| null | Parent craft group ID |
| `created_at` | string (ISO 8601) | Creation timestamp |
| `updated_at` | string (ISO 8601) | Last update timestamp |

---

#### `POST /openapi/v1/listCrafts`

List crafts (documents and craft groups) in a board.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `board_id` | string (UUID) | Yes | Board ID |
| `group_id` | string (UUID) | No | Filter by specific craft group |

**Response:** `CraftDto[]`

---

#### `POST /openapi/v1/publishCraft`

Publish a craft (make it publicly accessible via a short link).

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string (UUID) | Yes | Craft ID |

**Response:**

| Field | Type | Description |
|-------|------|-------------|
| `craft` | CraftDto | Published craft |
| `short_link` | object | Short link information (`{ url, code }`) |

---

#### `POST /openapi/v1/moveCrafts`

Batch move crafts to different boards or groups.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `items` | array | Yes | Array of crafts to move (min 1) |

Each item in `items`:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string (UUID) | Yes | Craft ID |
| `board_id` | string (UUID) | No | Target board ID |
| `group_id` | string (UUID) | No | Target craft group ID |
| `insert_after_id` | string (UUID) | No | Insert after this craft ID |

**Response:**

| Field | Type | Description |
|-------|------|-------------|
| `success_count` | number | Number of successfully moved crafts |
| `failed_count` | number | Number of failed moves |
| `failures` | array | Details of failed moves (`[{ id, error }]`) |

---

#### `POST /openapi/v1/trashCraft`

Move a craft (document, slides, webpage, etc.) to trash.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string (UUID) | Yes | Craft ID |

**Response:**

| Field | Type | Description |
|-------|------|-------------|
| `trash_item_id` | string | Trash item ID (for undo operations) |

---

### 4. Note (Note Management)

Notes are lightweight text entries for quick thoughts and ideas.

---

#### `POST /openapi/v1/createNote`

Create a new note.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `content` | string | Yes | Note content (plain text) |
| `title` | string | No | Note title (max 60 chars) |
| `board_id` | string (UUID) | No | Board ID to associate with |
| `parent_board_group_id` | string (UUID) | No | Parent board group ID |
| `gen_title` | boolean | No | Whether to auto-generate title via AI |

**Response:** `NoteDto`

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Note ID |
| `title` | string | Note title |
| `title_type` | string | Title type (`"manual"` or `"generated"`) |
| `content` | string | Note content (plain text) |
| `type` | string | Material type (`"NOTE"`) |
| `board_id` | string \| null | Board ID |
| `space_id` | string | Space ID |
| `creator_id` | string | Creator user ID |
| `visibility` | string | Visibility status |
| `position` | object | Position info within board |
| `metadata` | object \| null | Material metadata |
| `created_at` | string (ISO 8601) | Creation timestamp |
| `updated_at` | string (ISO 8601) | Last update timestamp |

**Example:**

```bash
curl -X POST https://youmind.com/openapi/v1/createNote \
  -H "Content-Type: application/json" \
  -H "x-api-key: sk-ym-your-api-key" \
  -d '{
    "content": "Remember to review the quarterly report",
    "board_id": "your-board-uuid",
    "gen_title": true
  }'
```

---

#### `POST /openapi/v1/updateNote`

Update an existing note.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string (UUID) | Yes | Note ID |
| `title` | string | No | Updated title |
| `content` | string | No | Updated content |

**Response:** `NoteDto`

---

### 5. Pick (Highlight Management)

Picks are highlights or excerpts from materials, documents, or chats.

---

#### `POST /openapi/v1/createPick`

Create a new pick (highlight).

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `board_id` | string (UUID) | Yes | Board ID |
| `content` | object | Yes | Pick content (`{ raw: string, plain?: string }`) |
| `source` | object | No | Source info (see below) |

Source object:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `entity_type` | string | Yes | Source entity type: `"snip"`, `"thought"`, `"craft"`, or `"chat"` |
| `entity_id` | string (UUID) | Yes | Source entity ID |
| `selection` | object | No | HTML selection info |
| `quote` | object | No | Quoted content |

**Response:** `PickDto`

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Pick ID |
| `board_id` | string | Board ID |
| `source` | object \| null | Pick source info |
| `content` | object \| null | Pick content |
| `status` | string | Pick status |
| `created_at` | string (ISO 8601) | Creation timestamp |
| `updated_at` | string (ISO 8601) | Last update timestamp |

---

#### `POST /openapi/v1/updatePick`

Update an existing pick.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string (UUID) | Yes | Pick ID |
| `content` | object | No | Updated pick content |
| `source` | object | No | Updated source info |
| `status` | string | No | Updated pick status |

**Response:** `PickDto`

---

#### `POST /openapi/v1/trashPick`

Move a pick to trash.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string (UUID) | Yes | Pick ID |

**Response:** `void`

---

### 6. Material Group (Material Group Management)

Material Groups allow organizing materials within a board.

---

#### `POST /openapi/v1/createMaterialGroup`

Create a new material group in a board.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `board_id` | string (UUID) | Yes | Board ID |
| `name` | string | Yes | Group name |
| `icon` | object | No | Group icon (`{ name: string, color: string }`) |

**Response:** `BoardGroupDto`

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Group ID |
| `board_id` | string | Board ID |
| `name` | string | Group name |
| `icon` | object | Group icon |
| `type` | string | Group type |
| `creator_id` | string | Creator user ID |
| `position` | object | Position info |
| `created_at` | string (ISO 8601) | Creation timestamp |
| `updated_at` | string (ISO 8601) | Last update timestamp |

---

#### `POST /openapi/v1/updateMaterialGroup`

Update a material group.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string (UUID) | Yes | Group ID |
| `name` | string | No | Updated group name |
| `icon` | object | No | Updated group icon |

**Response:** `BoardGroupDto`

---

#### `POST /openapi/v1/ungroupMaterialGroup`

Remove a material group (ungroup). Materials inside will be moved to the board's root level.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Group ID |

**Response:**

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether the operation succeeded |

---

### 7. Craft Group (Craft Group Management)

Craft Groups allow organizing documents (crafts) within a board.

---

#### `POST /openapi/v1/createCraftGroup`

Create a new craft group in a board.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `board_id` | string (UUID) | Yes | Board ID |
| `name` | string | Yes | Group name |
| `icon` | object | No | Group icon (`{ name?: string, color?: string }`) |

**Response:** `CraftGroupDto`

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Craft group ID |
| `title` | string | Group title (same as name) |
| `board_id` | string | Board ID |
| `icon` | object | Group icon |
| `type` | string | Craft type (`"craft_group"`) |
| ... | | (inherits all CraftDto fields) |

---

#### `POST /openapi/v1/updateCraftGroup`

Update a craft group.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string (UUID) | Yes | Craft group ID |
| `name` | string | No | Updated group name |
| `icon` | object | No | Updated group icon |

**Response:** `CraftGroupDto`

---

#### `POST /openapi/v1/ungroupCraftGroup`

Remove a craft group (ungroup). Documents inside will be moved to the board's root level.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Craft group ID |

**Response:**

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether the operation succeeded |

---

### 8. Chat (AI Chat)

Create and manage AI conversations. Non-streaming mode only for OpenAPI.

> **Note:** YouMind's AI capabilities such as image generation (Nano Banana Pro, Seedream, GPT Image, etc.), video generation, audio generation, and web search are all built-in AI tools within the chat system. To use these capabilities, simply describe your request in a chat message (e.g., "Generate an image of a sunset over mountains"), and the AI agent will automatically invoke the appropriate tool. There is no separate image/video/audio generation endpoint — all generative AI features are accessed through `createChat` and `sendMessage`.

---

#### `POST /openapi/v1/createChat`

Create a new chat and get the AI response (non-streaming).

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `message` | string | Yes | User message content |
| `board_id` | string (UUID) | No | Board ID to associate the chat with |
| `selection` | string | No | Selected text context |
| `at_references` | array | No | Referenced entities for context (boards, materials, crafts) |
| `chat_model` | string | No | AI model to use (e.g., `"claude-sonnet-4-6"`) |
| `skill` | object | No | Skill configuration to invoke |
| `message_mode` | string | No | Message mode |
| `max_mode` | boolean | No | Enable Max Mode for extended context window |

`at_references` item structure:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | Yes | Reference type (`"board"`, `"material"`, `"craft"`) |
| `id` | string (UUID) | Yes | Referenced entity ID |

`skill` object:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string (UUID) | Yes | Skill ID |

**Response:** `ChatDetailV2Dto`

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Chat ID |
| `title` | string | Chat title |
| `board_id` | string \| null | Board ID |
| `mode` | string | Chat mode |
| `status` | string | Chat status |
| `messages` | array | Array of messages (user + assistant) |
| `creator_id` | string | Creator user ID |
| `created_at` | string (ISO 8601) | Creation timestamp |
| `updated_at` | string (ISO 8601) | Last update timestamp |

Each message in `messages`:

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Message ID |
| `role` | string | Message role (`"user"` or `"assistant"`) |
| `content` | string | Message content |
| `created_at` | string (ISO 8601) | Creation timestamp |

**Example:**

```bash
curl -X POST https://youmind.com/openapi/v1/createChat \
  -H "Content-Type: application/json" \
  -H "x-api-key: sk-ym-your-api-key" \
  -d '{
    "message": "Summarize the key points of my research board",
    "board_id": "your-board-uuid",
    "at_references": [
      { "type": "board", "id": "your-board-uuid" }
    ]
  }'
```

---

#### `POST /openapi/v1/sendMessage`

Send a message to an existing chat and get the AI response (non-streaming).

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `chat_id` | string (UUID) | Yes | Chat ID to send message to |
| `message` | string | Yes | User message content |
| `selection` | string | No | Selected text context |
| `at_references` | array | No | Referenced entities for context |
| `chat_model` | string | No | AI model to use |
| `skill` | object | No | Skill configuration |
| `max_mode` | boolean | No | Enable Max Mode |

**Response:** `ChatDetailV2Dto` (same as `createChat`)

---

#### `POST /openapi/v1/listChats`

List chats with pagination.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `board_id` | string (UUID) | No | Filter by board ID |
| `page` | number | No | Page number (0-based, default: `0`) |
| `page_size` | number | No | Page size (default: `20`, max: `100`) |

**Response:**

| Field | Type | Description |
|-------|------|-------------|
| `data` | ChatV2Dto[] | List of chats (without message details) |
| `total` | number | Total number of chats |
| `page` | number | Current page (0-based) |
| `page_size` | number | Page size |

---

#### `POST /openapi/v1/getChat`

Get a specific chat (without messages).

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `chat_id` | string (UUID) | Yes | Chat ID |

**Response:** `ChatV2Dto`

---

#### `POST /openapi/v1/listMessages`

List all messages in a chat.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `chat_id` | string (UUID) | Yes | Chat ID |

**Response:**

| Field | Type | Description |
|-------|------|-------------|
| `messages` | MessageV2Dto[] | List of messages |
| `total` | number | Total number of messages |

---

### 9. Skill (Skill Management)

Skills are reusable AI instructions that can be applied in chats and scheduled tasks.

---

#### `POST /openapi/v1/createSkill`

Create a new skill.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Skill name (max 255 chars) |
| `description` | string | Yes | Concise summary of functionality (max 2048 chars) |
| `steps` | array | Yes | Skill steps (1-10 steps) |

Each step in `steps`:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `instructions` | string | Yes | Detailed executable instructions (plain text) |

**Response:** `SkillDto`

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Skill ID |
| `name` | string | Skill name |
| `description` | string | Skill description |
| `steps` | array | Skill steps |
| `visibility` | string | Visibility (`"private"` or `"public"`) |
| `review_status` | string | Review status (`"none"`, `"pending"`, `"approved"`, `"rejected"`, `"banned"`) |
| `origin` | string | Skill origin (`"custom"` or `"system"`) |
| `version` | number | Skill version |
| `install_count` | number | Number of installations |
| `creator_id` | string | Creator user ID |
| `short_description` | string \| null | Short description |
| `category` | string \| null | Skill category |
| `thumbnail` | string \| null | Thumbnail URL |
| `created_at` | string (ISO 8601) | Creation timestamp |
| `updated_at` | string (ISO 8601) | Last update timestamp |

**Example:**

```bash
curl -X POST https://youmind.com/openapi/v1/createSkill \
  -H "Content-Type: application/json" \
  -H "x-api-key: sk-ym-your-api-key" \
  -d '{
    "name": "Weekly Summary Generator",
    "description": "Generates a concise weekly summary from board materials",
    "steps": [
      { "instructions": "Read all materials in the referenced board from the past 7 days" },
      { "instructions": "Generate a structured summary with key insights and action items" }
    ]
  }'
```

---

#### `POST /openapi/v1/getSkill`

Get a skill by ID.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string (UUID) | Yes | Skill ID |

**Response:** `SkillDto`

---

#### `POST /openapi/v1/updateSkill`

Update an existing skill.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string (UUID) | Yes | Skill ID |
| `name` | string | No | Updated name (max 255 chars) |
| `description` | string | No | Updated description (max 2048 chars) |
| `steps` | array | No | Updated steps (1-10, plain text) |

**Response:** `SkillDto`

---

#### `POST /openapi/v1/installSkill`

Install a public skill to your workspace.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string (UUID) | Yes | Skill ID to install |

**Response:** `SkillDto`

---

#### `POST /openapi/v1/trashSkill`

Trash or uninstall a skill.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string (UUID) | Yes | Skill ID |

**Response:** `void`

---

### 10. Search (Semantic Search)

Perform semantic search across your library or a specific board.

---

#### `POST /openapi/v1/search`

Search across your knowledge base using semantic search.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `query` | string | Yes | Search query (e.g., `"machine learning"`) |
| `mode` | string | No | Search mode (default: `"vector"`) |
| `top_k` | number | No | Max results to return (1-100, default: `10`) |
| `filter_attributes` | string[] | No | Exclude these attributes from response |
| `filter_types` | string[] | No | Filter by document types: `"article"`, `"note"`, `"page"` |
| `filter_source_ids` | string[] | No | Filter by source IDs (board IDs) |
| `filter_fields` | string[] | No | Filter by fields: `"title"`, `"content"` |
| `filter_updated_at` | object | No | Filter by update time range (`{ from?: number, to?: number }`, Unix timestamp ms) |
| `filter_published_at` | object | No | Filter by publish time range |

**Response:** `OpenApiSearchResponseDto`

Contains an array of search results, each with relevance score, matched content, and source metadata.

**Example:**

```bash
curl -X POST https://youmind.com/openapi/v1/search \
  -H "Content-Type: application/json" \
  -H "x-api-key: sk-ym-your-api-key" \
  -d '{
    "query": "machine learning best practices",
    "top_k": 5,
    "filter_types": ["article", "page"],
    "filter_source_ids": ["your-board-uuid"]
  }'
```

---

### 11. Web Search (Internet Search)

Search the Internet for fresh external information.

---

#### `POST /openapi/v1/webSearch`

Perform a web search.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `query` | string | Yes | Search query (max 300 chars, e.g., `"OpenAI structured outputs"`) |
| `category` | string | No | Search category (default: `"General"`) |
| `freshness` | string | No | Result freshness filter: `"day"`, `"week"`, `"month"`, or `"year"` |
| `include_domains` | string[] | No | Only include results from these domains (max 20, e.g., `["openai.com"]`) |
| `exclude_domains` | string[] | No | Exclude results from these domains (max 20, e.g., `["reddit.com"]`) |

**Response:**

| Field | Type | Description |
|-------|------|-------------|
| `provider_id` | string | Search provider used (e.g., `"brave"`) |
| `results` | array | Array of search results |
| `total_results` | number \| null | Total result count |
| `visible_count` | number \| null | Number of results in formatted context |
| `formatted_context` | string \| null | Formatted search context for LLM consumption |

Each result in `results`:

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Result title |
| `url` | string | Result URL |
| `display_url` | string | Display URL / source label |
| `snippet` | string | Short snippet |
| `favicon` | string \| null | Favicon URL |
| `date_published` | string \| null | Published date |
| `thumbnail` | string \| null | Thumbnail URL |

**Example:**

```bash
curl -X POST https://youmind.com/openapi/v1/webSearch \
  -H "Content-Type: application/json" \
  -H "x-api-key: sk-ym-your-api-key" \
  -d '{
    "query": "latest AI research papers 2024",
    "freshness": "month",
    "include_domains": ["arxiv.org", "openai.com"]
  }'
```

---

### 12. Scheduled Task (Scheduled Task Management)

Create and manage automated recurring tasks that execute skills on a schedule.

---

#### `POST /openapi/v1/createScheduledTask`

Create a new scheduled task.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `board_id` | string (UUID) | Yes | Board this task belongs to |
| `name` | string | Yes | Task name (e.g., `"Daily summary"`) |
| `trigger_config` | object | Yes | Trigger schedule configuration |
| `action_config` | object | Yes | Action execution configuration |

`trigger_config` object:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `schedule_type` | string | Yes | `"once"` or `"interval"` |
| `scheduled_date` | string | Conditional | Required when `schedule_type="once"`. Format: `YYYY-MM-DD` |
| `scheduled_time` | string | No | Time to run. Format: `HH:mm` |
| `interval_value` | number | Conditional | Required when `schedule_type="interval"`. Minimum: `1` |
| `interval_unit` | string | Conditional | Required when `schedule_type="interval"`: `"hour"`, `"day"`, `"week"`, or `"month"` |
| `repeat_days` | number[] | No | Days to run on. For week: `1`=Mon...`6`=Sat, `0`=Sun. For month: `1`-`31` |
| `at_time` | string | No | Time of day to run (used with day/week/month intervals). Format: `HH:mm` |
| `timezone` | string | Yes | IANA timezone (e.g., `"Asia/Shanghai"`, `"America/New_York"`) |

`action_config` object:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `skill_id` | string (UUID) | No | Skill to execute (at least one of `skill_id` or `prompt` required) |
| `prompt` | string | No | Task instruction / prompt |
| `at_references` | array | No | Materials, boards, or crafts to include as context |

**Response:** `ScheduledTaskDto`

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Task ID |
| `name` | string | Task name |
| `board_id` | string | Board ID |
| `space_id` | string | Space ID |
| `trigger_type` | string | Trigger type (`"cron"`) |
| `trigger_config` | object | Trigger configuration |
| `action_type` | string | Action type (`"skill"`) |
| `action_config` | object | Action configuration |
| `status` | string | Task status (`"active"`) |
| `created_at` | string (ISO 8601) | Creation timestamp |
| `updated_at` | string (ISO 8601) | Last update timestamp |

**Example:**

```bash
curl -X POST https://youmind.com/openapi/v1/createScheduledTask \
  -H "Content-Type: application/json" \
  -H "x-api-key: sk-ym-your-api-key" \
  -d '{
    "board_id": "your-board-uuid",
    "name": "Daily Research Digest",
    "trigger_config": {
      "schedule_type": "interval",
      "interval_value": 1,
      "interval_unit": "day",
      "at_time": "09:00",
      "timezone": "Asia/Shanghai"
    },
    "action_config": {
      "skill_id": "your-skill-uuid",
      "at_references": [
        { "type": "board", "id": "your-board-uuid" }
      ]
    }
  }'
```

---

#### `POST /openapi/v1/updateScheduledTask`

Update an existing scheduled task.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string (UUID) | Yes | Task ID |
| `board_id` | string (UUID) | No | Updated board ID |
| `name` | string | No | Updated task name |
| `trigger_config` | object | No | Updated trigger configuration |
| `action_config` | object | No | Updated action configuration |

**Response:** `ScheduledTaskDto`

---

#### `POST /openapi/v1/getScheduledTask`

Get a scheduled task with its run history.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string (UUID) | Yes | Task ID |

**Response:**

| Field | Type | Description |
|-------|------|-------------|
| `task` | ScheduledTaskDto | The scheduled task |
| `runs` | array | List of past task runs with status and timestamps |

---

#### `POST /openapi/v1/trashScheduledTask`

Move a scheduled task to trash.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string (UUID) | Yes | Task ID |

**Response:**

| Field | Type | Description |
|-------|------|-------------|
| `trash_item_id` | string \| undefined | Trash item ID (for undo) |

---

#### `POST /openapi/v1/listScheduledTasks`

List all scheduled tasks.

**Request Body:** Empty `{}`

**Response:**

| Field | Type | Description |
|-------|------|-------------|
| `tasks` | array | List of scheduled tasks with their run history |

---

### 13. Relay (LLM API Relay)

Relay endpoints provide vendor-compatible API interfaces for Anthropic and OpenAI, allowing you to use YouMind as a proxy for **text-based LLM API calls** while consuming your YouMind credits.

> **Important:** Relay only supports **text generation** (chat/messages). Image generation (`/v1/images/generations`), embeddings, and other non-chat endpoints are **NOT** supported. To generate images, videos, or audio, use the [Chat API](#8-chat-ai-chat) instead — YouMind's built-in AI tools handle these automatically within conversations.

---

#### `POST /openapi/v1/chat/anthropic/v1/messages`

Anthropic Messages API compatible endpoint. Accepts identical request/response format as the official Anthropic API, including SSE streaming.

**Authentication:** `Authorization: Bearer sk-ym-your-api-key`

**Configuration for Claude Code:**

```bash
export ANTHROPIC_BASE_URL=https://youmind.com/openapi/v1/chat/anthropic
```

**Request Body:** Standard Anthropic Messages API format:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `model` | string | Yes | Model ID (e.g., `"claude-sonnet-4-6"`) |
| `max_tokens` | number | Yes | Maximum output tokens |
| `messages` | array | Yes | Conversation messages |
| `system` | string \| array | No | System prompt |
| `stream` | boolean | No | Enable SSE streaming (default: `false`) |
| `temperature` | number | No | Sampling temperature |
| `tools` | array | No | Tool definitions |

**Response:** Standard Anthropic Messages API response (JSON or SSE stream)

---

#### `POST /openapi/v1/chat/openai/v1/chat/completions`

OpenAI Chat Completions API compatible endpoint. Accepts identical request/response format as the official OpenAI API, including SSE streaming.

**Authentication:** `Authorization: Bearer sk-ym-your-api-key`

**Configuration:**

```bash
# Set base URL to:
https://youmind.com/openapi/v1/chat/openai/v1
```

**Request Body:** Standard OpenAI Chat Completions API format:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `model` | string | Yes | Model ID (e.g., `"gpt-4o"`) |
| `messages` | array | Yes | Conversation messages |
| `stream` | boolean | No | Enable SSE streaming (default: `false`) |
| `max_tokens` | number | No | Maximum output tokens |
| `temperature` | number | No | Sampling temperature |
| `tools` | array | No | Tool definitions |
| `tool_choice` | string \| object | No | Tool choice strategy |

**Response:** Standard OpenAI Chat Completions API response (JSON or SSE stream)

---

## Error Handling

All errors follow a standard format:

```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "Bad Request"
}
```

### Common Error Codes

| Status Code | Description |
|-------------|-------------|
| `400` | Bad Request - Invalid parameters |
| `401` | Unauthorized - Invalid or missing API key |
| `403` | Forbidden - Account banned or insufficient permissions |
| `404` | Not Found - Resource does not exist |
| `409` | Conflict - Resource conflict |
| `429` | Too Many Requests - Rate limit exceeded or credits exhausted |
| `500` | Internal Server Error |

---

## Rate Limiting

API calls are subject to rate limiting. When the limit is exceeded, a `429` response will be returned. The Relay endpoints also return `429` when credits are exhausted.

---

## Endpoint Summary

| # | Endpoint | Description |
|---|----------|-------------|
| 1 | `POST /openapi/v1/createBoard` | Create a board |
| 2 | `POST /openapi/v1/listBoards` | List all boards |
| 3 | `POST /openapi/v1/getBoard` | Get a board |
| 4 | `POST /openapi/v1/getDefaultBoard` | Get the default board |
| 5 | `POST /openapi/v1/updateBoard` | Update a board |
| 6 | `POST /openapi/v1/trashBoard` | Trash a board |
| 7 | `POST /openapi/v1/moveMaterials` | Batch move materials |
| 8 | `POST /openapi/v1/createMaterialByUrl` | Create material from URL |
| 9 | `POST /openapi/v1/getMaterial` | Get a material |
| 10 | `POST /openapi/v1/listMaterials` | List materials in a board |
| 11 | `POST /openapi/v1/trashMaterial` | Trash a material |
| 12 | `POST /openapi/v1/publishMaterial` | Publish a material |
| 13 | `POST /openapi/v1/createDocument` | Create a document |
| 14 | `POST /openapi/v1/createDocumentByMarkdown` | Create document from Markdown |
| 15 | `POST /openapi/v1/updateDocument` | Update a document |
| 16 | `POST /openapi/v1/createSlides` | Create slides |
| 17 | `POST /openapi/v1/updateSlides` | Update slides |
| 18 | `POST /openapi/v1/getCraft` | Get a craft |
| 19 | `POST /openapi/v1/listCrafts` | List crafts in a board |
| 20 | `POST /openapi/v1/publishCraft` | Publish a craft |
| 21 | `POST /openapi/v1/moveCrafts` | Batch move crafts |
| 22 | `POST /openapi/v1/trashCraft` | Trash a craft |
| 23 | `POST /openapi/v1/createNote` | Create a note |
| 24 | `POST /openapi/v1/updateNote` | Update a note |
| 25 | `POST /openapi/v1/createPick` | Create a pick |
| 26 | `POST /openapi/v1/updatePick` | Update a pick |
| 27 | `POST /openapi/v1/trashPick` | Trash a pick |
| 28 | `POST /openapi/v1/createMaterialGroup` | Create a material group |
| 29 | `POST /openapi/v1/updateMaterialGroup` | Update a material group |
| 30 | `POST /openapi/v1/ungroupMaterialGroup` | Dissolve a material group |
| 31 | `POST /openapi/v1/createCraftGroup` | Create a craft group |
| 32 | `POST /openapi/v1/updateCraftGroup` | Update a craft group |
| 33 | `POST /openapi/v1/ungroupCraftGroup` | Dissolve a craft group |
| 34 | `POST /openapi/v1/createChat` | Create chat and get AI response |
| 35 | `POST /openapi/v1/sendMessage` | Send message to existing chat |
| 36 | `POST /openapi/v1/listChats` | List chats |
| 37 | `POST /openapi/v1/getChat` | Get a chat |
| 38 | `POST /openapi/v1/listMessages` | List messages in a chat |
| 39 | `POST /openapi/v1/createSkill` | Create a skill |
| 40 | `POST /openapi/v1/getSkill` | Get a skill |
| 41 | `POST /openapi/v1/updateSkill` | Update a skill |
| 42 | `POST /openapi/v1/installSkill` | Install a skill |
| 43 | `POST /openapi/v1/trashSkill` | Trash a skill |
| 44 | `POST /openapi/v1/search` | Semantic search |
| 45 | `POST /openapi/v1/webSearch` | Internet search |
| 46 | `POST /openapi/v1/createScheduledTask` | Create a scheduled task |
| 47 | `POST /openapi/v1/updateScheduledTask` | Update a scheduled task |
| 48 | `POST /openapi/v1/getScheduledTask` | Get a scheduled task |
| 49 | `POST /openapi/v1/trashScheduledTask` | Trash a scheduled task |
| 50 | `POST /openapi/v1/listScheduledTasks` | List all scheduled tasks |
| 51 | `POST /openapi/v1/chat/anthropic/v1/messages` | Anthropic API relay |
| 52 | `POST /openapi/v1/chat/openai/v1/chat/completions` | OpenAI API relay |
