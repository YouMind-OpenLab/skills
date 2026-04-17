# `~/.youmind/` — Shared YouMind Home Directory Convention

> This document defines a user-home convention used by the YouMind family of skills
> (`youmind-article-dispatch` + `youmind-{platform}-article` × 7). It is a cross-skill
> sharing point that makes every skill independently installable while still enabling
> data sharing when multiple are installed.

## Why

Previously, user data (author profile, drafts, publish history) lived inside each skill's
directory. This broke two things:

1. **Independence:** If Author DNA lived only in `skills/youmind-article-dispatch/`,
   a user who installed just ONE platform skill lost access to their voice preferences.
2. **Cross-skill sharing:** If each platform skill had its own draft/history directory,
   the user's YouMind work was fragmented across 8+ places with no unified view.

`~/.youmind/` resolves both: it's a **skill-agnostic, user-scoped home** that any
YouMind skill can read from or write to. Each skill remains self-contained (it doesn't
require any other skill), but when multiple are installed they share one source of truth.

## Location

```
$HOME/.youmind/                        # Linux / macOS
%USERPROFILE%\.youmind\                # Windows (via Node.js `os.homedir()`)
```

Skills resolve this via `os.homedir()` + `.youmind` (Node) or `Path.home() / ".youmind"` (Python).

## Directory layout

```
~/.youmind/
├── config.yaml                # SHARED — YouMind API key + base URL (filled once, read by every skill)
├── author-profile.yaml        # Cross-skill writing DNA (voice / audience / content / language)
├── learning-log.yaml          # Append-only DNA learning signals (5-source pipeline)
├── dispatch-roster.yaml       # User's active platform list (only read/written by dispatch hub)
│
├── config/                    # Per-skill OVERRIDES — only skill-specific knobs (optional; most skills ship empty)
│   ├── youmind-wechat-article.yaml   # e.g. theme + theme_color
│   └── …                             # other skills may add small overrides later
│
├── articles/                  # Canonical local article drafts, scoped by platform
│   ├── devto/
│   │   └── <slug>.md
│   ├── ghost/
│   │   └── <slug>.md
│   ├── hashnode/
│   ├── qiita/
│   ├── wechat/
│   │   └── <client>/<slug>.md
│   ├── wordpress/
│   └── x/
│       └── <slug>.md
│
├── history/                   # Published-article history (per platform, per client where applicable)
│   ├── devto.yaml
│   ├── ghost.yaml
│   ├── hashnode.yaml
│   ├── qiita.yaml
│   ├── wechat-<client>.yaml   # wechat is multi-client; one file per client
│   ├── wordpress.yaml
│   └── x.yaml
│
└── clients/                   # WeChat-specific: per-client style/playbook/lessons
    └── <client>/
        ├── style.yaml
        ├── playbook.md        # optional; generated or hand-written
        ├── history.yaml       # mirror of ../history/wechat-<client>.yaml for wechat toolkit
        ├── corpus/            # reference articles for playbook generation
        └── lessons/           # extracted edit signals
```

## Resolution order (every skill follows this)

### For user data (author profile, history, articles, etc.)

1. **`~/.youmind/<file>`** — canonical shared location (preferred)
2. **`<skill>/output/`** or **`<skill>/<file>`** — legacy skill-local fallback
3. **Onboarding** — create `~/.youmind/<file>` from template + user answers

When writing, the skill writes to `~/.youmind/<file>` FIRST. If that path is not writable,
fall back to skill-local and warn the user.

### For config (YouMind API key + skill-specific knobs)

Skills follow a **three-layer merge**: shared → overrides → legacy.

1. **`~/.youmind/config.yaml`** — shared YouMind credentials (fill once, all skills read)
2. **`~/.youmind/config/<skill>.yaml`** — per-skill overrides (optional; only for skill-specific fields)
3. **`skills/<name>/config.yaml`** — legacy skill-local fallback (pre-`~/.youmind/` installs)

Final config = **shared ⊕ overrides ⊕ legacy** (later layers override earlier ones where keys conflict).

**Design principle:** `youmind.api_key` and `youmind.base_url` belong to the user, not to any one skill.
They live in the shared `config.yaml` — filled once, used everywhere. Skill-specific preferences
(WeChat `theme`, future per-skill knobs) live in per-skill override files — small, additive, optional.

## Creation semantics

- `~/.youmind/` is created lazily on first use — **any** skill may `mkdir -p` it
- Subdirectories (`articles/{platform}/`, `history/`, `clients/`) are created on demand
- The `.youmind` prefix marks it as an app dotfile (hidden by default, ignored by most
  backup tools unless explicitly included)

## Privacy

- `~/.youmind/` is **local to the user's machine**. Nothing is uploaded unless the user
  explicitly invokes a publish command.
- Platform credentials do NOT live here. They continue to live encrypted in YouMind's
  Connector Settings (server-side). Only the `youmind.api_key` in each skill's
  `config.yaml` bridges to YouMind.
- Do NOT check `~/.youmind/` into git. It is a user home directory, not project source.

## Backwards compatibility

Each skill ships an **example template** (`author-profile.example.yaml`, etc.) so users
can see the expected schema. On first run:

- If `~/.youmind/<file>` exists → use it.
- If it doesn't but a skill-local file exists (legacy install) → migrate it by
  copying to `~/.youmind/<file>` after user confirmation.
- If neither exists → run onboarding, write to `~/.youmind/<file>`.

## What lives WHERE (canonical table)

| Data | Canonical location | Writer(s) | Reader(s) | Upgrade-safe? |
|------|-------------------|-----------|-----------|:-------------:|
| Author DNA (voice/audience/content) | `~/.youmind/author-profile.yaml` | any skill (onboarding); dispatch (GUI editor) | all skills | ✅ |
| Learning log (DNA signals) | `~/.youmind/learning-log.yaml` | dispatch; optionally any skill | dispatch | ✅ |
| Dispatch roster (active platforms) | `~/.youmind/dispatch-roster.yaml` | dispatch only | dispatch only | ✅ |
| Shared YouMind credentials (api_key + base_url) | `~/.youmind/config.yaml` | user manually (or onboarding) | **every skill** | ✅ |
| Per-skill overrides (skill-specific knobs only, e.g. WeChat theme) | `~/.youmind/config/<skill>.yaml` | user manually | the owning skill | ✅ |
| Local article drafts | `~/.youmind/articles/<platform>/` | platform skill (write) | platform skill (read) | ✅ |
| Published history | `~/.youmind/history/<platform>.yaml` | platform skill (append on publish) | platform skill (dedup); dispatch (analytics) | ✅ |
| WeChat client configs | `~/.youmind/clients/<client>/` | wechat skill (onboarding) | wechat skill only | ✅ |
| Platform credentials (OAuth tokens, app passwords) | **NOT here** — YouMind Connector Settings (server-side encrypted) | YouMind server | YouMind server | ✅ (server-side) |
| Legacy per-skill `config.yaml` | `skills/<name>/config.yaml` | user manually | skill (fallback read) | ⚠️ at risk of skill upgrade wipe |

## Upgrade safety — why data lives OUTSIDE the skill directory

Skill upgrades (via ClawHub CLI, `git pull`, manual reinstall, etc.) may replace the contents of `skills/<name>/` wholesale. Any file inside the skill directory — even git-ignored ones — is at risk of being overwritten or deleted by an aggressive installer.

**Everything in `~/.youmind/` is immune to this risk** because it lives in the user's home directory, outside any skill's scope. A skill upgrade, reinstall, or even complete removal leaves `~/.youmind/` untouched.

### Upgrade checklist (what survives)

| Scenario | Survives? | Why |
|----------|:---------:|-----|
| `ClawHub update` (skill version bump) | ✅ | `~/.youmind/` is outside skill dir |
| `rm -rf skills/<name>/` (full skill removal) | ✅ | Same — home dir is separate |
| Switching machines with home dir backup | ✅ | `~/.youmind/` is part of your home; back it up with your home |
| Skill-local `config.yaml` wiped by installer | ⚠️ | Mitigated: use `~/.youmind/config/<skill>.yaml` as canonical |
| Skill-local `output/` wiped by installer | ⚠️ | Mitigated: canonical drafts live at `~/.youmind/articles/<platform>/` |

### Migration strategy on upgrade

When a skill starts up and detects a newer version is running, it should:

1. Check `~/.youmind/config/<skill>.yaml`. If present → use it.
2. If not, check legacy `skills/<name>/config.yaml`. If present → offer a one-time migration: copy to `~/.youmind/config/<skill>.yaml`, leave a stub at the old location pointing to the new one.
3. Same pattern for `output/` → `~/.youmind/articles/<platform>/`.
4. Never force migration. Legacy paths continue to work as fallback reads.

### How to back up `~/.youmind/`

Include `~/.youmind/` in your home-directory backup strategy (Time Machine, rsync, iCloud, Dropbox, Syncthing, etc.). Everything is plain YAML/Markdown — portable, human-readable, diffable. No binary blobs, no databases.

## Migration path for existing installs

Existing users have data in `skills/<name>/output/`, `skills/youmind-article-dispatch/author-profile.yaml`, etc.
First time they run a skill after this convention is adopted:

1. Skill checks `~/.youmind/<file>`. If absent:
2. Checks skill-local legacy path. If present:
3. Asks user: "I found your existing <file> in the skill directory. Move to `~/.youmind/` as the shared home?"
4. On yes: `mv` to `~/.youmind/<file>` + replace legacy path with a stub pointing to the new location.
5. On no: keep legacy path working; skill reads from there. User can migrate later.

No data loss. No forced migration. Graceful default.

## Skill contract (summary)

Every YouMind skill that reads/writes user data MUST:

1. Prefer `~/.youmind/<file>` as the canonical path.
2. Accept legacy `<skill>/<file>` as fallback read; emit a one-time migration hint.
3. Lazy-create `~/.youmind/` and its subdirs on first write.
4. Never hardcode other skills' paths (no `../youmind-article-dispatch/...`).
5. Work in isolation: a user with only this skill installed gets full functionality.
