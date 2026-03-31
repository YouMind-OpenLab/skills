/**
 * LinkedIn API client — OAuth2 token management, UGC posts, articles, image upload.
 *
 * LinkedIn uses pre-obtained OAuth access tokens (w_member_social scope).
 * Token must be obtained via LinkedIn OAuth flow externally.
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, basename } from 'node:path';
import { parse as parseYaml } from 'yaml';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export interface LinkedInConfig {
  clientId: string;
  clientSecret: string;
  accessToken: string;
  personUrn: string;
  organizationUrn?: string;
}

export function loadLinkedInConfig(projectDir?: string): LinkedInConfig {
  const baseDir = projectDir ?? process.cwd();
  for (const name of ['config.yaml', 'config.example.yaml']) {
    const p = resolve(baseDir, name);
    if (existsSync(p)) {
      const raw = parseYaml(readFileSync(p, 'utf-8')) ?? {};
      const li = raw.linkedin ?? {};
      return {
        clientId: li.client_id ?? '',
        clientSecret: li.client_secret ?? '',
        accessToken: li.access_token ?? '',
        personUrn: li.person_urn ?? '',
        organizationUrn: li.organization_urn,
      };
    }
  }
  return { clientId: '', clientSecret: '', accessToken: '', personUrn: '' };
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

function getHeaders(token: string): Record<string, string> {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'X-Restli-Protocol-Version': '2.0.0',
    'LinkedIn-Version': '202401',
  };
}

async function linkedinPost(
  url: string, body: Record<string, unknown>, token: string,
): Promise<Record<string, unknown>> {
  const resp = await fetch(url, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`LinkedIn API POST 失败 (${resp.status}): ${text.slice(0, 400)}`);
  }

  const contentType = resp.headers.get('content-type') ?? '';
  if (contentType.includes('json')) {
    return resp.json() as Promise<Record<string, unknown>>;
  }

  const headerUrn = resp.headers.get('x-restli-id') ?? resp.headers.get('x-linkedin-id') ?? '';
  return { id: headerUrn };
}

async function linkedinGet(
  url: string, token: string,
): Promise<Record<string, unknown>> {
  const resp = await fetch(url, {
    headers: getHeaders(token),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`LinkedIn API GET 失败 (${resp.status}): ${text.slice(0, 400)}`);
  }

  return resp.json() as Promise<Record<string, unknown>>;
}

// ---------------------------------------------------------------------------
// Public API — Posts (UGC)
// ---------------------------------------------------------------------------

export interface PostResult {
  postUrn: string;
  postUrl: string;
}

export async function createTextPost(
  text: string,
  visibility: 'PUBLIC' | 'CONNECTIONS' = 'PUBLIC',
  config?: LinkedInConfig,
): Promise<PostResult> {
  const cfg = config ?? loadLinkedInConfig();
  if (!cfg.accessToken) throw new Error('LinkedIn access_token 未配置。');
  if (!cfg.personUrn) throw new Error('LinkedIn person_urn 未配置。');

  const authorUrn = cfg.organizationUrn ?? cfg.personUrn;

  const body = {
    author: authorUrn,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: { text },
        shareMediaCategory: 'NONE',
      },
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': visibility,
    },
  };

  const data = await linkedinPost(
    'https://api.linkedin.com/v2/ugcPosts', body, cfg.accessToken,
  );

  const postUrn = (data.id as string) ?? '';
  return {
    postUrn,
    postUrl: postUrn ? `https://www.linkedin.com/feed/update/${postUrn}` : '',
  };
}

export async function createImagePost(
  text: string,
  imageUrn: string,
  visibility: 'PUBLIC' | 'CONNECTIONS' = 'PUBLIC',
  config?: LinkedInConfig,
): Promise<PostResult> {
  const cfg = config ?? loadLinkedInConfig();
  if (!cfg.accessToken) throw new Error('LinkedIn access_token 未配置。');

  const authorUrn = cfg.organizationUrn ?? cfg.personUrn;

  const body = {
    author: authorUrn,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: { text },
        shareMediaCategory: 'IMAGE',
        media: [{
          status: 'READY',
          media: imageUrn,
        }],
      },
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': visibility,
    },
  };

  const data = await linkedinPost(
    'https://api.linkedin.com/v2/ugcPosts', body, cfg.accessToken,
  );

  const postUrn = (data.id as string) ?? '';
  return {
    postUrn,
    postUrl: postUrn ? `https://www.linkedin.com/feed/update/${postUrn}` : '',
  };
}

// ---------------------------------------------------------------------------
// Public API — Image Upload
// ---------------------------------------------------------------------------

export interface ImageUploadResult {
  imageUrn: string;
}

export async function uploadImage(
  imagePath: string, config?: LinkedInConfig,
): Promise<ImageUploadResult> {
  const cfg = config ?? loadLinkedInConfig();
  if (!cfg.accessToken) throw new Error('LinkedIn access_token 未配置。');

  const ownerUrn = cfg.organizationUrn ?? cfg.personUrn;

  const registerBody = {
    registerUploadRequest: {
      recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
      owner: ownerUrn,
      serviceRelationships: [{
        relationshipType: 'OWNER',
        identifier: 'urn:li:userGeneratedContent',
      }],
    },
  };

  const regData = await linkedinPost(
    'https://api.linkedin.com/v2/assets?action=registerUpload',
    registerBody, cfg.accessToken,
  );

  const regValue = (regData.value as Record<string, unknown>) ?? {};
  const uploadMech = (regValue.uploadMechanism as Record<string, unknown>) ?? {};
  const uploadHttp = (uploadMech['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'] as Record<string, unknown>) ?? {};
  const uploadUrl = (uploadHttp.uploadUrl as string) ?? '';
  const asset = (regValue.asset as string) ?? '';

  if (!uploadUrl) throw new Error('LinkedIn image register 未返回 uploadUrl');

  const buffer = readFileSync(imagePath);
  const ext = basename(imagePath).split('.').pop()?.toLowerCase() || 'jpg';
  const mimeMap: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif' };

  const uploadResp = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${cfg.accessToken}`,
      'Content-Type': mimeMap[ext] || 'image/jpeg',
    },
    body: buffer,
  });

  if (!uploadResp.ok) {
    throw new Error(`LinkedIn image upload 失败 (${uploadResp.status})`);
  }

  return { imageUrn: asset };
}

// ---------------------------------------------------------------------------
// Public API — Articles
// ---------------------------------------------------------------------------

export interface ArticleResult {
  articleUrn: string;
  articleUrl: string;
}

export async function createArticle(
  title: string,
  htmlBody: string,
  description?: string,
  thumbnailUrn?: string,
  visibility: 'PUBLIC' | 'CONNECTIONS' = 'PUBLIC',
  config?: LinkedInConfig,
): Promise<ArticleResult> {
  const cfg = config ?? loadLinkedInConfig();
  if (!cfg.accessToken) throw new Error('LinkedIn access_token 未配置。');

  const authorUrn = cfg.organizationUrn ?? cfg.personUrn;

  const body: Record<string, unknown> = {
    author: authorUrn,
    lifecycleState: 'PUBLISHED',
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': visibility,
    },
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: { text: description ?? title },
        shareMediaCategory: 'ARTICLE',
        media: [{
          status: 'READY',
          originalUrl: '',
          title: { text: title },
          description: { text: description ?? '' },
        }],
      },
    },
  };

  if (thumbnailUrn) {
    const media = ((body.specificContent as Record<string, unknown>)['com.linkedin.ugc.ShareContent'] as Record<string, unknown>).media as Record<string, unknown>[];
    media[0].thumbnails = [{ resolvedUrl: thumbnailUrn }];
  }

  const data = await linkedinPost(
    'https://api.linkedin.com/v2/ugcPosts', body, cfg.accessToken,
  );

  const articleUrn = (data.id as string) ?? '';
  return {
    articleUrn,
    articleUrl: articleUrn ? `https://www.linkedin.com/feed/update/${articleUrn}` : '',
  };
}

// ---------------------------------------------------------------------------
// Public API — Profile
// ---------------------------------------------------------------------------

export interface Profile {
  id: string;
  firstName: string;
  lastName: string;
  headline?: string;
}

export async function getProfile(config?: LinkedInConfig): Promise<Profile> {
  const cfg = config ?? loadLinkedInConfig();
  if (!cfg.accessToken) throw new Error('LinkedIn access_token 未配置。');

  const data = await linkedinGet(
    'https://api.linkedin.com/v2/me', cfg.accessToken,
  );

  const firstName = (data.localizedFirstName as string) ?? (data.firstName as Record<string, unknown>)?.localized as string ?? '';
  const lastName = (data.localizedLastName as string) ?? '';

  return {
    id: (data.id as string) ?? '',
    firstName,
    lastName,
    headline: (data.localizedHeadline as string) ?? undefined,
  };
}
