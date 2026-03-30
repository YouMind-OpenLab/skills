/**
 * WeChat draft creation API wrapper.
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

export async function createDraft(options: CreateDraftOptions): Promise<DraftResult> {
  const { accessToken, title, html, digest, thumbMediaId, author } = options;

  const article: Record<string, unknown> = {
    title,
    author: author || '',
    digest,
    content: html,
    show_cover_pic: 0,
  };

  if (thumbMediaId) {
    article.thumb_media_id = thumbMediaId;
  }

  const body = { articles: [article] };

  const resp = await fetch(
    `https://api.weixin.qq.com/cgi-bin/draft/add?access_token=${accessToken}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(body),
    },
  );

  const data = (await resp.json()) as Record<string, unknown>;

  const errcode = (data.errcode as number) ?? 0;
  if (errcode !== 0) {
    throw new Error(
      `WeChat create_draft error: errcode=${errcode}, errmsg=${data.errmsg ?? 'unknown'}`,
    );
  }

  if (!data.media_id) {
    throw new Error(`WeChat create_draft error: missing media_id in response: ${JSON.stringify(data)}`);
  }

  return { mediaId: data.media_id as string };
}
