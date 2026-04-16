# Dispatch Contract v1.0

This document defines the optional interoperability layer between `youmind-article-dispatch` and any standalone `youmind-{platform}-article` skill.

## Goals

- Keep platform skills fully standalone.
- Let dispatch discover richer capability metadata when available.
- Make unknown fields safe to ignore.

## What Dispatch May Read

If a platform skill ships a root-level `dispatch-capabilities.yaml`, dispatch may read it to learn:

- platform identity
- supported operations
- hard limits
- default publishing behavior
- auth expectations
- reference file hints

If the manifest is missing, dispatch falls back to sensible defaults.

## Minimal Manifest Shape

```yaml
contract_version: "1.0"
platform: "devto"
skill_name: "youmind-devto-article"
display_name: "Dev.to"
supported_operations:
  - generate
defaults:
  publish_mode: "draft"
auth:
  type: "youmind-openapi"
  local_config_required: "youmind.api_key"
```

## Common Optional Fields

- `tagline`
- `audience`
- `best_for`
- `hard_limits`
- `special_notes`
- `references`

## Brief Shape Dispatch May Pass

Dispatch may pass a richer content brief with fields such as:

- `topic`
- `angle`
- `keywords`
- `source_markdown`
- `resolved_author`
- `platform_overrides`

Platform skills should treat every extra field as optional. Unknown fields must not break standalone execution.

## Relative Path Rule

Paths inside `references` are resolved relative to the platform skill root.

## Result Shape

Dispatch prefers a normalized result with fields such as:

- `status`
- `platform`
- `title`
- `url`
- `draft_id`
- `post_id`
- `output_path`
- `conformance_report`
- `notes`

Platform skills may include additional fields. Dispatch should ignore what it does not understand.

## Compatibility Rules

- `contract_version: "1.0"` means additive changes only.
- Missing optional fields are valid.
- Removing the manifest must never break the platform skill.
- Dispatch is an orchestrator, not a runtime dependency.
