# Content Adaptation Matrix — Author DNA × Platform DNA

> This document defines how the dispatch skill merges **author preferences** (from `author-profile.yaml`) with **platform constraints** (from each skill's `platform-dna.md`) to produce a coherent content brief.

## The Two Dimensions

```
Author DNA (who you are)          Platform DNA (what the platform rewards)
─────────────────────────         ──────────────────────────────────────
Voice register                    Format constraints (length, chars, tags)
Audience definition               Discourse norms (opening, closing, citation)
Content depth preference          Moderation patterns (what gets flagged)
Storytelling level                Platform features (cards, threads, callouts)
Code density                      Hard limits (absolute constraints)
Language preferences              Anti-patterns (what underperforms)
Signature/anti patterns           Example calibration (what "good" looks like)
Platform-specific overrides       
```

## Merge Priority Rules

When author preferences conflict with platform norms, apply this resolution hierarchy:

### Priority 1 — Hard limits: Platform DNA ALWAYS wins

These are absolute constraints. No author preference can override them.

| Platform | Hard limit examples |
|----------|-------------------|
| X | 280 chars/tweet, 4 images, no markdown |
| Dev.to | 4 tags max, 30 chars/tag, lowercase only |
| Qiita | 5 tags, case-sensitive, cdn.gooo.ai blocked |
| Ghost | No H1 in body, HTML body via API |
| WordPress | H1 = title only, upload_max_filesize |
| Hashnode | 5 tags, cover image for featured |
| WeChat | ≤64 char title, HTML subset, no external links |

**Resolution:** Enforce platform limit. Inform user if their preference conflicts (e.g., "Your profile prefers 2500-word essays but X threads work best at 5-15 tweets").

### Priority 2 — Moderation norms: Platform DNA ALWAYS wins

Content that violates platform moderation norms gets removed or suppressed.

| Platform | Moderation norm examples |
|----------|------------------------|
| Qiita | No marketing language (宣伝臭い = community rejection) |
| Dev.to | No clickbait, no gated content |
| X | No engagement bait, no excessive hashtags |
| WeChat | No external links except via 阅读原文 |

**Resolution:** Override author preferences that conflict. If the author's `signature_patterns` include promotional language, suppress on platforms that reject it.

### Priority 3 — Register/tone: MERGE

The most nuanced merge — author provides the baseline, platform adjusts.

| Author register | Platform norm | Result |
|----------------|--------------|--------|
| conversational-technical | Qiita: 丁寧語 expected | Use author's technical style BUT in 丁寧語 form |
| casual | LinkedIn: professional expected | Casual-professional hybrid: approachable but credible |
| formal | Dev.to: colleague-tone | Formal expertise in accessible language |
| editorial | X: punchy/short | Editorial authority compressed to 280 chars |

**Resolution:** Start from author's register as baseline. Apply platform's register adjustment as a filter. If the author has a `platform_overrides.{platform}.register`, use that instead.

### Priority 4 — Structure preferences: Author preference UNLESS platform format requires otherwise

Platform playbooks encode required structural elements (e.g., Dev.to requires TL;DR; Ghost requires custom excerpt; X requires hook tweet). These are non-negotiable. Author structural preferences apply within those constraints.

| Author preference | Platform requirement | Result |
|------------------|---------------------|--------|
| story-first | Dev.to: TL;DR required | TL;DR first (platform required), THEN story flow (author preference in body) |
| code-first | Ghost: excerpt + editorial opening required | Excerpt written separately; code example early in body (author preference after platform requirement met) |
| data-first | X: hook tweet required | Stat/data AS the hook tweet (natural merge — both satisfied) |
| minimal headings | Hashnode: scannable H2/H3 expected | H2/H3 headings required for table of contents (platform wins); author controls heading STYLE |

**Resolution:** Platform required structural elements are always included. Author preference controls the flow and emphasis WITHIN that structure. If an author preference directly contradicts a platform structural requirement, the platform requirement wins.

### Priority 5 — Content depth: Author DNA wins with MANDATORY adaptation on mismatch

If the author's depth preference mismatches the platform's audience expectation, this is NOT a warning — it's a mandatory adaptation step. A warning alone accepts known audience failure.

| Author depth | Platform expectation | Result |
|-------------|---------------------|--------|
| beginner | Hashnode: deep-dive expected | 🔄 ADAPT: Expand outline with implementation detail, benchmarks, and gotchas to meet Hashnode depth. OR suggest Dev.to as a better fit and ask user. |
| expert | X: broad audience | 🔄 ADAPT: Rewrite outline — simplify jargon, add context sentences, use analogies. The THESIS stays expert; the LANGUAGE adapts. |
| practitioner | WordPress: SEO-general | ✅ Good match |
| expert | WeChat: general mobile audience | 🔄 ADAPT: Add 背景 (context) paragraphs before deep sections; short-paragraph constraint helps — each paragraph is one idea at general depth. |

**Resolution:** Depth mismatch triggers a mandatory outline adaptation step (not just a warning). The dispatch skill rewrites the content brief's outline and examples to bridge the gap. User can override with explicit `constraints.override_depth_check: true` in the brief, but the default is active adaptation.

### Priority 6 — Code density: Author DNA wins; platform constrains format

| Author code_density | Platform | Result |
|--------------------|----------|--------|
| high | Dev.to/Hashnode/Qiita | ✅ Natural match — code-native platforms |
| high | X | Code → screenshots (X has no syntax highlighting) |
| high | WeChat | Code → screenshots or minimal inline (公众号 renders code poorly) |
| high | Ghost | Code blocks OK but test email rendering |
| none | Qiita | ⚠️ WARN: Qiita strongly values code examples |

## Merge Algorithm (for dispatch implementation)

The dispatch skill computes a **resolved per-platform profile** — NOT the raw author profile. Each platform skill receives ONLY the resolved fields relevant to it. This prevents raw-profile leakage and irrelevant context bleed.

```
function resolveProfileForPlatform(authorProfile, platformDNA, platform):
  resolved = {}

  # Step 1: Start from author baseline
  resolved.voice = clone(authorProfile.voice)
  resolved.audience = clone(authorProfile.audience)
  resolved.content = clone(authorProfile.content)

  # Step 2: Apply platform-specific author overrides
  # CRITICAL: overrides go through the resolver, not applied raw
  overrides = authorProfile.platform_overrides[platform] or {}
  for field in overrides:
    # Only allow overrides on APPROVED fields (whitelist)
    if field in ALLOWED_OVERRIDE_FIELDS:
      resolved[field] = overrides[field]
    else:
      warnings.push("Override '{field}' blocked — not in approved field set")

  # Step 3: Apply platform hard limits (ALWAYS override, no exceptions)
  resolved.hard_limits = platformDNA.hard_limits

  # Step 4: Apply platform moderation norms (ALWAYS override)
  resolved.voice.anti_patterns = union(
    authorProfile.voice.anti_patterns,
    platformDNA.anti_patterns
  )
  for pattern in resolved.voice.signature_patterns:
    if conflictsWithModeration(pattern, platformDNA.moderation):
      warnings.push("Signature pattern '{pattern}' suppressed on {platform}")
      remove pattern

  # Step 5: Resolve register (field-by-field, not bulk merge)
  resolved.voice.register = resolveRegister(
    author_register = overrides.register or authorProfile.voice.register,
    platform_norm = platformDNA.discourse_norms.default_register
  )
  resolved.voice.perspective = authorProfile.voice.perspective  # author keeps POV
  resolved.voice.humor_level = min(authorProfile.voice.humor_level, platformDNA.humor_ceiling)

  # Step 6: Resolve depth (mandatory adaptation, not just warning)
  if !depthCompatible(resolved.audience.content_depth, platformDNA.expected_depth):
    resolved.depth_adaptation = {
      action: "mandatory_outline_rewrite",
      from: resolved.audience.content_depth,
      to: platformDNA.expected_depth,
      suggestion: suggestAlternatePlatform(resolved.audience.content_depth)
    }

  # Step 7: Constrain code format to platform capability
  resolved.content.code_format = platformDNA.code_rendering  # blocks | screenshots | minimal

  # Step 8: Strip fields irrelevant to this platform
  delete resolved.language.bilingual_strategy  # dispatch handles this, not platform skill
  delete resolved.content.typical_length  # platform DNA hard_limits control length

  return { resolved, warnings }
```

### Approved override fields (whitelist)

Platform overrides can ONLY modify these fields:

| Field | Example | Why allowed |
|-------|---------|-------------|
| `register` | "丁寧語" on Qiita | User's platform-specific voice preference |
| `max_thread_length` | 10 on X | User prefers tighter threads |
| `hook_style` | "contrarian" on X | User's preferred hook approach |
| `default_visibility` | "public" on Ghost | User's default publish state |
| `default_category` | "engineering" on WP | User's default taxonomy |
| `style_client` | "default" on WeChat | Client config selection |
| `always_include_environment` | true on Qiita | User insists on env section |

**NOT allowed in overrides** (platform DNA governs these):
- `hard_limits` (format constraints)
- `anti_patterns` (moderation)
- `code_format` (platform capability)
- `discourse_norms` (platform-level norms)

## Warnings Surfacing

Whenever the merge produces a warning (Priority 5/6 mismatches), the dispatch skill surfaces it BEFORE generating content:

```
⚠️ Platform compatibility check:

X/Twitter:
  - Your "high code density" preference → code will be rendered as screenshots (X has no syntax highlighting)
  - Your 1500-2500 word typical length → will be compressed to a 5-15 tweet thread

Qiita:
  - Your "conversational-technical" register → will be adjusted to 丁寧語 (です/ます) per your platform override

All good? Proceed, or adjust the brief?
```

## What Happens Without an Author Profile

If no `author-profile.yaml` exists:
- **All merge steps are skipped** — content brief contains only topic/angle/keywords
- **Platform skills use their own defaults** — each playbook has sensible defaults in Steps 3-4
- **Quality is not degraded** — just less personalized
- **Dispatch suggests building a profile** after the first successful run
