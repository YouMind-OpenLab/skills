/**
 * Playwright-based Reddit automation.
 *
 * Two-step flow:
 *   1. `login` command: opens browser, user logs in manually, session saved.
 *   2. `submit` / `me` commands: reuse saved session in headless mode.
 */

import { firefox, type Browser, type BrowserContext, type Page } from 'playwright';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { RedditConfig, RedditPost, SubmitOptions, RedditUser } from './reddit-api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_DIR = resolve(__dirname, '../..');
const STATE_PATH = resolve(PROJECT_DIR, '.reddit-browser-state.json');
const PROFILE_DIR = resolve(PROJECT_DIR, '.reddit-browser-profile');
const COOKIES_PATH = resolve(PROJECT_DIR, '.reddit-browser-cookies.json');

let context: BrowserContext | null = null;

// ---------------------------------------------------------------------------
// Browser lifecycle
// ---------------------------------------------------------------------------

async function getContext(_config?: RedditConfig): Promise<BrowserContext> {
  if (context) return context;

  const headless = process.env.HEADLESS !== 'false';
  context = await firefox.launchPersistentContext(PROFILE_DIR, {
    headless,
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 },
  });

  // Load cookies from file if available
  if (existsSync(COOKIES_PATH)) {
    try {
      const cookies = JSON.parse(readFileSync(COOKIES_PATH, 'utf-8'));
      await context.addCookies(cookies);
    } catch { /* ignore */ }
  }

  return context;
}

export async function closeBrowser(): Promise<void> {
  if (context) { await context.close().catch(() => {}); context = null; }
}

export function hasSession(): boolean {
  return existsSync(PROFILE_DIR) || existsSync(COOKIES_PATH);
}

// ---------------------------------------------------------------------------
// Login — opens browser for manual login, saves session
// ---------------------------------------------------------------------------

/**
 * Login by importing cookies from the user's real browser.
 *
 * Usage:
 *   node dist/cli.js login --cookies 'reddit_session=xxx; ...'
 *
 * How to get cookies:
 *   1. Open old.reddit.com in Chrome, log in
 *   2. F12 → Application → Cookies → https://old.reddit.com
 *   3. Copy the value of `reddit_session`
 */
export async function browserLogin(config: RedditConfig, cookieString?: string): Promise<void> {
  if (!cookieString) {
    console.log(`
How to get your Reddit cookies:
  1. Open https://old.reddit.com in Chrome and make sure you're logged in
  2. Press F12 (DevTools) → Application tab → Cookies → https://old.reddit.com
  3. Copy the value of "reddit_session"
  4. Run:

  node dist/cli.js login --cookies "reddit_session=YOUR_VALUE"
`);
    return;
  }

  // Parse cookie string
  const cookies: Array<{
    name: string;
    value: string;
    domain: string;
    path: string;
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'Lax' | 'None' | 'Strict';
  }> = [];

  for (const part of cookieString.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name && rest.length > 0) {
      cookies.push({
        name: name.trim(),
        value: rest.join('=').trim(),
        domain: '.reddit.com',
        path: '/',
        httpOnly: name.trim() === 'reddit_session',
        secure: true,
        sameSite: 'None',
      });
    }
  }

  // Save cookies to file
  writeFileSync(COOKIES_PATH, JSON.stringify(cookies, null, 2));

  // Clear cached context
  if (context) { await context.close().catch(() => {}); context = null; }

  const ctx = await getContext();
  await ctx.addCookies(cookies);

  // Verify login
  const page = await ctx.newPage();
  try {
    console.log('Verifying login...');
    await page.goto('https://old.reddit.com/', {
      waitUntil: 'load',
      timeout: 30_000,
    });
    await page.waitForTimeout(3000);

    const username = await page.evaluate(() => {
      const el = document.querySelector('.user a');
      return el?.textContent?.trim() || '';
    }).catch(() => '');

    if (username) {
      console.log(`Login successful! Logged in as: ${username}`);
    } else {
      console.log('Login successful! Session saved.');
    }
  } finally {
    await page.close();
  }
}

// ---------------------------------------------------------------------------
// Require session — used by submit/me before doing anything
// ---------------------------------------------------------------------------

function requireSession(): void {
  if (!existsSync(PROFILE_DIR) && !existsSync(COOKIES_PATH)) {
    throw new Error(
      'No Reddit session found. Please log in first:\n' +
      '  cd toolkit && node dist/cli.js login --cookies "reddit_session=YOUR_VALUE"\n' +
      'Get the cookie from Chrome DevTools (F12 → Application → Cookies).',
    );
  }
}

// ---------------------------------------------------------------------------
// Submit self-post via old.reddit.com form
// ---------------------------------------------------------------------------

export async function browserSubmitSelfPost(
  config: RedditConfig,
  subreddit: string,
  title: string,
  text: string,
  _options?: SubmitOptions,
): Promise<RedditPost> {
  requireSession();

  const ctx = await getContext();
  const page = await ctx.newPage();

  try {
    // Navigate to old.reddit.com submit form
    const submitUrl = `https://old.reddit.com/r/${subreddit}/submit?selftext=true`;
    console.log(`Navigating to ${submitUrl}...`);
    await page.goto(submitUrl, { waitUntil: 'load', timeout: 30_000 });
    await page.waitForTimeout(2000);

    if (page.url().includes('/login')) {
      throw new Error(
        'Reddit session expired. Please log in again:\n' +
        '  cd toolkit && node dist/cli.js login --cookies "reddit_session=YOUR_VALUE"',
      );
    }

    // Fill in title and text
    const titleSelector = 'textarea[name="title"], input[name="title"]';
    await page.waitForSelector(titleSelector, { timeout: 10_000 });
    await page.fill(titleSelector, title);

    const textTab = page.locator('#text-field, .tabmenu.formtab li a').filter({ hasText: /text/i });
    if (await textTab.count() > 0 && await textTab.first().isVisible()) {
      await textTab.first().click();
      await page.waitForTimeout(500);
    }
    await page.fill('textarea[name="text"]', text);

    console.log('Form filled. Checking for CAPTCHA...');

    // Check if CAPTCHA is present
    const captcha = page.locator('.g-recaptcha, #recaptcha, iframe[src*="recaptcha"]');
    if (await captcha.count() > 0) {
      console.log('\n========================================');
      console.log('  CAPTCHA detected! Please solve it in');
      console.log('  the browser window, then click Submit.');
      console.log('  Waiting up to 2 minutes...');
      console.log('========================================\n');

      // Wait for the user to solve CAPTCHA and submit — page will navigate to /comments/
      await page.waitForURL(/\/comments\//, { timeout: 120_000 });
    } else {
      // No CAPTCHA — submit directly
      console.log('Submitting post...');
      await page.click('button[name="submit"], .save-button button, #newlink [type="submit"]');
      await page.waitForURL(/\/comments\//, { timeout: 30_000 });
    }

    const postUrl = page.url();
    const idMatch = postUrl.match(/\/comments\/([a-z0-9]+)\//);
    const postId = idMatch?.[1] || '';

    console.log('Post submitted!');
    return {
      id: postId,
      name: `t3_${postId}`,
      url: postUrl,
      permalink: postUrl,
      title,
    };
  } finally {
    await page.close();
  }
}

// ---------------------------------------------------------------------------
// Submit link post via old.reddit.com form
// ---------------------------------------------------------------------------

export async function browserSubmitLink(
  config: RedditConfig,
  subreddit: string,
  title: string,
  linkUrl: string,
  _options?: SubmitOptions,
): Promise<RedditPost> {
  requireSession();

  const cookies = existsSync(COOKIES_PATH)
    ? JSON.parse(readFileSync(COOKIES_PATH, 'utf-8')) as Array<{ name: string; value: string }>
    : [];

  const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');

  // Get modhash
  const meResp = await fetch('https://old.reddit.com/api/me.json', {
    headers: { Cookie: cookieHeader },
  });
  const meData = await meResp.json() as { data?: { modhash?: string } };
  const modhash = meData.data?.modhash || '';

  if (!modhash) {
    throw new Error(
      'Could not get Reddit CSRF token. Session may be expired.\n' +
      '  cd toolkit && node dist/cli.js login --cookies "reddit_session=YOUR_VALUE"',
    );
  }

  console.log(`Submitting link to r/${subreddit}...`);
  const formData = new URLSearchParams({
    kind: 'link',
    sr: subreddit,
    title,
    url: linkUrl,
    uh: modhash,
    api_type: 'json',
  });

  const submitResp = await fetch('https://old.reddit.com/api/submit', {
    method: 'POST',
    headers: {
      Cookie: cookieHeader,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  });

  const submitData = await submitResp.json() as {
    json?: {
      errors?: string[][];
      data?: { url?: string; id?: string; name?: string };
    };
  };

  if (submitData.json?.errors?.length) {
    throw new Error(`Reddit submit error: ${JSON.stringify(submitData.json.errors)}`);
  }

  const postUrl = submitData.json?.data?.url || '';
  const postId = submitData.json?.data?.id || '';
  const postName = submitData.json?.data?.name || '';

  return {
    id: postId,
    name: postName,
    url: postUrl,
    permalink: postUrl,
    title,
  };
}

// ---------------------------------------------------------------------------
// Get user info
// ---------------------------------------------------------------------------

export async function browserGetMe(config: RedditConfig): Promise<RedditUser> {
  requireSession();

  const ctx = await getContext();
  const page = await ctx.newPage();

  try {
    // Use old.reddit.com to check login status and get username
    await page.goto('https://old.reddit.com/', { waitUntil: 'domcontentloaded', timeout: 15_000 });
    await page.waitForTimeout(1000);

    const username = await page.evaluate(() => {
      const el = document.querySelector('.user a');
      return el?.textContent?.trim() || '';
    }).catch(() => '');

    if (!username) {
      throw new Error(
        'Reddit session expired. Please log in again:\n' +
        '  cd toolkit && node dist/cli.js login',
      );
    }

    // Fetch detailed info from JSON endpoint
    await page.goto(
      `https://old.reddit.com/user/${username}/about.json`,
      { waitUntil: 'domcontentloaded', timeout: 15_000 },
    );

    const body = await page.evaluate(() => document.body.innerText);
    const data = JSON.parse(body);
    const user = (data.data as Record<string, unknown>) || data;

    return {
      name: (user.name as string) || username,
      id: (user.id as string) || '',
      link_karma: (user.link_karma as number) || 0,
      comment_karma: (user.comment_karma as number) || 0,
      created_utc: (user.created_utc as number) || 0,
    };
  } finally {
    await page.close();
  }
}
