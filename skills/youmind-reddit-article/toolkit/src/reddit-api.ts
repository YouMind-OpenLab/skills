/**
 * Reddit API client — OAuth2 (script type), post submission, flairs, hot posts.
 *
 * Uses Reddit's "script" OAuth flow (username/password grant).
 * Rate limit: 60 requests/minute.
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse as parseYaml } from 'yaml';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export interface RedditConfig {
  clientId: string;
  clientSecret: string;
  username: string;
  password: string;
  userAgent: string;
}

export function loadRedditConfig(projectDir?: string): RedditConfig {
  const baseDir = projectDir ?? process.cwd();
  for (const name of ['config.yaml', 'config.example.yaml']) {
    const p = resolve(baseDir, name);
    if (existsSync(p)) {
      const raw = parseYaml(readFileSync(p, 'utf-8')) ?? {};
      const r = raw.reddit ?? {};
      return {
        clientId: r.client_id ?? '',
        clientSecret: r.client_secret ?? '',
        username: r.username ?? '',
        password: r.password ?? '',
        userAgent: r.user_agent ?? 'youmind-reddit-skill/1.0',
      };
    }
  }
  return { clientId: '', clientSecret: '', username: '', password: '', userAgent: 'youmind-reddit-skill/1.0' };
}

// ---------------------------------------------------------------------------
// Token cache
// ---------------------------------------------------------------------------

interface TokenCache {
  accessToken: string;
  expiresAt: number;
}

let tokenCache: TokenCache | null = null;

export async function getAccessToken(config?: RedditConfig): Promise<string> {
  const cfg = config ?? loadRedditConfig();
  const now = Date.now() / 1000;

  if (tokenCache && now < tokenCache.expiresAt) {
    return tokenCache.accessToken;
  }

  if (!cfg.clientId || !cfg.clientSecret) {
    throw new Error('Reddit client_id / client_secret 未配置。请在 config.yaml 的 reddit 段设置。');
  }

  const basicAuth = Buffer.from(`${cfg.clientId}:${cfg.clientSecret}`).toString('base64');

  const resp = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': cfg.userAgent,
    },
    body: new URLSearchParams({
      grant_type: 'password',
      username: cfg.username,
      password: cfg.password,
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Reddit OAuth 失败 (${resp.status}): ${text.slice(0, 300)}`);
  }

  const data = await resp.json() as Record<string, unknown>;
  if (data.error) {
    throw new Error(`Reddit OAuth error: ${data.error}`);
  }

  const accessToken = data.access_token as string;
  const expiresIn = (data.expires_in as number) || 3600;

  tokenCache = {
    accessToken,
    expiresAt: now + expiresIn - 60,
  };

  return accessToken;
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

async function redditGet(
  endpoint: string, token: string, userAgent: string,
): Promise<Record<string, unknown>> {
  const resp = await fetch(`https://oauth.reddit.com${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'User-Agent': userAgent,
    },
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Reddit API GET ${endpoint} 失败 (${resp.status}): ${text.slice(0, 300)}`);
  }

  return resp.json() as Promise<Record<string, unknown>>;
}

async function redditPost(
  endpoint: string, body: Record<string, string>, token: string, userAgent: string,
): Promise<Record<string, unknown>> {
  const resp = await fetch(`https://oauth.reddit.com${endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'User-Agent': userAgent,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(body),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Reddit API POST ${endpoint} 失败 (${resp.status}): ${text.slice(0, 300)}`);
  }

  return resp.json() as Promise<Record<string, unknown>>;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface SubmitResult {
  id: string;
  name: string;
  url: string;
}

export async function submitSelfPost(
  subreddit: string,
  title: string,
  text: string,
  flairId?: string,
  config?: RedditConfig,
): Promise<SubmitResult> {
  const cfg = config ?? loadRedditConfig();
  const token = await getAccessToken(cfg);

  const body: Record<string, string> = {
    sr: subreddit,
    kind: 'self',
    title,
    text,
    api_type: 'json',
  };
  if (flairId) body.flair_id = flairId;

  const data = await redditPost('/api/submit', body, token, cfg.userAgent);
  const json = (data.json as Record<string, unknown>) ?? {};
  const resultData = (json.data as Record<string, unknown>) ?? {};
  const errors = (json.errors as string[][]) ?? [];

  if (errors.length) {
    throw new Error(`Reddit submit error: ${JSON.stringify(errors)}`);
  }

  return {
    id: (resultData.id as string) ?? '',
    name: (resultData.name as string) ?? '',
    url: (resultData.url as string) ?? `https://reddit.com${resultData.url ?? ''}`,
  };
}

export async function submitLinkPost(
  subreddit: string,
  title: string,
  url: string,
  flairId?: string,
  config?: RedditConfig,
): Promise<SubmitResult> {
  const cfg = config ?? loadRedditConfig();
  const token = await getAccessToken(cfg);

  const body: Record<string, string> = {
    sr: subreddit,
    kind: 'link',
    title,
    url,
    api_type: 'json',
  };
  if (flairId) body.flair_id = flairId;

  const data = await redditPost('/api/submit', body, token, cfg.userAgent);
  const json = (data.json as Record<string, unknown>) ?? {};
  const resultData = (json.data as Record<string, unknown>) ?? {};
  const errors = (json.errors as string[][]) ?? [];

  if (errors.length) {
    throw new Error(`Reddit submit error: ${JSON.stringify(errors)}`);
  }

  return {
    id: (resultData.id as string) ?? '',
    name: (resultData.name as string) ?? '',
    url: (resultData.url as string) ?? '',
  };
}

export interface Flair {
  id: string;
  text: string;
  type: string;
}

export async function getSubredditFlairs(
  subreddit: string, config?: RedditConfig,
): Promise<Flair[]> {
  const cfg = config ?? loadRedditConfig();
  const token = await getAccessToken(cfg);

  const data = await redditGet(
    `/r/${subreddit}/api/link_flair_v2`, token, cfg.userAgent,
  );

  const flairs = Array.isArray(data) ? data : [];
  return flairs.map((f: Record<string, unknown>) => ({
    id: (f.id as string) ?? '',
    text: (f.text as string) ?? '',
    type: (f.type as string) ?? '',
  }));
}

export interface HotPost {
  id: string;
  title: string;
  score: number;
  numComments: number;
  url: string;
  author: string;
  createdUtc: number;
}

export async function getHotPosts(
  subreddit: string, limit = 25, config?: RedditConfig,
): Promise<HotPost[]> {
  const cfg = config ?? loadRedditConfig();
  const token = await getAccessToken(cfg);

  const data = await redditGet(
    `/r/${subreddit}/hot?limit=${limit}`, token, cfg.userAgent,
  );

  const listing = (data.data as Record<string, unknown>) ?? {};
  const children = (listing.children as Record<string, unknown>[]) ?? [];

  return children.map((child) => {
    const d = (child.data as Record<string, unknown>) ?? {};
    return {
      id: (d.id as string) ?? '',
      title: (d.title as string) ?? '',
      score: (d.score as number) ?? 0,
      numComments: (d.num_comments as number) ?? 0,
      url: `https://reddit.com${d.permalink ?? ''}`,
      author: (d.author as string) ?? '',
      createdUtc: (d.created_utc as number) ?? 0,
    };
  });
}

export async function crossPost(
  subreddit: string,
  originalPostName: string,
  title?: string,
  config?: RedditConfig,
): Promise<SubmitResult> {
  const cfg = config ?? loadRedditConfig();
  const token = await getAccessToken(cfg);

  const body: Record<string, string> = {
    sr: subreddit,
    kind: 'crosspost',
    crosspost_fullname: originalPostName,
    api_type: 'json',
  };
  if (title) body.title = title;

  const data = await redditPost('/api/submit', body, token, cfg.userAgent);
  const json = (data.json as Record<string, unknown>) ?? {};
  const resultData = (json.data as Record<string, unknown>) ?? {};

  return {
    id: (resultData.id as string) ?? '',
    name: (resultData.name as string) ?? '',
    url: (resultData.url as string) ?? '',
  };
}
