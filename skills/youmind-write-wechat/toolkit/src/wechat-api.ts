/**
 * WeChat API utilities: access token, image upload, cover upload.
 */

import { createReadStream, statSync } from 'node:fs';
import { basename } from 'node:path';
import { lookup } from 'node:dns';

// --- Token Cache ---

interface TokenCache {
  accessToken: string;
  expiresAt: number;
}

const tokenCache = new Map<string, TokenCache>();

export async function getAccessToken(
  appid: string,
  secret: string,
  forceRefresh = false,
): Promise<string> {
  const now = Date.now() / 1000;

  if (!forceRefresh && tokenCache.has(appid)) {
    const cached = tokenCache.get(appid)!;
    if (now < cached.expiresAt) return cached.accessToken;
  }

  const url = new URL('https://api.weixin.qq.com/cgi-bin/token');
  url.searchParams.set('grant_type', 'client_credential');
  url.searchParams.set('appid', appid);
  url.searchParams.set('secret', secret);

  const resp = await fetch(url.toString());
  const data = (await resp.json()) as Record<string, unknown>;

  if (!data.access_token) {
    throw new Error(
      `WeChat API error: errcode=${data.errcode ?? 'unknown'}, errmsg=${data.errmsg ?? 'unknown'}`,
    );
  }

  const accessToken = data.access_token as string;
  const expiresIn = (data.expires_in as number) || 7200;

  tokenCache.set(appid, {
    accessToken,
    expiresAt: now + expiresIn - 300,
  });

  return accessToken;
}

export async function uploadImage(accessToken: string, imagePath: string): Promise<string> {
  const url = `https://api.weixin.qq.com/cgi-bin/media/uploadimg?access_token=${accessToken}`;

  const buffer = await import('node:fs/promises').then(fs => fs.readFile(imagePath));
  const ext = basename(imagePath).split('.').pop()?.toLowerCase() || 'jpg';
  const mimeMap: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp' };
  const blob = new Blob([buffer], { type: mimeMap[ext] || 'image/jpeg' });
  const formData = new FormData();
  formData.append('media', blob, basename(imagePath));

  const resp = await fetch(url, { method: 'POST', body: formData });
  const data = (await resp.json()) as Record<string, unknown>;

  if (!data.url) {
    throw new Error(
      `WeChat upload_image error: errcode=${data.errcode ?? 'unknown'}, errmsg=${data.errmsg ?? 'unknown'}`,
    );
  }

  return data.url as string;
}

export async function uploadThumb(accessToken: string, imagePath: string): Promise<string> {
  const url = `https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=${accessToken}&type=thumb`;

  const buffer = await import('node:fs/promises').then(fs => fs.readFile(imagePath));
  const ext = basename(imagePath).split('.').pop()?.toLowerCase() || 'jpg';
  const mimeMap: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp' };
  const blob = new Blob([buffer], { type: mimeMap[ext] || 'image/jpeg' });
  const formData = new FormData();
  formData.append('media', blob, basename(imagePath));

  const resp = await fetch(url, { method: 'POST', body: formData });
  const data = (await resp.json()) as Record<string, unknown>;

  if (!data.media_id) {
    throw new Error(
      `WeChat upload_thumb error: errcode=${data.errcode ?? 'unknown'}, errmsg=${data.errmsg ?? 'unknown'}`,
    );
  }

  return data.media_id as string;
}
