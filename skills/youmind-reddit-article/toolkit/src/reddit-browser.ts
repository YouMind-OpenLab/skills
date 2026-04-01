/**
 * Playwright-based Reddit automation.
 *
 * Two-step flow:
 *   1. `login` command: opens browser, user logs in manually, session saved.
 *   2. `submit` / `me` commands: reuse saved session in headless mode.
 */

import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { RedditConfig, RedditPost, SubmitOptions, RedditUser } from './reddit-api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_DIR = resolve(__dirname, '../..');
const STATE_PATH = resolve(PROJECT_DIR, '.reddit-browser-state.json');

let browser: Browser | null = null;
let context: BrowserContext | null = null;

// ---------------------------------------------------------------------------
// Browser lifecycle
// ---------------------------------------------------------------------------

async function getBrowser(): Promise<Browser> {
  if (!browser || !browser.isConnected()) {
    const headless = process.env.HEADLESS !== 'false';
    browser = await chromium.launch({ headless });
  }
  return browser;
}

async function getContext(config: RedditConfig): Promise<BrowserContext> {
  if (context) return context;

  const b = await getBrowser();

  const contextOptions: Record<string, unknown> = {
    userAgent: config.userAgent.includes('/')
      ? config.userAgent
      : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  };

  if (existsSync(STATE_PATH)) {
    contextOptions.storageState = STATE_PATH;
  }

  context = await b.newContext(contextOptions);
  return context;
}

export async function closeBrowser(): Promise<void> {
  if (context) { await context.close().catch(() => {}); context = null; }
  if (browser) { await browser.close().catch(() => {}); browser = null; }
}

export function hasSession(): boolean {
  return existsSync(STATE_PATH);
}

// ---------------------------------------------------------------------------
// Login — opens browser for manual login, saves session
// ---------------------------------------------------------------------------

export async function browserLogin(config: RedditConfig): Promise<void> {
  // Force non-headless for login
  process.env.HEADLESS = 'false';

  // Clear cached context so it re-creates with new headless setting
  if (context) { await context.close().catch(() => {}); context = null; }
  if (browser) { await browser.close().catch(() => {}); browser = null; }

  const ctx = await getContext(config);
  const page = await ctx.newPage();

  try {
    console.log('\nOpening browser for Reddit login...');
    console.log('Please log in to Reddit in the browser window.');
    console.log('Waiting up to 3 minutes...\n');

    await page.goto('https://www.reddit.com/login/', {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });

    // Wait for user to complete login (URL leaves /login)
    await page.waitForURL(
      (url: URL) => {
        const href = url.href;
        return !href.includes('/login') && !href.includes('/register') && href.includes('reddit.com');
      },
      { timeout: 180_000 },
    );

    // Let page settle
    await page.waitForTimeout(3000);

    // Save session state
    await ctx.storageState({ path: STATE_PATH });
    console.log(`Session saved to ${STATE_PATH}`);

    // Verify by checking old.reddit.com
    await page.goto('https://old.reddit.com/', { waitUntil: 'domcontentloaded', timeout: 15_000 });
    await page.waitForTimeout(1000);
    const username = await page.evaluate(() => {
      const el = document.querySelector('.user a');
      return el?.textContent?.trim() || '';
    }).catch(() => '');

    if (username) {
      console.log(`Logged in as: ${username}`);
    } else {
      console.log('Login completed. Session saved.');
    }
  } finally {
    await page.close();
  }
}

// ---------------------------------------------------------------------------
// Require session — used by submit/me before doing anything
// ---------------------------------------------------------------------------

function requireSession(): void {
  if (!existsSync(STATE_PATH)) {
    throw new Error(
      'No Reddit session found. Please log in first:\n' +
      '  cd toolkit && node dist/cli.js login\n' +
      'This opens a browser window for you to log in manually.',
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

  const ctx = await getContext(config);
  const page = await ctx.newPage();

  try {
    const submitUrl = `https://old.reddit.com/r/${subreddit}/submit?selftext=true`;
    console.log(`Navigating to ${submitUrl}...`);
    await page.goto(submitUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(2000);

    // Check if redirected to login (session expired)
    if (page.url().includes('/login')) {
      throw new Error(
        'Reddit session expired. Please log in again:\n' +
        '  cd toolkit && node dist/cli.js login',
      );
    }

    // Fill in the title
    const titleSelector = 'textarea[name="title"], input[name="title"]';
    await page.waitForSelector(titleSelector, { timeout: 10_000 });
    await page.fill(titleSelector, title);

    // Ensure we're on the "text" tab
    const textTab = page.locator('#text-field, .tabmenu.formtab li a').filter({ hasText: /text/i });
    if (await textTab.count() > 0 && await textTab.first().isVisible()) {
      await textTab.first().click();
      await page.waitForTimeout(500);
    }

    // Fill in the body
    await page.fill('textarea[name="text"]', text);

    // Click submit
    console.log('Submitting post...');
    await page.click('button[name="submit"], #newlink [type="submit"], .save-button button');

    // Wait for redirect to the new post
    await page.waitForURL(/\/comments\//, { timeout: 30_000 });

    const postUrl = page.url();
    const idMatch = postUrl.match(/\/comments\/([a-z0-9]+)\//);
    const postId = idMatch?.[1] || '';

    // Update saved state
    await ctx.storageState({ path: STATE_PATH });

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
  url: string,
  _options?: SubmitOptions,
): Promise<RedditPost> {
  requireSession();

  const ctx = await getContext(config);
  const page = await ctx.newPage();

  try {
    const submitUrl = `https://old.reddit.com/r/${subreddit}/submit`;
    await page.goto(submitUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(2000);

    if (page.url().includes('/login')) {
      throw new Error(
        'Reddit session expired. Please log in again:\n' +
        '  cd toolkit && node dist/cli.js login',
      );
    }

    // Ensure "link" tab
    const linkTab = page.locator('.tabmenu.formtab li a').filter({ hasText: /link/i });
    if (await linkTab.count() > 0 && await linkTab.first().isVisible()) {
      await linkTab.first().click();
      await page.waitForTimeout(500);
    }

    await page.waitForSelector('input[name="url"]', { timeout: 10_000 });
    await page.fill('input[name="url"]', url);

    const titleSelector = 'textarea[name="title"], input[name="title"]';
    await page.fill(titleSelector, title);

    await page.click('button[name="submit"], #newlink [type="submit"], .save-button button');
    await page.waitForURL(/\/comments\//, { timeout: 30_000 });

    const postUrl = page.url();
    const idMatch = postUrl.match(/\/comments\/([a-z0-9]+)\//);
    const postId = idMatch?.[1] || '';

    await ctx.storageState({ path: STATE_PATH });

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
// Get user info
// ---------------------------------------------------------------------------

export async function browserGetMe(config: RedditConfig): Promise<RedditUser> {
  requireSession();

  const ctx = await getContext(config);
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
