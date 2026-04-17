# YouMind Home Directory

YouMind article skills share one canonical home directory:

```text
~/.youmind/
  config.yaml
  config/
    youmind-tumblr-article.yaml
    ...
  author-profile.yaml
  dispatch-roster.yaml
  articles/
    tumblr/
    wordpress/
    x/
    ...
```

## Resolution Order

For article-skill config, use this order:

1. `~/.youmind/config/youmind-tumblr-article.yaml`
2. `~/.youmind/config.yaml`

## Canonical Files

- Shared API credentials: `~/.youmind/config.yaml`
- Skill-specific overrides: `~/.youmind/config/youmind-tumblr-article.yaml`
- Cross-platform author profile: `~/.youmind/author-profile.yaml`
- Dispatch platform roster: `~/.youmind/dispatch-roster.yaml`
- Local Tumblr drafts: `~/.youmind/articles/tumblr/<slug>.html`
