# Setup

Use this file for the full one-time installation flow. `SKILL.md` should keep only the short entrypoint.

## Installation

```bash
cd toolkit && npm install && npm run build && cd ..
pip install -r requirements.txt
mkdir -p ~/.youmind/config
cp shared/config.example.yaml ~/.youmind/config.yaml
```

Fill `youmind.api_key` in `~/.youmind/config.yaml`. That is the only required local credential.

## Config Resolution

- Shared YouMind credentials: `~/.youmind/config.yaml`
- WeChat-specific overrides: `~/.youmind/config/youmind-wechat-article.yaml`
- Resolution order: shared → override

See `shared/YOUMIND_HOME.md` for the home-directory layout.

## WeChat Binding

Bind the WeChat Official Account once in [YouMind Connector Settings](https://youmind.com/settings/connector?utm_source=youmind-wechat-article). Paste AppID + AppSecret there; YouMind encrypts and proxies WeChat calls, so the skill does not store the secret locally and does not need IP whitelist management.

## Verification

```bash
node toolkit/dist/cli.js validate
```

Expected: `OK: Connected to WeChat Official Account wxxxxxxxxxx` plus token expiry information.

For the screenshot walkthrough and secret-rotation notes, see `README.md`.
