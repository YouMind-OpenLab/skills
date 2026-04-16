# YouMind Home Directory

YouMind article skills now share one canonical home directory:

```text
~/.youmind/
  config.yaml
  config/
    youmind-wechat-article.yaml
    youmind-x-article.yaml
    ...
  author-profile.yaml
  dispatch-roster.yaml
  articles/
    devto/
    ghost/
    wechat/
    x/
    ...
  clients/
    <client>/
      style.yaml
      history.yaml
      playbook.md
```

## Resolution Order

For article-skill config, use this order:

1. `~/.youmind/config/<skill>.yaml`
2. `~/.youmind/config.yaml`

This is now a hard requirement. Article skills do **not** read repo-local `config.yaml` files or `~/.youmind-skill/credentials.yaml` anymore.

## Canonical Files

- Shared API credentials: `~/.youmind/config.yaml`
- Skill-specific overrides: `~/.youmind/config/<skill>.yaml`
- Cross-platform author profile: `~/.youmind/author-profile.yaml`
- Dispatch platform roster: `~/.youmind/dispatch-roster.yaml`
- Local article drafts: `~/.youmind/articles/<platform>/<slug>.md`

## Migration Notes

- If you still have `~/.youmind-skill/credentials.yaml`, migrate the needed values into `~/.youmind/config.yaml` or `~/.youmind/config/<skill>.yaml`.
- If a skill still has a local `config.yaml`, treat it as obsolete and remove or ignore it.
- Put local backend overrides in `~/.youmind/config/<skill>.yaml` instead of editing tracked files.
