#!/usr/bin/env tsx
/**
 * Extract X (Twitter) and Reddit cookies from Chrome.
 * Starts Chrome with remote debugging, connects via CDP to read cookies.
 *
 * Usage:
 *   npx tsx src/extract-cookies.ts              # Extract both
 *   npx tsx src/extract-cookies.ts --site x     # X only
 *   npx tsx src/extract-cookies.ts --site reddit # Reddit only
 *
 * Chrome will open with your normal profile. Close it after extraction completes.
 */

import { chromium } from 'playwright';
import { execSync, spawn } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const args = process.argv.slice(2);
const siteArg = args.includes('--site') ? args[args.indexOf('--site') + 1] : 'all';

const DEBUG_PORT = 9222;

async function main() {
  // Check if Chrome is already running with debug port
  let chromeWasRunning = false;
  try {
    const resp = await fetch(`http://localhost:${DEBUG_PORT}/json/version`);
    if (resp.ok) {
      chromeWasRunning = true;
      console.log('Connected to Chrome debug port.\n');
    }
  } catch {
    // Not running with debug port
  }

  if (!chromeWasRunning) {
    // Kill any running Chrome first
    try {
      execSync('pkill -x "Google Chrome"', { stdio: 'ignore' });
      await new Promise(r => setTimeout(r, 2000));
    } catch { /* not running */ }

    // Launch Chrome with debugging port
    console.log('Launching Chrome with remote debugging...');
    const chrome = spawn('open', [
      '-a', 'Google Chrome',
      '--args',
      `--remote-debugging-port=${DEBUG_PORT}`,
    ], { stdio: 'ignore' });
    chrome.unref();

    // Wait for debug port to be ready
    let ready = false;
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 1000));
      try {
        const resp = await fetch(`http://localhost:${DEBUG_PORT}/json/version`);
        if (resp.ok) { ready = true; break; }
      } catch { /* retry */ }
    }

    if (!ready) {
      console.error('Failed to connect to Chrome debug port.');
      process.exit(1);
    }
    console.log('Chrome ready.\n');
  }

  // Connect via CDP
  const browser = await chromium.connectOverCDP(`http://localhost:${DEBUG_PORT}`);

  try {
    const contexts = browser.contexts();
    if (contexts.length === 0) {
      console.error('No browser contexts found.');
      process.exit(1);
    }

    const allCookies = await contexts[0].cookies();
    console.log(`Found ${allCookies.length} total cookies.\n`);

    if (siteArg === 'all' || siteArg === 'x') {
      console.log('--- X (Twitter) ---');
      const authToken = allCookies.find(c => c.domain.includes('x.com') && c.name === 'auth_token');
      const ct0 = allCookies.find(c => c.domain.includes('x.com') && c.name === 'ct0');

      if (!authToken) {
        console.log('  auth_token not found. Make sure you are logged in to x.com in Chrome.\n');
      } else {
        console.log(`  auth_token: ${authToken.value.slice(0, 8)}...`);
        if (ct0) console.log(`  ct0: ${ct0.value.slice(0, 8)}...`);

        const xCookies = allCookies.filter(c =>
          c.domain.includes('x.com') || c.domain.includes('twitter.com'),
        );
        saveXCookies(xCookies);
      }
    }

    if (siteArg === 'all' || siteArg === 'reddit') {
      console.log('--- Reddit ---');
      const redditCookies = allCookies.filter(c => c.domain.includes('reddit.com'));
      const important = redditCookies.filter(c =>
        ['reddit_session', 'token_v2', 'session_tracker', 'csv', 'edgebucket', 'loid'].includes(c.name),
      );

      if (important.length === 0) {
        console.log('  No Reddit session cookies found.\n');
      } else {
        for (const c of important) {
          console.log(`  ${c.name}: ${c.value.slice(0, 8)}...`);
        }
        saveRedditCookies(redditCookies);
      }
    }
  } finally {
    browser.close();
  }

  if (!chromeWasRunning) {
    console.log('\nYou can now close the Chrome window that was opened.');
  }

  console.log('Done.');
}

function saveXCookies(cookies: Array<unknown>) {
  const projectDir = resolve(__dirname, '../..');
  const statePath = resolve(projectDir, '.x-browser-cookies.json');
  writeFileSync(statePath, JSON.stringify(cookies, null, 2));
  console.log(`  Saved ${cookies.length} cookies -> .x-browser-cookies.json\n`);
}

function saveRedditCookies(cookies: Array<unknown>) {
  const redditSkillDir = resolve(__dirname, '../../../youmind-reddit-article');
  const state = { cookies, origins: [] };

  if (existsSync(redditSkillDir)) {
    const statePath = resolve(redditSkillDir, '.reddit-browser-state.json');
    writeFileSync(statePath, JSON.stringify(state, null, 2));
    console.log(`  Saved ${cookies.length} cookies -> .reddit-browser-state.json\n`);
  } else {
    console.log('  Reddit skill directory not found, skipped.\n');
  }
}

main().catch(e => {
  console.error(`Error: ${e.message}`);
  process.exit(1);
});
