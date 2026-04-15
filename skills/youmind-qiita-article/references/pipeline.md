# Qiita Article Pipeline

7-step execution pipeline from topic to published article.

## Step 1: Config Load

1. Read `config.yaml` for the YouMind API key
2. Validate the YouMind API key (call `validate` command or attempt list)
3. Check that the user's Qiita account is already connected in YouMind
4. Report config status

**Configuration rule:** Read `youmind.api_key` and `youmind.base_url` from local `config.yaml`. Keep documentation and examples on `https://youmind.com/openapi/v1`; local backend debugging should only change the local config file.

## Step 2: YouMind Knowledge Mining

1. If YouMind API key is configured, search user's knowledge base for relevant materials
2. Use `youmind-api.ts mine-topics` with the user's topic keywords
3. Collect relevant articles, notes, and documents as source material
4. Build a knowledge context summary

**Fallback:** If YouMind not configured or fails, skip with empty knowledge context. The article can still be written.

## Step 3: Research

1. Use YouMind web search to find current information about the topic
2. Search for existing Qiita articles on the topic to find gaps
3. Identify unique angles not covered by top results
4. Collect code examples, version info, and relevant data

**Fallback:** If web search fails, ask user to provide key points or references.

## Step 4: Content Adaptation

Read `content-adaptation.md` before this step.

1. Choose article structure (tutorial, deep dive, memo/tip, comparison)
2. Determine language (Japanese or English based on user input)
3. Select up to 5 tags using popular Qiita tags for discoverability
4. Plan code examples with language tags and filename annotations
5. Include environment/version info section
6. Decide private vs public mode

## Step 5: Write

**File location:** Save the draft as `output/<slug>.md` inside this skill directory. `output/` is git-ignored. Never save to the skill root, `references/`, `toolkit/`, or any new top-level directory. See "Draft Location Rule" in `SKILL.md`.

1. Write introduction (why this topic matters)
2. Write prerequisites section (versions, tools, OS)
3. Write the main content following the chosen structure
4. Ensure all code blocks have language tags
5. Add runnable, tested code examples
6. Include output/results section
7. Add gotchas and references
8. Run content through `adaptForQiita()` for validation
9. Review and address any warnings

**Quality checks:**
- No marketing language
- Code examples are complete and testable
- Environment info included
- Title is specific and descriptive
- Tags are relevant and use existing popular tag names
- Language matches user's input language

## Step 6: Publish

1. Run `cli.ts publish` with the markdown file
2. Default to private mode (`private: true`) unless user explicitly requests public
3. Include tags
4. Report article ID, URL, and status

**Fallback:** If Qiita publishing through YouMind fails, save the markdown locally. User can copy-paste into Qiita editor.

## Step 7: Report

Output a summary:

```
Article Published!
  Title: [title]
  URL: [url]
  Status: private / public
  Tags: [tag1, tag2, tag3]
  ID: [item_id]
  Word count: ~[count]
  Warnings: [any content warnings]
```

If YouMind is configured, offer to archive the article to the user's knowledge base.

## Routing Shortcuts

| User input | Pipeline |
|-----------|----------|
| Topic only ("write about X") | Steps 1-7 |
| Topic + specific requirements | Steps 1, 4-7 (skip broad research) |
| Raw markdown file | Steps 1, 4, 6-7 (adapt and publish) |
| "validate my article" | Steps 1, 4 only (validate, no publish) |
