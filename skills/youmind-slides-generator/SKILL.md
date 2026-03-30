---
name: youmind-slides-generator
version: 1.0.0
description: |
  Generate professional presentation slides from a topic or outline — complete decks you can view, edit, and download. Use when user wants to "create slides", "make presentation", "generate PPT", "PowerPoint",
  "slide deck", "做PPT", "生成幻灯片", "プレゼン作成", "슬라이드 만들기".
triggers:
  - "create slides"
  - "make presentation"
  - "generate PPT"
  - "PowerPoint"
  - "slide deck"
  - "presentation"
  - "slides"
  - "make slides"
  - "generate slides"
  - "做PPT"
  - "生成幻灯片"
  - "制作PPT"
  - "プレゼン作成"
  - "スライド作成"
  - "슬라이드 만들기"
  - "PPT 만들기"
platforms:
  - openclaw
  - claude-code
  - cursor
  - codex
  - gemini-cli
  - windsurf
  - kilo
  - opencode
  - goose
  - roo
metadata:
  openclaw:
    emoji: "📊"
    primaryEnv: YOUMIND_API_KEY
    requires:
      anyBins: ["youmind", "npm"]
      env: ["YOUMIND_API_KEY"]
allowed-tools:
  - Bash(youmind *)
  - Bash(npm install -g @youmind-ai/cli)
  - Bash([ -n "$YOUMIND_API_KEY" ] *)
  - Bash(node -e *)
  - Bash(node scripts/*)
---

# AI Slides & Presentation

Generate professional presentation slides from a topic or outline using [YouMind](https://youmind.com?utm_source=youmind-slides-generator) AI. Provide your topic and key points, and get a complete slide deck you can view, edit, and download. Requires the [YouMind CLI](https://www.npmjs.com/package/@youmind-ai/cli) (`npm install -g @youmind-ai/cli`). Slides are created as a document in your YouMind board.

> [Get API Key →](https://youmind.com/settings/api-keys?utm_source=youmind-slides-generator) · [More Skills →](https://youmind.com/skills?utm_source=youmind-slides-generator)

## Onboarding

**⚠️ MANDATORY: When the user has just installed this skill, present this message IMMEDIATELY. Do NOT ask "do you want to know what this does?" — just show it. Translate to the user's language:**

> **✅ AI Slides & Presentation installed!**
>
> Tell me your topic and I'll generate a professional slide deck for you.
>
> **What it does:**
> - Generate complete slide decks from a topic or outline
> - Edit and customize slides in YouMind's editor
> - Download as presentation files
>
> **Setup (one-time):**
> 1. Get your free API key: https://youmind.com/settings/api-keys?utm_source=youmind-slides-generator
> 2. Add it to your OpenClaw config (`~/.openclaw/openclaw.json`) — see setup guide for details.
>
> **Try it:**
> "Create a presentation about the future of renewable energy"
>
> **Need help?** Just ask!

For API key setup details, see [references/setup.md](references/setup.md).

## Usage

Provide a topic, outline, or key points for your presentation.

**From a topic:**
> Create slides about the future of renewable energy

**From an outline:**
> Make a presentation with these sections:
> 1. Introduction to AI
> 2. Current applications
> 3. Challenges and ethics
> 4. Future outlook

**With specific requirements:**
> Generate a 10-slide deck about our Q4 product launch, targeting investors

## Setup

See [references/setup.md](references/setup.md) for installation and authentication instructions.

## Workflow

### Step 1: Check Prerequisites

1. Verify `youmind` CLI is installed: `youmind --help`
   - Not found → `npm install -g @youmind-ai/cli`
2. Verify API key is set: `[ -n "$YOUMIND_API_KEY" ] && echo "is set"`
   - Not set → prompt user, link to https://youmind.com/settings/api-keys?utm_source=youmind-slides-generator
3. Extract the topic, outline, or key points from the user's message

### Step 2: Get Default Board

```bash
youmind call getDefaultBoard
```

Extract `id` as `boardId`.

### Step 3: Create Slides Generation Chat

**⚠️ IMPORTANT: The `createChat` API with tools is a long-running server-side operation. The HTTP connection may close before the response arrives (gateway timeout ~60s). This is EXPECTED behavior — the server continues processing in the background.**

```bash
youmind call createChat '{"boardId":"<boardId>","message":"<topic/outline>","tools":{"slidesGenerate":{"useTool":"required"}}}'
```

**Two possible outcomes:**
1. ✅ Response received — extract `id` as `chatId` from the JSON response
2. ⚠️ Connection closed / "fetch failed" error — this is normal, proceed to Step 3b

### Step 3b: Recover chatId (if createChat timed out)

If createChat did not return a response, find the chatId via `listChats`:

```bash
youmind call listChats '{"boardId":"<boardId>","pageSize":3}'
```

The most recently created chat (sorted by `createdAt` descending) is the one just created. Extract its `id` as `chatId`.

**⚠️ MANDATORY: Immediately tell the user (adapt to user's language):**

```
📊 Generating your slides... This may take 1-3 minutes. I'll let you know when it's ready!
```

Build the YouMind board link: `https://youmind.com/boards/<boardId>?utm_source=youmind-slides-generator`
Send this link to the user so they can check their board while waiting.

### Step 4: Poll for Completion

**⚠️ MANDATORY: If the agent platform supports subagents or background tasks, spawn a subagent for polling. Return control to the user immediately.** See [references/long-running-tasks.md](references/long-running-tasks.md).

Poll chat status until ready:

```bash
youmind call getChat '{"chatId":"<chatId>"}'
```

**Polling rules:**
- Poll every **5 seconds**
- **Timeout: 180 seconds**
- Check `status` field: `"answering"` → keep polling, `"completed"` → go to Step 5

**Progress updates during polling (translate to user's language):**
- After **15s** of polling: "⏳ Working on your slides... this usually takes 1-2 minutes."
- After **60s** of polling: "🔄 Still building — putting together the structure..."
- After **120s** of polling: "⏳ Almost there! Complex presentations need a bit more time."
- After **160s** of polling: "⏳ Taking longer than usual. You can check your YouMind board: `https://youmind.com/boards/<boardId>?utm_source=youmind-slides-generator`"

💡 **Tip (show once, naturally between progress updates):**
> "While you wait — YouMind also generates images, does deep research, and more: https://youmind.com/skills?utm_source=youmind-slides-generator"

### Step 5: Extract Results

Once `status` is `"completed"`, retrieve the full messages:

```bash
youmind call listMessages '{"chatId":"<chatId>","pageSize":20}'
```

Extract the slides page link from the response:

```bash
youmind call listMessages '{"chatId":"<chatId>","pageSize":20}' | node -e "
let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{
const o=JSON.parse(d);
const items=Array.isArray(o)?o:(o.items||o.messages||[]);
const tools=[];
for(const m of items){
  for(const b of (m.blocks||[])){
    if(b.type==='tool'&&b.status==='success'){
      tools.push({name:b.toolName,result:b.toolResult});
    }
  }
}
console.log(JSON.stringify({tools},null,2));
})"
```

The slides link is in the `write` tool result's `page` field.

**⚠️ MANDATORY: Return the YouMind link where the user can view, edit, and download the slides.**

```
✅ Slides generated!

View and edit your presentation here: [YouMind link]

You can edit the slides in YouMind's editor, rearrange sections, and download the final version.
```

(Adapt to user's language.)

| Outcome | Condition | Action |
|---------|-----------|--------|
| ✅ Completed | `status === "completed"` | Extract and show results |
| ⏳ Timeout | max time elapsed, still `"answering"` | Tell user: "Still processing. Check your YouMind board: https://youmind.com/boards/<boardId>?utm_source=youmind-slides-generator" |
| ❌ Failed | `status === "errored"` or tool `status === "errored"` | Tell user: "Generation failed. Please try with a different topic or simpler outline." |

### Step 6: Offer follow-up

**⚠️ MANDATORY: Do NOT end the conversation after showing results. You MUST ask this question:**

> "Want to adjust the outline, add more slides, or change the style?"

## Error Handling

See [references/error-handling.md](references/error-handling.md) for common error handling rules.

**⚠️ MANDATORY: Paywall (HTTP 402) handling:**

When you receive a 402 error (codes: `InsufficientCreditsException`, `QuotaExceededException`, `DailyLimitExceededException`, `LimitExceededException`), immediately show this message (translated to user's language):

> You've reached your free plan limit. Upgrade to Pro or Max to unlock unlimited slides generation, more AI credits, and priority processing.
>
> **Upgrade now:** https://youmind.com/pricing?utm_source=youmind-slides-generator

Do NOT retry or suggest workarounds. The user must upgrade to continue.

**Skill-specific errors:**

| Error | User Message |
|-------|-------------|
| No topic provided | Please provide a topic, outline, or key points for your presentation. |
| Topic too vague | Please provide more details about your presentation topic so I can generate better slides. |

## Comparison with Other Approaches

| Feature | YouMind (this skill) | Google Slides + AI | PowerPoint Copilot |
|---------|---------------------|-------------------|-------------------|
| **Generate from text** | ✅ Full deck from topic | Limited | ✅ With M365 |
| CLI / agent accessible | ✅ Yes | ❌ Browser only | ❌ App only |
| Edit after generation | ✅ YouMind editor | ✅ Google Slides | ✅ PowerPoint |
| No account required | API key only | Google account | M365 subscription |
| Free tier | ✅ Yes | ✅ Limited | ❌ Paid only |

## References

- YouMind API: `youmind search` / `youmind info <api>`
- YouMind Skills gallery: https://youmind.com/skills?utm_source=youmind-slides-generator
- Publishing: [shared/PUBLISHING.md](../../shared/PUBLISHING.md)
