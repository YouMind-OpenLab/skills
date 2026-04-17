# Dispatch Integration Protocol — Optional Interop Between Dispatch and Article Skills

> **This is an OPTIONAL protocol.** Each `youmind-{platform}-article` skill is independently installed, independently published, and fully self-contained. Platform skills are NOT required to implement anything in this document — they work fine standalone and without the dispatch hub.
>
> When a user has BOTH the `youmind-article-dispatch` hub AND one or more platform skills installed, this protocol describes how they can interoperate for multi-platform publishing. Think of it as a lightweight discovery + message-passing convention, not a framework.

## Design principles

1. **Independence first.** Every platform skill must work standalone. Dispatch is an additive convenience layer, never a dependency.
2. **Opt-in metadata.** Platform skills MAY ship a `dispatch-capabilities.yaml` to tell dispatch what they support. They may also omit it — dispatch falls back to defaults.
3. **Graceful defaults.** If any piece of the protocol is missing (no capabilities file, no author profile, no content brief), the system degrades to "invoke the platform skill normally and let it use its own defaults."
4. **No reverse dependency.** Platform skills NEVER import from dispatch, never require dispatch to be installed, never break if dispatch is uninstalled.
5. **Versioned, not locked.** This protocol has a version (v1.0). Platform skills may follow older versions or none at all — dispatch handles mismatches by falling back to defaults.

## Role summary

```
┌──────────────────────┐       ┌───────────────────────┐
│ youmind-article-     │       │ youmind-{platform}-   │
│ dispatch (Hub)       │──────▶│ article (Platform)    │
│                      │ brief │                       │
│ · Author DNA         │       │ · Platform DNA        │
│ · Platform roster    │       │ · Publishing pipeline │
│ · Brief generation   │       │ · Content adaptation  │
│ · Profile resolution │       │ · OpenAPI integration │
│ · Result aggregation │◀──────│                       │
└──────────────────────┘ result└───────────────────────┘
```

- **Hub** = `youmind-article-dispatch`: optional orchestrator; adapts to whatever platform skills are installed
- **Platform** = each `youmind-{platform}-article`: self-contained publisher; works with or without the hub
- **Shared** = this file: documents the optional interop protocol — not a requirement imposed on platform skills

## Contract — What Dispatch Sends

When dispatch invokes a platform skill, it sends a **content brief** (see `skills/youmind-article-dispatch/references/content-brief-format.md`):

```yaml
# Content Brief passed to platform skill
topic: "..."
angle: "..."
keywords: [...]
language: "en"
source_material: [...]          # optional, pre-fetched YouMind KB
resolved_author: {...}          # optional, merged author × platform DNA
constraints: {...}              # optional user overrides
```

**Key guarantee:** The `resolved_author` block is ALREADY merged for this specific platform. Hard limits, moderation norms, and depth adaptation have been applied. Platform skills do NOT need to re-merge.

## Contract — What Platform Skills Accept

Every platform skill MUST accept a content brief via the invocation context, and:

1. **Read `resolved_author` if present** — use as the voice/audience baseline before applying platform DNA
2. **Fallback to standalone mode** — if no brief is provided, the skill works with just the user's raw topic (backward compatible)
3. **Read `references/platform-dna.md`** — always, whether invoked by dispatch or standalone
4. **Honor `constraints.publish_mode`** — default to `draft` if absent
5. **Honor `constraints.override_depth_check`** — if present and true, skip mandatory depth adaptation

## Contract — What Platform Skills Return

After dispatch invokes a platform skill, the skill should produce a result that the hub can aggregate:

```yaml
# Platform skill result
platform: "devto"                # platform identifier (matches capability manifest)
status: "published"              # published | draft | failed | skipped
url: "https://dev.to/..."        # null if not available yet
result_links:                    # best clickable result entry points
  - label: "Published article"
    kind: "public_post"
    url: "https://dev.to/..."
  - label: "Dashboard / results"
    kind: "dashboard"
    url: "https://dev.to/dashboard"
title: "The final title used"    # may differ from brief due to platform adaptation
post_id: "abc123"                # platform-specific ID
error: null                      # populated only if status=failed
warnings: []                     # non-fatal issues (rate limits, partial success)
conformance_report:              # from playbook Step 7/8
  applied_rules: [...]
  deliberate_deviations: [...]
  unresolved_mismatches: [...]
```

`result_links` is the durable field dispatch should rely on when users want to check reads, likes, comments, or next-step actions after publish. If a platform cannot provide a direct analytics URL, return the best platform entry URL instead.

## Contract — Platform Capability Manifest

Each platform skill declares its capabilities in `dispatch-capabilities.yaml` at the skill root. Dispatch reads this dynamically — it does NOT hardcode platform details.

```yaml
# skills/youmind-{platform}-article/dispatch-capabilities.yaml
platform: "devto"
skill_name: "youmind-devto-article"
display_name: "Dev.to"

# One-line description for dispatch onboarding and roster display.
tagline: "Developer tutorials, OSS showcases"

# Audience summary (observable, non-stereotyping).
audience: "Developers, OSS contributors"

# Content types this platform is optimized for.
best_for:
  - "technical tutorials"
  - "tool reviews"
  - "experience reports"

# Operations this skill supports (intent matrix from Content Modes).
supported_operations:
  - generate
  - adapt
  - condense
  - translate
  - localize
  - revive
  - excerpt

# Hard platform constraints dispatch should know about without loading platform-dna.md.
hard_limits:
  max_title_chars: 60
  max_tags: 4
  max_cover_image: "1000x420"

# Default publish behavior.
defaults:
  publish_mode: "draft"

# Auth / setup requirements (for roster validation).
auth:
  type: "youmind-openapi"                            # always this — all skills route through YouMind
  connector_url: "https://youmind.com/settings/connector"
  local_config_required: "youmind.api_key"          # only field required in local config.yaml
```

## Contract — Standalone vs Dispatch Mode

Platform skills MUST work in both modes:

### Standalone mode
User invokes the platform skill directly (`"Write an article about X for this platform"`):
- No content brief is provided
- Skill follows its own pipeline from scratch
- **Fallback for author DNA**: skill MAY read `~/.youmind/author-profile.yaml` to apply user voice/preferences. If the shared profile does not exist, proceed with platform defaults. Legacy fallback paths are optional migration aids, not the canonical location.

### Dispatch mode
Dispatch invokes the platform skill with a content brief:
- `resolved_author` is already merged for this platform
- Skill uses it directly as the voice baseline
- Skill does NOT re-merge or re-read the raw author profile

## Contract — Version and Compatibility

This contract is versioned. Current version: `1.0`.

Platform skills declare the contract version they implement in their `dispatch-capabilities.yaml`:

```yaml
contract_version: "1.0"
```

Dispatch checks compatibility before dispatching. Mismatched versions produce a clear error, not silent failure.

## Source-of-truth files

| File | Owned by | Purpose |
|------|----------|---------|
| `shared/DISPATCH_CONTRACT.md` (this file) | Shared | The interface definition |
| `skills/youmind-article-dispatch/SKILL.md` | Hub | Hub behavior, onboarding, dispatch pipeline |
| `skills/youmind-article-dispatch/references/content-brief-format.md` | Hub | Brief schema detail |
| `~/.youmind/author-profile.yaml` | Shared user home | User's cross-platform author DNA |
| `~/.youmind/dispatch-roster.yaml` | Shared user home | User's active platform list |
| `skills/youmind-{platform}-article/SKILL.md` | Platform | Platform skill behavior |
| `skills/youmind-{platform}-article/references/platform-dna.md` | Platform | Platform behavior observable DNA |
| `skills/youmind-{platform}-article/dispatch-capabilities.yaml` | Platform | Capability manifest (this file's spec) |
