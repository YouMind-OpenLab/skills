/**
 * wechat-api.ts — MOCK IMPLEMENTATION
 *
 * ⚠️ This file is a mock. The skill talks to WeChat exclusively through
 * YouMind's OpenAPI proxy, but YouMind has not yet shipped the `/wechat/*`
 * namespace on that OpenAPI. This mock lets the rest of the skill
 * (publisher, CLI, fetch-stats) be built and smoke-tested end-to-end right
 * now, without a real backend.
 *
 * Swap-in plan when the real YouMind endpoints ship:
 *   1. YouMind will expose `/wechat/access-token`, `/wechat/upload-image`,
 *      and `/wechat/upload-thumb` endpoints whose request/response shape
 *      mirrors WeChat's own cgi-bin API. YouMind holds the user's WeChat
 *      appid/secret server-side and proxies access-token management plus
 *      media uploads. The only auth difference is that YouMind accepts
 *      `x-api-key: <youmind_api_key>` instead of a WeChat access_token —
 *      so callers stop needing appid/secret entirely.
 *   2. Replace each mock function body below with a `fetch()` POST/GET to
 *      the corresponding `https://youmind.com/openapi/v1/wechat/<op>`
 *      using the `x-api-key` header (same helper pattern as youmind-api.ts).
 *   3. Keep the exported function signatures stable — they ARE the swap-in
 *      contract. Nothing in publisher.ts / cli.ts / fetch-stats.ts should
 *      need to change (the appid/secret args will simply continue to be
 *      ignored, and can be dropped in a later cleanup).
 *   4. Delete the `mockState` block below at that point.
 */

// ---------------------------------------------------------------------------
// Mock state — module-scoped counters so each call gets a unique fake ID.
// Not exported; swap-in code should delete this whole block.
// ---------------------------------------------------------------------------

interface MockState {
  imageCounter: number;
  thumbCounter: number;
}

const mockState: MockState = {
  imageCounter: 0,
  thumbCounter: 0,
};

// ---------------------------------------------------------------------------
// Exported mock functions — stable signatures, bodies are fakes.
// ---------------------------------------------------------------------------

/**
 * Obtain a WeChat access token. In the real swap-in, this will hit
 * `/wechat/access-token` on the YouMind proxy; appid/secret are accepted
 * for backwards compatibility but ignored (YouMind holds the real creds).
 */
export async function getAccessToken(
  _appid: string,
  _secret: string,
  _forceRefresh = false,
): Promise<string> {
  return `mock_wechat_access_token_${Date.now()}`;
}

/**
 * Upload an in-article image and return its hosted URL. Mock returns a
 * fake mmbiz URL — image content is not actually read or transmitted.
 */
export async function uploadImage(
  _accessToken: string,
  _imagePath: string,
): Promise<string> {
  mockState.imageCounter += 1;
  return `https://mock.weixin.qq.com/mmbiz_png/mock_image_${Date.now()}_${mockState.imageCounter}.jpg`;
}

/**
 * Upload a cover/thumbnail image and return its media_id. Mock returns a
 * fake media_id — image content is not actually read or transmitted.
 */
export async function uploadThumb(
  _accessToken: string,
  _imagePath: string,
): Promise<string> {
  mockState.thumbCounter += 1;
  return `mock_wechat_thumb_${Date.now()}_${mockState.thumbCounter}`;
}
