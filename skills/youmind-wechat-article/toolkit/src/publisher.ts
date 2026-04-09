/**
 * publisher.ts — MOCK IMPLEMENTATION
 *
 * ⚠️ This file is a mock. `createDraft` is the final step in the WeChat
 * publish flow; it will eventually hit YouMind's proxy at
 * `https://youmind.com/openapi/v1/wechat/draft/add` with the `x-api-key`
 * header once those endpoints ship. Until then, this mock lets the full
 * CLI publish flow run end-to-end without talking to WeChat directly.
 *
 * Swap-in plan: replace the body of `createDraft` with a `fetch()` POST
 * to the proxy endpoint, preserving the request/response shape. The
 * exported type signatures (`CreateDraftOptions`, `DraftResult`) ARE the
 * stable contract — nothing in cli.ts should need to change.
 */

export interface DraftResult {
  mediaId: string;
}

export interface CreateDraftOptions {
  accessToken: string;
  title: string;
  html: string;
  digest: string;
  thumbMediaId?: string;
  author?: string;
}

// Module-scoped counter so each mock draft gets a unique id.
let mockDraftCounter = 0;

export async function createDraft(options: CreateDraftOptions): Promise<DraftResult> {
  // Access the options to satisfy "used" semantics — real implementation
  // will of course POST these fields to the proxy.
  void options.accessToken;
  void options.title;
  void options.html;
  void options.digest;
  void options.thumbMediaId;
  void options.author;

  mockDraftCounter += 1;
  return { mediaId: `mock_wechat_draft_${Date.now()}_${mockDraftCounter}` };
}
