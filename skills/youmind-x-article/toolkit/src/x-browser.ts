/**
 * Playwright-based X (Twitter) automation.
 *
 * Two-step flow:
 *   1. `login` command: opens browser, user logs in manually, session saved.
 *   2. `tweet` / `me` commands: reuse saved session in headless mode.
 */

import { firefox, type Browser, type BrowserContext, type Page } from 'playwright';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { XConfig, TweetResponse, XUser } from './x-api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_DIR = resolve(__dirname, '../..');
const PROFILE_DIR = resolve(PROJECT_DIR, '.x-browser-profile');
const COOKIES_PATH = resolve(PROJECT_DIR, '.x-browser-cookies.json');

let context: BrowserContext | null = null;

// ---------------------------------------------------------------------------
// Browser lifecycle
// ---------------------------------------------------------------------------

async function getContext(): Promise<BrowserContext> {
  if (context) return context;

  const headless = process.env.HEADLESS !== 'false';
  context = await firefox.launchPersistentContext(PROFILE_DIR, {
    headless,
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 },
  });

  // Load cookies from extract-cookies.ts output if available
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
 *   node dist/cli.js login --cookies 'auth_token=xxx; ct0=yyy'
 *
 * How to get cookies:
 *   1. Open x.com in Chrome, log in
 *   2. F12 → Application → Cookies → https://x.com
 *   3. Copy the values of `auth_token` and `ct0`
 */
export async function browserLogin(cookieString?: string): Promise<void> {
  if (!cookieString) {
    console.log(`
How to get your X cookies:
  1. Open https://x.com in Chrome and make sure you're logged in
  2. Press F12 (DevTools) → Application tab → Cookies → https://x.com
  3. Copy the values of "auth_token" and "ct0"
  4. Run:

  node dist/cli.js login --cookies "auth_token=YOUR_AUTH_TOKEN; ct0=YOUR_CT0"
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
        domain: '.x.com',
        path: '/',
        httpOnly: name.trim() === 'auth_token',
        secure: true,
        sameSite: 'None',
      });
    }
  }

  if (!cookies.find(c => c.name === 'auth_token')) {
    console.error('Error: auth_token cookie is required.');
    process.exit(1);
  }

  // Save cookies to file for future sessions
  writeFileSync(COOKIES_PATH, JSON.stringify(cookies, null, 2));

  // Clear cached context
  if (context) { await context.close().catch(() => {}); context = null; }

  const ctx = await getContext();
  await ctx.addCookies(cookies);

  // Verify login
  const page = await ctx.newPage();
  try {
    console.log('Verifying login...');
    await page.goto('https://x.com/home', {
      waitUntil: 'load',
      timeout: 30_000,
    });
    await page.waitForTimeout(3000);

    if (page.url().includes('/login') || page.url().includes('/flow/')) {
      console.error('Login failed. Cookies may be invalid or expired.');
      process.exit(1);
    }

    const username = await page.evaluate(() => {
      const profileLink = document.querySelector('[data-testid="AppTabBar_Profile_Link"]');
      if (profileLink) {
        const href = profileLink.getAttribute('href') || '';
        const match = href.match(/^\/([A-Za-z0-9_]+)$/);
        if (match) return match[1];
      }
      return '';
    }).catch(() => '');

    if (username) {
      console.log(`Login successful! Logged in as: @${username}`);
    } else {
      console.log('Login successful! Session saved.');
    }
  } finally {
    await page.close();
  }
}

// ---------------------------------------------------------------------------
// Require session
// ---------------------------------------------------------------------------

function requireSession(): void {
  if (!existsSync(PROFILE_DIR)) {
    throw new Error(
      'No X session found. Please log in first:\n' +
      '  cd toolkit && node dist/cli.js login\n' +
      'This opens a browser window for you to log in manually.',
    );
  }
}

// ---------------------------------------------------------------------------
// Post tweet via browser
// ---------------------------------------------------------------------------

export async function browserPostTweet(
  text: string,
  options?: { replyTo?: string },
): Promise<TweetResponse> {
  requireSession();

  const ctx = await getContext();
  const page = await ctx.newPage();

  try {
    // Navigate to X
    const targetUrl = options?.replyTo
      ? `https://x.com/i/status/${options.replyTo}`
      : 'https://x.com/home';

    console.log(`Navigating to ${targetUrl}...`);
    await page.goto(targetUrl, { waitUntil: 'load', timeout: 30_000 });
    await page.waitForTimeout(5000);

    // Debug: save screenshot
    const debugDir = resolve(PROJECT_DIR, 'output');
    if (!existsSync(debugDir)) {
      const { mkdirSync } = await import('node:fs');
      mkdirSync(debugDir, { recursive: true });
    }
    await page.screenshot({ path: resolve(debugDir, 'debug-tweet.png'), fullPage: true });
    console.log(`Debug screenshot saved to output/debug-tweet.png`);
    console.log(`Current URL: ${page.url()}`);

    // Dismiss any overlays/popups (cookie banners, notifications, etc.)
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }

    // Check if session expired — but give the page time to settle
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      throw new Error(
        'X session expired. Please log in again:\n' +
        '  cd toolkit && node dist/cli.js login',
      );
    }

    // Dismiss flow pages (not necessarily a login issue)
    if (currentUrl.includes('/flow/')) {
      await page.goto('https://x.com/home', { waitUntil: 'load', timeout: 30_000 });
      await page.waitForTimeout(3000);
    }

    if (options?.replyTo) {
      // Click the reply button on the tweet
      const replyButton = page.locator('[data-testid="reply"]').first();
      await replyButton.click();
      await page.waitForTimeout(1000);
    }

    // Find the tweet compose box
    const tweetBox = page.locator('[data-testid="tweetTextarea_0"]');
    await tweetBox.waitFor({ timeout: 10_000 });
    await tweetBox.click();
    await page.waitForTimeout(500);

    // Type the tweet text
    await page.keyboard.type(text, { delay: 20 });
    await page.waitForTimeout(1000);

    // Dismiss any overlays again before clicking post
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // Click the post button (force to bypass any remaining overlays)
    const postButton = page.locator('[data-testid="tweetButtonInline"], [data-testid="tweetButton"]').first();
    await postButton.click({ force: true });

    console.log('Tweet submitted, waiting for confirmation...');
    await page.waitForTimeout(3000);

    // Save updated state
    // Persistent context auto-saves state

    // Try to extract tweet ID from toast notification or page
    const tweetId = await extractLatestTweetId(page);

    return {
      data: {
        id: tweetId,
        text,
      },
    };
  } finally {
    await page.close();
  }
}

// ---------------------------------------------------------------------------
// Post thread via browser
// ---------------------------------------------------------------------------

export async function browserPostThread(
  tweets: string[],
): Promise<TweetResponse[]> {
  if (tweets.length === 0) {
    throw new Error('Thread must contain at least one tweet.');
  }

  // Post first tweet
  const first = await browserPostTweet(tweets[0]);
  const results: TweetResponse[] = [first];
  console.log(`Thread 1/${tweets.length}: ${first.data.id}`);

  // Post remaining as replies
  let previousId = first.data.id;
  for (let i = 1; i < tweets.length; i++) {
    await new Promise((r) => setTimeout(r, 2000));

    const reply = await browserPostTweet(tweets[i], { replyTo: previousId });
    results.push(reply);
    previousId = reply.data.id;
    console.log(`Thread ${i + 1}/${tweets.length}: ${reply.data.id}`);
  }

  return results;
}

// ---------------------------------------------------------------------------
// Delete tweet via browser
// ---------------------------------------------------------------------------

export async function browserDeleteTweet(tweetId: string): Promise<{ deleted: boolean }> {
  requireSession();

  const ctx = await getContext();
  const page = await ctx.newPage();

  try {
    await page.goto(`https://x.com/i/status/${tweetId}`, {
      waitUntil: 'load',
      timeout: 30_000,
    });
    await page.waitForTimeout(2000);

    // Click the "..." menu on the tweet
    const moreButton = page.locator('[data-testid="caret"]').first();
    await moreButton.click();
    await page.waitForTimeout(1000);

    // Click "Delete"
    const deleteButton = page.locator('[data-testid="Dropdown"] [role="menuitem"]').filter({ hasText: /delete/i }).first();
    await deleteButton.click();
    await page.waitForTimeout(1000);

    // Confirm delete
    const confirmButton = page.locator('[data-testid="confirmationSheetConfirm"]');
    await confirmButton.click();
    await page.waitForTimeout(2000);

    // Persistent context auto-saves state

    return { deleted: true };
  } catch {
    return { deleted: false };
  } finally {
    await page.close();
  }
}

// ---------------------------------------------------------------------------
// Get me via browser
// ---------------------------------------------------------------------------

export async function browserGetMe(): Promise<XUser> {
  requireSession();

  const ctx = await getContext();
  const page = await ctx.newPage();

  try {
    await page.goto('https://x.com/home', {
      waitUntil: 'load',
      timeout: 30_000,
    });
    await page.waitForTimeout(3000);

    if (page.url().includes('/login') || page.url().includes('/flow/')) {
      throw new Error(
        'X session expired. Please log in again:\n' +
        '  cd toolkit && node dist/cli.js login',
      );
    }

    // Extract username from profile link in sidebar
    const userInfo = await page.evaluate(() => {
      const profileLink = document.querySelector('[data-testid="AppTabBar_Profile_Link"]');
      let username = '';
      if (profileLink) {
        const href = profileLink.getAttribute('href') || '';
        const match = href.match(/^\/([A-Za-z0-9_]+)$/);
        if (match) username = match[1];
      }

      // Try to get display name from sidebar
      const nameEl = document.querySelector('[data-testid="UserAvatar-Container-unknown"]');
      const name = nameEl?.getAttribute('aria-label') || username;

      return { username, name };
    });

    if (!userInfo.username) {
      throw new Error(
        'Could not detect X username. Session may be expired.\n' +
        '  cd toolkit && node dist/cli.js login',
      );
    }

    // Persistent context auto-saves state

    return {
      id: '',
      name: userInfo.name || userInfo.username,
      username: userInfo.username,
    };
  } finally {
    await page.close();
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function extractLatestTweetId(page: Page): Promise<string> {
  // After posting, try to find the tweet ID from the page
  // Method 1: Check for toast/notification with link to the tweet
  try {
    const toastLink = page.locator('a[href*="/status/"]').last();
    if (await toastLink.isVisible({ timeout: 3000 })) {
      const href = await toastLink.getAttribute('href');
      const match = href?.match(/\/status\/(\d+)/);
      if (match) return match[1];
    }
  } catch { /* ignore */ }

  // Method 2: Navigate to profile and get the latest tweet
  try {
    // Get username first
    const profileLink = page.locator('[data-testid="AppTabBar_Profile_Link"]');
    const href = await profileLink.getAttribute('href');
    const username = href?.match(/^\/([A-Za-z0-9_]+)$/)?.[1];

    if (username) {
      await page.goto(`https://x.com/${username}`, { waitUntil: 'load', timeout: 15_000 });
      await page.waitForTimeout(2000);

      const tweetLink = page.locator(`a[href*="/${username}/status/"]`).first();
      if (await tweetLink.isVisible({ timeout: 5000 })) {
        const tweetHref = await tweetLink.getAttribute('href');
        const match = tweetHref?.match(/\/status\/(\d+)/);
        if (match) return match[1];
      }
    }
  } catch { /* ignore */ }

  return `browser-${Date.now()}`;
}
