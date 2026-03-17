# Environment Configuration (Development Only)

> ⚠️ This file is for local development/testing only.
> It is excluded from ClawHub packages via .clawhubignore.

## Preview Environment

For testing against the preview API:

```bash
export YOUMIND_ENV=preview
export YOUMIND_API_KEY_PREVIEW=sk-ym-xxx
```

## Environment Detection

| `YOUMIND_ENV` | Endpoint | API Key Variable |
|---------------|----------|-----------------|
| *(unset or `production`)* | `https://youmind.com` | `YOUMIND_API_KEY` |
| `preview` | `https://preview.youmind.com` | `YOUMIND_API_KEY_PREVIEW` |

When preview is active, append to all `youmind call` commands:

```bash
--endpoint https://preview.youmind.com --api-key $YOUMIND_API_KEY_PREVIEW
```
