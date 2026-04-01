/**
 * Reddit API wrapper.
 *
 * Supports two auth modes:
 * - **OAuth mode**: Uses client_id + client_secret (script app password grant).
 * - **Cookie mode**: Uses only username + password via old Reddit login API.
 *   Automatically selected when client_id/client_secret are not configured.
 *   No API approval required.
 *
 * Usage:
 *   import { submitSelfPost, submitLink, getSubredditRules, getFlairs, getMe } from './reddit-api.js';
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';
import {
  browserSubmitSelfPost,
  browserSubmitLink,
  browserGetMe,
  closeBrowser,
} from './reddit-browser.js';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_DIR = resolve(__dirname, '../..');

const REDDIT_AUTH_URL = 'https://www.reddit.com/api/v1/access_token';
const REDDIT_API_BASE = 'https://oauth.reddit.com';
const REDDIT_COOKIE_LOGIN_URL = 'https://www.reddit.com/api/login';
const REDDIT_WEB_API_BASE = 'https://www.reddit.com';

type AuthMode = 'oauth' | 'cookie';

export interface RedditConfig {
  clientId: string;
  clientSecret: string;
  username: string;
  password: string;
  userAgent: string;
}

function loadCentralCredentials(): Record<string, unknown> {
  const home = process.env.HOME || process.env.USERPROFILE || '';
  const p = resolve(home, '.youmind-skill', 'credentials.yaml');
  if (existsSync(p)) {
    return parseYaml(readFileSync(p, 'utf-8')) ?? {};
  }
  return {};
}

export function loadRedditConfig(): RedditConfig {
  const central = loadCentralCredentials();
  let local: Record<string, unknown> = {};
  for (const name of ['config.yaml', 'config.example.yaml']) {
    const p = resolve(PROJECT_DIR, name);
    if (existsSync(p)) {
      local = parseYaml(readFileSync(p, 'utf-8')) ?? {};
      break;
    }
  }
  const r = { ...(central.reddit as Record<string, unknown> ?? {}), ...(local.reddit as Record<string, unknown> ?? {}) };
  for (const [k, v] of Object.entries(r)) {
    if (v === '' && (central.reddit as Record<string, unknown>)?.[k]) {
      r[k] = (central.reddit as Record<string, unknown>)[k];
    }
  }
  return {
    clientId: (r.client_id as string) || '',
    clientSecret: (r.client_secret as string) || '',
    username: (r.username as string) || '',
    password: (r.password as string) || '',
    userAgent: (r.user_agent as string) || 'youmind-reddit/1.0',
  };
}

// ---------------------------------------------------------------------------
// Auth mode detection
// ---------------------------------------------------------------------------

/**
 * Determine auth mode from config.
 * If client_id and client_secret are set → OAuth mode.
 * Otherwise → Cookie mode (no API approval needed).
 */
export function getAuthMode(config: RedditConfig): AuthMode {
  return config.clientId && config.clientSecret ? 'oauth' : 'cookie';
}

// ---------------------------------------------------------------------------
// OAuth 2.0 Token Management (Password Grant)
// ---------------------------------------------------------------------------

interface TokenData {
  accessToken: string;
  expiresAt: number; // Unix timestamp in ms
}

let cachedToken: TokenData | null = null;

/**
 * Get a valid OAuth 2.0 access token, refreshing if expired.
 * Uses the "password" grant type for script-type apps.
 */
export async function getAccessToken(config: RedditConfig): Promise<string> {
  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.accessToken;
  }

  if (!config.clientId || !config.clientSecret) {
    throw new Error(
      'Reddit client_id and client_secret not configured. Set them in config.yaml.',
    );
  }

  if (!config.username || !config.password) {
    throw new Error(
      'Reddit username and password not configured. Set them in config.yaml.',
    );
  }

  // Base64 encode client_id:client_secret for Basic auth
  const credentials = Buffer.from(
    `${config.clientId}:${config.clientSecret}`,
  ).toString('base64');

  const body = new URLSearchParams({
    grant_type: 'password',
    username: config.username,
    password: config.password,
  });

  const resp = await fetch(REDDIT_AUTH_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': config.userAgent,
    },
    body: body.toString(),
    signal: AbortSignal.timeout(15_000),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(
      `Reddit OAuth failed (${resp.status}): ${text.slice(0, 300)}`,
    );
  }

  const data = (await resp.json()) as Record<string, unknown>;

  if (data.error) {
    throw new Error(
      `Reddit OAuth error: ${data.error} - ${data.error_description || ''}`,
    );
  }

  const accessToken = data.access_token as string;
  const expiresIn = (data.expires_in as number) || 3600;

  if (!accessToken) {
    throw new Error('Reddit OAuth: no access_token in response');
  }

  cachedToken = {
    accessToken,
    expiresAt: Date.now() + expiresIn * 1000,
  };

  return accessToken;
}

/** Clear cached token (force re-auth on next request). */
export function clearTokenCache(): void {
  cachedToken = null;
}

// ---------------------------------------------------------------------------
// Cookie Session Management (old Reddit login API)
// ---------------------------------------------------------------------------

interface CookieSession {
  cookie: string;
  modhash: string;
  expiresAt: number; // Unix timestamp in ms
}

let cachedCookieSession: CookieSession | null = null;

/**
 * Log in via old Reddit API and get a session cookie + modhash.
 * No client_id/client_secret needed — only username + password.
 */
export async function getCookieSession(config: RedditConfig): Promise<CookieSession> {
  // Return cached session if still valid (with 60s buffer)
  if (cachedCookieSession && Date.now() < cachedCookieSession.expiresAt - 60_000) {
    return cachedCookieSession;
  }

  if (!config.username || !config.password) {
    throw new Error(
      'Reddit username and password not configured. Set them in config.yaml.',
    );
  }

  const body = new URLSearchParams({
    user: config.username,
    passwd: config.password,
    api_type: 'json',
  });

  const resp = await fetch(`${REDDIT_COOKIE_LOGIN_URL}/${config.username}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': config.userAgent,
    },
    body: body.toString(),
    signal: AbortSignal.timeout(15_000),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(
      `Reddit cookie login failed (${resp.status}): ${text.slice(0, 300)}`,
    );
  }

  const data = (await resp.json()) as Record<string, unknown>;
  const json = data.json as Record<string, unknown> | undefined;
  const errors = (json?.errors as string[][]) ?? [];

  if (errors.length > 0) {
    const errorMsg = errors.map((e) => e.join(': ')).join('; ');
    throw new Error(`Reddit login failed: ${errorMsg}`);
  }

  const loginData = json?.data as Record<string, unknown> | undefined;
  const modhash = (loginData?.modhash as string) || '';
  const cookie = (loginData?.cookie as string) || '';

  // Also try to extract from Set-Cookie header as fallback
  let sessionCookie = cookie;
  if (!sessionCookie) {
    const setCookie = resp.headers.get('set-cookie') || '';
    const match = setCookie.match(/reddit_session=([^;]+)/);
    if (match) sessionCookie = match[1];
  }

  if (!sessionCookie) {
    throw new Error(
      'Reddit cookie login: no session cookie in response. ' +
      'This may mean the old login API is no longer available. ' +
      'Consider applying for OAuth API access instead.',
    );
  }

  cachedCookieSession = {
    cookie: sessionCookie,
    modhash,
    expiresAt: Date.now() + 3600 * 1000, // 1 hour
  };

  return cachedCookieSession;
}

/** Clear cached cookie session (force re-login on next request). */
export function clearCookieSessionCache(): void {
  cachedCookieSession = null;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RedditPost {
  id: string;
  name: string; // fullname, e.g. "t3_abc123"
  url: string;
  permalink: string;
  title: string;
  [key: string]: unknown;
}

export interface SubmitOptions {
  /** Post flair ID */
  flairId?: string;
  /** Post flair text */
  flairText?: string;
  /** Send reply notifications */
  sendReplies?: boolean;
  /** Mark as NSFW */
  nsfw?: boolean;
  /** Mark as spoiler */
  spoiler?: boolean;
}

export interface SubredditRule {
  kind: string;
  description: string;
  short_name: string;
  violation_reason: string;
  [key: string]: unknown;
}

export interface SubredditFlair {
  id: string;
  text: string;
  text_editable: boolean;
  type: string;
  [key: string]: unknown;
}

export interface RedditUser {
  name: string;
  id: string;
  link_karma: number;
  comment_karma: number;
  created_utc: number;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// HTTP helper
// ---------------------------------------------------------------------------

/**
 * Build the request URL for the given endpoint and auth mode.
 * In cookie mode, non-API GET endpoints need a `.json` suffix.
 */
function buildUrl(endpoint: string, method: string, mode: AuthMode): string {
  if (endpoint.startsWith('http')) return endpoint;

  if (mode === 'oauth') {
    return `${REDDIT_API_BASE}${endpoint}`;
  }

  // Cookie mode: use www.reddit.com
  // Non-API GET paths need .json suffix to get JSON responses
  let path = endpoint;
  if (method === 'GET' && !path.startsWith('/api/') && !path.endsWith('.json')) {
    path = `${path}.json`;
  }
  return `${REDDIT_WEB_API_BASE}${path}`;
}

async function redditFetch<T = unknown>(
  endpoint: string,
  method: string,
  config: RedditConfig,
  body?: Record<string, string> | URLSearchParams,
): Promise<T> {
  const mode = getAuthMode(config);
  const url = buildUrl(endpoint, method, mode);

  const headers: Record<string, string> = {
    'User-Agent': config.userAgent,
  };

  // Set auth headers based on mode
  if (mode === 'oauth') {
    const token = await getAccessToken(config);
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    const session = await getCookieSession(config);
    headers['Cookie'] = `reddit_session=${session.cookie}`;
    // Add modhash to POST bodies
    if (method === 'POST' && session.modhash) {
      if (body instanceof URLSearchParams) {
        body.set('uh', session.modhash);
      } else if (body) {
        body['uh'] = session.modhash;
      }
    }
  }

  const init: RequestInit = {
    method,
    headers,
    signal: AbortSignal.timeout(30_000),
  };

  if (body) {
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
    if (body instanceof URLSearchParams) {
      init.body = body.toString();
    } else {
      init.body = new URLSearchParams(body).toString();
    }
  }

  const resp = await fetch(url, init);

  if (!resp.ok) {
    // Retry once on auth failure
    if (resp.status === 401 || (resp.status === 403 && mode === 'cookie')) {
      if (mode === 'oauth' && cachedToken) {
        clearTokenCache();
        const newToken = await getAccessToken(config);
        headers['Authorization'] = `Bearer ${newToken}`;
      } else if (mode === 'cookie') {
        clearCookieSessionCache();
        const newSession = await getCookieSession(config);
        headers['Cookie'] = `reddit_session=${newSession.cookie}`;
        if (method === 'POST' && newSession.modhash && body) {
          if (body instanceof URLSearchParams) {
            body.set('uh', newSession.modhash);
            init.body = body.toString();
          } else {
            body['uh'] = newSession.modhash;
            init.body = new URLSearchParams(body).toString();
          }
        }
      }
      const retryResp = await fetch(url, { ...init, headers });
      if (!retryResp.ok) {
        const text = await retryResp.text().catch(() => '');
        throw new Error(`Reddit API error (${retryResp.status}): ${text.slice(0, 500)}`);
      }
      return retryResp.json() as Promise<T>;
    }

    const text = await resp.text().catch(() => '');
    throw new Error(`Reddit API error (${resp.status}): ${text.slice(0, 500)}`);
  }

  return resp.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Public API -- Submit Self Post
// ---------------------------------------------------------------------------

/**
 * Submit a self-post (text post) to a subreddit.
 * In cookie mode, uses Playwright browser automation.
 */
export async function submitSelfPost(
  config: RedditConfig,
  subreddit: string,
  title: string,
  text: string,
  options?: SubmitOptions,
): Promise<RedditPost> {
  if (getAuthMode(config) === 'cookie') {
    return browserSubmitSelfPost(config, subreddit, title, text, options);
  }

  const params: Record<string, string> = {
    api_type: 'json',
    kind: 'self',
    sr: subreddit,
    title,
    text,
    resubmit: 'true',
  };

  if (options?.flairId) params.flair_id = options.flairId;
  if (options?.flairText) params.flair_text = options.flairText;
  if (options?.sendReplies !== undefined) params.sendreplies = String(options.sendReplies);
  if (options?.nsfw) params.nsfw = 'true';
  if (options?.spoiler) params.spoiler = 'true';

  const result = await redditFetch<Record<string, unknown>>(
    '/api/submit',
    'POST',
    config,
    params,
  );

  const json = result.json as Record<string, unknown> | undefined;
  const errors = (json?.errors as string[][]) ?? [];

  if (errors.length > 0) {
    const errorMsg = errors.map((e) => e.join(': ')).join('; ');
    throw new Error(`Reddit submit error: ${errorMsg}`);
  }

  const data = json?.data as Record<string, unknown> | undefined;
  if (!data?.id) {
    throw new Error(`Reddit submit: no post ID in response: ${JSON.stringify(result).slice(0, 300)}`);
  }

  return {
    id: data.id as string,
    name: data.name as string,
    url: data.url as string,
    permalink: `https://www.reddit.com${data.url ?? ''}`,
    title,
  };
}

// ---------------------------------------------------------------------------
// Public API -- Submit Link Post
// ---------------------------------------------------------------------------

/**
 * Submit a link post to a subreddit.
 * In cookie mode, uses Playwright browser automation.
 */
export async function submitLink(
  config: RedditConfig,
  subreddit: string,
  title: string,
  url: string,
  options?: SubmitOptions,
): Promise<RedditPost> {
  if (getAuthMode(config) === 'cookie') {
    return browserSubmitLink(config, subreddit, title, url, options);
  }

  const params: Record<string, string> = {
    api_type: 'json',
    kind: 'link',
    sr: subreddit,
    title,
    url,
    resubmit: 'true',
  };

  if (options?.flairId) params.flair_id = options.flairId;
  if (options?.flairText) params.flair_text = options.flairText;
  if (options?.sendReplies !== undefined) params.sendreplies = String(options.sendReplies);
  if (options?.nsfw) params.nsfw = 'true';
  if (options?.spoiler) params.spoiler = 'true';

  const result = await redditFetch<Record<string, unknown>>(
    '/api/submit',
    'POST',
    config,
    params,
  );

  const json = result.json as Record<string, unknown> | undefined;
  const errors = (json?.errors as string[][]) ?? [];

  if (errors.length > 0) {
    const errorMsg = errors.map((e) => e.join(': ')).join('; ');
    throw new Error(`Reddit submit error: ${errorMsg}`);
  }

  const data = json?.data as Record<string, unknown> | undefined;
  if (!data?.id) {
    throw new Error(`Reddit submit: no post ID in response: ${JSON.stringify(result).slice(0, 300)}`);
  }

  return {
    id: data.id as string,
    name: data.name as string,
    url: data.url as string,
    permalink: `https://www.reddit.com${data.url ?? ''}`,
    title,
  };
}

// ---------------------------------------------------------------------------
// Public API -- Subreddit Info
// ---------------------------------------------------------------------------

/**
 * Get subreddit rules.
 */
export async function getSubredditRules(
  config: RedditConfig,
  subreddit: string,
): Promise<SubredditRule[]> {
  const result = await redditFetch<Record<string, unknown>>(
    `/r/${subreddit}/about/rules`,
    'GET',
    config,
  );
  return (result.rules as SubredditRule[]) ?? [];
}

/**
 * Get available link flairs for a subreddit.
 */
export async function getFlairs(
  config: RedditConfig,
  subreddit: string,
): Promise<SubredditFlair[]> {
  const result = await redditFetch<SubredditFlair[]>(
    `/r/${subreddit}/api/link_flair_v2`,
    'GET',
    config,
  );
  return Array.isArray(result) ? result : [];
}

/**
 * Get basic subreddit info.
 */
export async function getSubredditInfo(
  config: RedditConfig,
  subreddit: string,
): Promise<Record<string, unknown>> {
  const result = await redditFetch<Record<string, unknown>>(
    `/r/${subreddit}/about`,
    'GET',
    config,
  );
  return (result.data as Record<string, unknown>) ?? result;
}

// ---------------------------------------------------------------------------
// Public API -- User
// ---------------------------------------------------------------------------

/**
 * Get the authenticated user's profile.
 * In cookie mode, uses Playwright browser automation.
 */
export async function getMe(config: RedditConfig): Promise<RedditUser> {
  if (getAuthMode(config) === 'cookie') {
    return browserGetMe(config);
  }
  return redditFetch<RedditUser>('/api/v1/me', 'GET', config);
}

// ---------------------------------------------------------------------------
// CLI (when run directly)
// ---------------------------------------------------------------------------

async function cli() {
  const args = process.argv.slice(2);
  const command = args[0];
  const config = loadRedditConfig();

  if (!command || command === '--help') {
    console.log(`Reddit API CLI

Commands:
  submit --subreddit <sub> --title "..." --text "..." [--flair-id <id>]
  submit-link --subreddit <sub> --title "..." --url "..."
  rules --sub <subreddit>
  flairs --sub <subreddit>
  subreddit-info --sub <subreddit>
  me`);
    return;
  }

  const getArg = (flag: string): string | undefined => {
    const i = args.indexOf(flag);
    return i >= 0 && i + 1 < args.length ? args[i + 1] : undefined;
  };

  const output = (data: unknown) => console.log(JSON.stringify(data, null, 2));

  switch (command) {
    case 'submit': {
      const subreddit = getArg('--subreddit') || getArg('--sub');
      const title = getArg('--title');
      const text = getArg('--text');
      const file = getArg('--file');
      const flairId = getArg('--flair-id');

      if (!subreddit || !title) {
        console.error('--subreddit and --title required');
        process.exit(1);
      }

      let content = text || '';
      if (file) {
        content = readFileSync(resolve(file), 'utf-8');
      }
      if (!content) {
        console.error('--text or --file required');
        process.exit(1);
      }

      const result = await submitSelfPost(config, subreddit, title, content, {
        flairId,
      });
      output(result);
      break;
    }

    case 'submit-link': {
      const subreddit = getArg('--subreddit') || getArg('--sub');
      const title = getArg('--title');
      const url = getArg('--url');
      const flairId = getArg('--flair-id');

      if (!subreddit || !title || !url) {
        console.error('--subreddit, --title, and --url required');
        process.exit(1);
      }

      const result = await submitLink(config, subreddit, title, url, {
        flairId,
      });
      output(result);
      break;
    }

    case 'rules': {
      const sub = getArg('--sub');
      if (!sub) { console.error('--sub required'); process.exit(1); }
      output(await getSubredditRules(config, sub));
      break;
    }

    case 'flairs': {
      const sub = getArg('--sub');
      if (!sub) { console.error('--sub required'); process.exit(1); }
      output(await getFlairs(config, sub));
      break;
    }

    case 'subreddit-info': {
      const sub = getArg('--sub');
      if (!sub) { console.error('--sub required'); process.exit(1); }
      output(await getSubredditInfo(config, sub));
      break;
    }

    case 'me': {
      output(await getMe(config));
      break;
    }

    default:
      console.error(`Unknown command: ${command}`);
      process.exit(1);
  }
}

const isMain =
  process.argv[1]?.endsWith('reddit-api.ts') ||
  process.argv[1]?.endsWith('reddit-api.js');
if (isMain) {
  cli().catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}
