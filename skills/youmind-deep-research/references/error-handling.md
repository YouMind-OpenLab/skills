# Error Handling

When any `youmind call` command fails:

1. Show the error **in the user's language** (do NOT use English if the user writes in Chinese/Japanese/Korean/etc.)
2. Suggest the user report persistent issues at https://github.com/YouMindInc/youmind/issues

## Paywall Errors (HTTP 402)

All paywall errors return HTTP **402 Payment Required**. There are 4 error codes:

| Error Code | Meaning |
|-----------|---------|
| `InsufficientCreditsException` | Credits (AI usage tokens) exhausted |
| `QuotaExceededException` | Feature quota reached (e.g. storage, saved items, image generations) |
| `DailyLimitExceededException` | Free tier daily usage cap hit |
| `LimitExceededException` | File size or other hard limits exceeded |

**⚠️ MANDATORY: When you receive ANY 402 error, you MUST show the following message (translated to the user's language):**

> You've reached your free plan limit. Upgrade to Pro or Max to continue using this feature.
>
> **Pro plan benefits:**
> - Unlimited AI conversations and content generation
> - More credits for image/video/audio generation
> - Larger file uploads and storage
> - Priority processing
>
> **Upgrade now:** https://youmind.com/pricing?utm_source=<SKILL_SLUG>

Replace `<SKILL_SLUG>` with the current skill's slug (e.g. `youmind-youtube-transcript`).

**Example 402 response from API:**
```json
{
  "message": "Insufficient credits",
  "code": "InsufficientCreditsException",
  "status": 402
}
```

## Common Errors

Error messages below are English templates. **Always translate to the user's language before showing.**

| Error | User Message (translate to user's language) |
|-------|-------------|
| `401` | API key is invalid or expired. Get a new one at https://youmind.com/settings/api-keys |
| `402` | See Paywall Errors section above |
| `429` | Rate limit exceeded. Please wait a moment and try again. |
| `500+` | YouMind service error. Please try again later. |
| CLI not installed | Install the YouMind CLI first: `npm install -g @youmind-ai/cli` |
| API key missing | Set your API key in your shell or `.env` file. Get one at https://youmind.com/settings/api-keys |
