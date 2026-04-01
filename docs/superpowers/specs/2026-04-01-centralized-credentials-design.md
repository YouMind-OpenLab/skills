# Centralized Credential Storage

## Problem

Each of the 11 article skills stores API credentials in its own `config.yaml`. The YouMind API key is duplicated across all skills. Users must configure each skill separately.

## Design

### Central config file

Location: `~/.youmind-skill/credentials.yaml`

Contains all platform credentials in one file. A `credentials.example.yaml` template is provided in the repo root for reference.

### Loading priority (high to low)

```
~/.youmind-skill/credentials.yaml  →  skill-local config.yaml  →  config.example.yaml
```

Central values are loaded first. Local config values override central when present (non-empty). This provides graceful degradation for the published wechat skill and any existing local configs.

### Merge logic

Per-section shallow merge. For each config section (e.g., `youmind`, `devto`), merge central and local objects. Local non-empty values win.

```
central: { youmind: { api_key: "sk-xxx" }, devto: { api_key: "aaa" } }
local:   { devto: { api_key: "bbb" } }
result:  { youmind: { api_key: "sk-xxx" }, devto: { api_key: "bbb" } }
```

### `credentials.yaml` structure

```yaml
youmind:
  api_key: ""
  base_url: "https://youmind.com/openapi/v1"

wechat:
  appid: ""
  secret: ""
  author: ""

devto:
  api_key: ""

medium:
  token: ""
  publication_id: ""

linkedin:
  access_token: ""
  person_urn: ""
  organization_urn: ""

x:
  bearer_token: ""
  access_token: ""
  api_key: ""
  api_secret: ""
  access_token_legacy: ""
  access_token_secret: ""

reddit:
  client_id: ""
  client_secret: ""
  username: ""
  password: ""
  user_agent: ""

wordpress:
  site_url: ""
  username: ""
  app_password: ""

facebook:
  page_id: ""
  page_access_token: ""

instagram:
  business_account_id: ""
  access_token: ""

hashnode:
  token: ""
  publication_id: ""

ghost:
  site_url: ""
  admin_api_key: ""

image:
  default_provider: "youmind"
  providers:
    gemini:
      api_key: ""
    openai:
      api_key: ""
    doubao:
      api_key: ""
      base_url: "https://ark.cn-beijing.volces.com/api/v3"
```

### Files to change

For each skill, update two files:

1. **`{platform}-api.ts`** — `loadConfig()` merges central + local for platform credentials
2. **`youmind-api.ts`** — `loadConfig()` merges central + local for YouMind credentials

Add a shared helper pattern to each file:

```typescript
function loadCentralCredentials(): Record<string, any> {
  const home = process.env.HOME || process.env.USERPROFILE || '';
  const p = resolve(home, '.youmind-skill', 'credentials.yaml');
  if (existsSync(p)) {
    return parseYaml(readFileSync(p, 'utf-8')) ?? {};
  }
  return {};
}
```

### New files

1. `credentials.example.yaml` — template at repo root, users copy to `~/.youmind-skill/credentials.yaml`

### Skills affected (11 total)

youmind-wechat-article, youmind-devto-article, youmind-medium-article, youmind-linkedin-article, youmind-x-article, youmind-reddit-article, youmind-wordpress-article, youmind-facebook-article, youmind-instagram-article, youmind-hashnode-article, youmind-ghost-article

### Backward compatibility

- Only wechat skill is published; others are not yet released
- All skills gracefully fall back to local `config.yaml` if central file doesn't exist
- No breaking changes for existing wechat skill users
