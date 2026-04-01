---
title: "Building Custom Skills for AI Coding Agents: From Idea to One-Command Execution"
description: "How to build reusable skill packages that give AI coding agents like Claude Code domain-specific superpowers — with a real-world example."
tags: ai, productivity, opensource, tutorial
published: false
---

**TL;DR:** AI coding agents are powerful out of the box, but they get *really* powerful when you give them domain-specific skills. This post walks through building a reusable skill package — a structured folder with a SKILL.md manifest, a toolkit, and reference docs — that turns a generic AI agent into a specialized workflow engine. I'll show a real example: an agent skill that researches, writes, and publishes articles to Dev.to in one command.

---

## The Problem: AI Agents Are Generalists

If you've used Claude Code, Cursor, or GitHub Copilot's agent mode, you know the pattern: you describe what you want, the agent reads your codebase, writes code, runs tests, and iterates. It works well for general programming tasks.

But what about *workflows*? Tasks like:

- "Research trending topics and publish a blog post to Dev.to"
- "Generate a weekly analytics report from our Postgres database"
- "Scaffold a new microservice with our team's conventions"

These require domain knowledge, specific API calls, multi-step orchestration, and validation rules that a general-purpose agent doesn't have. You end up copy-pasting prompts, re-explaining context, and manually connecting the dots.

**What if you could package all that domain knowledge into a reusable skill that any AI agent could execute?**

## The Solution: Agent Skills as Structured Packages

A skill is a folder that contains everything an AI agent needs to execute a domain-specific workflow:

```text
my-skill/
├── SKILL.md              # Manifest: triggers, rules, pipeline overview
├── config.example.yaml   # Credentials template
├── references/           # Domain knowledge the agent reads on demand
│   ├── pipeline.md       # Step-by-step execution guide
│   ├── api-reference.md  # API docs for the target platform
│   └── content-rules.md  # Quality rules and validation
└── toolkit/              # Executable scripts the agent can run
    ├── src/
    ├── package.json
    └── tsconfig.json
```

The key insight: **the AI agent reads `SKILL.md` to understand what it can do, reads reference docs as needed during execution, and calls toolkit scripts to interact with external APIs.**

This is fundamentally different from traditional plugins or CLI tools. The agent doesn't just execute commands blindly — it reasons about the skill's reference docs, adapts to the user's specific request, and handles failures with built-in fallbacks.

## Building It: A Dev.to Article Publisher Skill

Let's walk through a real skill that researches, writes, and publishes Dev.to articles.

### Step 1: The SKILL.md Manifest

This is what the agent reads first. It needs three things:

1. **When to activate** (trigger keywords)
2. **What it can do** (pipeline overview)
3. **Where to find details** (reference file map)

```yaml
---
name: youmind-devto-article
version: 1.0.0
description: |
  Write and publish Dev.to articles with AI — topic research,
  developer-audience adapted writing, and one-click publishing.
triggers:
  - "dev.to article"
  - "publish to dev.to"
  - "write for dev.to"
allowed-tools:
  - Bash(node dist/cli.js *)
  - Bash(npm install)
  - Bash(npm run build)
---
```

The `triggers` array tells the agent when this skill is relevant. The `allowed-tools` section defines which shell commands the agent is permitted to run — this is critical for security.

### Step 2: Reference Docs (Domain Knowledge)

Instead of cramming everything into one file, split domain knowledge into focused references that the agent reads on demand:

**`references/pipeline.md`** — The execution steps:

```markdown
## Step 1: Config Load
Read config.yaml, validate API keys.

## Step 2: Knowledge Mining
Search user's knowledge base for relevant source material.

## Step 3: Research
Web search for current information, identify unique angles.

## Step 4: Content Adaptation
Choose structure, write title (60-80 chars), select tags (max 4).

## Step 5: Write
TL;DR first, Problem-Solution-Code-Result structure, 800-2500 words.

## Step 6: Publish
Call Dev.to API, default to draft mode.

## Step 7: Report
Output title, URL, tags, status, word count.
```

**`references/content-adaptation.md`** — Platform-specific rules:

```markdown
## Title Rules
- 60-80 characters, keyword-front-loaded
- Format: "[Technology]: [What You'll Learn]"

## Anti-Patterns
- No marketing language ("revolutionary", "game-changing")
- No clickbait titles
- No untagged code blocks
```

The agent reads these references at the relevant pipeline step, not all upfront. This keeps its context window focused.

### Step 3: The Toolkit (Executable Scripts)

The toolkit handles API interactions. Here's the core publisher:

```typescript
// publisher.ts
interface PublishOptions {
  apiKey: string;
  title: string;
  markdown: string;
  tags: string[];
  description: string;
  published: boolean;
}

export async function publish(opts: PublishOptions) {
  const response = await fetch("https://dev.to/api/articles", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": opts.apiKey,
    },
    body: JSON.stringify({
      article: {
        title: opts.title,
        body_markdown: opts.markdown,
        published: opts.published,
        tags: opts.tags,
        description: opts.description,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Dev.to API error (${response.status}): ${error}`);
  }

  return response.json();
}
```

And a content validator that catches common mistakes:

```typescript
// content-adapter.ts
export function adaptForDevto(input: AdaptInput): AdaptResult {
  const warnings: string[] = [];

  // Check title length
  if (input.title.length > 80) {
    warnings.push(`Title too long (${input.title.length} chars, max 80)`);
  }

  // Check for untagged code blocks
  const bareCodeBlocks = input.markdown.match(/```\n/g);
  if (bareCodeBlocks) {
    warnings.push(`${bareCodeBlocks.length} code block(s) without language tag`);
  }

  // Check tag count
  if (input.tags.length > 4) {
    warnings.push(`Too many tags (${input.tags.length}, max 4)`);
  }

  // Check description length
  if (input.description.length > 170) {
    warnings.push(`Description too long (${input.description.length} chars, max 170)`);
  }

  return { warnings, /* ... adapted content */ };
}
```

The agent calls these via the CLI:

```bash
node dist/cli.js publish article.md --tags "ai,tutorial" --draft
```

### Step 4: Resilience — Every Step Has a Fallback

This is what separates a good skill from a brittle script. Define fallbacks in `SKILL.md`:

```markdown
| Step | Fallback |
|------|----------|
| Knowledge mining | Skip, use empty context |
| Web research | Fall back to user-provided input |
| Publishing | Save markdown locally |
| Report | Print what was completed |
```

The agent reads these and automatically applies them when a step fails. No hardcoded error handling needed — the agent *reasons* about what to do next.

## How It Works in Practice

A user types:

> "Write a Dev.to article about building CLI tools with TypeScript"

The agent:

1. Reads `SKILL.md`, identifies this matches the trigger
2. Loads `config.yaml`, validates the Dev.to API key
3. Searches the user's knowledge base for relevant notes (optional)
4. Reads `references/content-adaptation.md` for Dev.to formatting rules
5. Writes the article following the Problem-Solution-Code-Result structure
6. Runs `node dist/cli.js publish article.md --draft` to create a draft
7. Reports: title, URL, status, word count

One prompt. Seven coordinated steps. The skill package made all the difference.

## Why This Pattern Works

**Separation of concerns.** The AI agent handles reasoning and writing. The toolkit handles API calls. The reference docs provide domain knowledge. Each part is independently testable and updatable.

**Progressive disclosure.** The agent doesn't load all docs at once. It reads `pipeline.md` first, then loads specific references at each step. This keeps the context window efficient.

**Platform portability.** The same skill folder works across Claude Code, Cursor, Codex, and other agent-enabled tools. The `SKILL.md` manifest is the universal interface.

**Resilience by design.** Fallbacks are declared, not coded. The agent adapts to failures without custom error-handling logic.

## Getting Started

If you want to build your own agent skill:

1. **Pick a workflow** you repeat often (deploying, reporting, content publishing)
2. **Create the folder structure** with SKILL.md, references/, and toolkit/
3. **Write the pipeline** in references/pipeline.md — step by step
4. **Build the toolkit** — keep it simple, one script per API integration
5. **Define fallbacks** — what should happen when each step fails?

The skill format is open. You can find example skills and contribute your own at the [YouMind Skills Gallery](https://youmind.com/skills).

---

*Have you built custom workflows for AI coding agents? I'd love to hear what patterns worked for you in the comments.*
