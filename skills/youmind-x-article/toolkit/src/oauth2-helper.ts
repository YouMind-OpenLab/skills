#!/usr/bin/env tsx
/**
 * OAuth 2.0 PKCE helper for X (Twitter).
 * Opens browser → user authorizes → catches callback → exchanges for access token.
 *
 * Usage:
 *   npx tsx src/oauth2-helper.ts --client-id YOUR_CLIENT_ID --client-secret YOUR_CLIENT_SECRET
 */

import { createServer } from 'node:http';
import { randomBytes, createHash } from 'node:crypto';
import { exec } from 'node:child_process';

// ---------------------------------------------------------------------------
// Args
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
function getArg(flag: string): string | undefined {
  const i = args.indexOf(flag);
  return i >= 0 && i + 1 < args.length ? args[i + 1] : undefined;
}

const CLIENT_ID = getArg('--client-id');
const CLIENT_SECRET = getArg('--client-secret');

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Usage: npx tsx src/oauth2-helper.ts --client-id <id> --client-secret <secret>');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// PKCE
// ---------------------------------------------------------------------------

const codeVerifier = randomBytes(32).toString('base64url');
const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url');
const state = randomBytes(16).toString('hex');

const REDIRECT_URI = 'http://localhost:3000/callback';
const SCOPES = 'tweet.read tweet.write users.read offline.access';

const authUrl = new URL('https://twitter.com/i/oauth2/authorize');
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('client_id', CLIENT_ID);
authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
authUrl.searchParams.set('scope', SCOPES);
authUrl.searchParams.set('state', state);
authUrl.searchParams.set('code_challenge', codeChallenge);
authUrl.searchParams.set('code_challenge_method', 'S256');

// ---------------------------------------------------------------------------
// Local server to catch callback
// ---------------------------------------------------------------------------

const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://localhost:3000`);

  if (url.pathname !== '/callback') {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  const code = url.searchParams.get('code');
  const returnedState = url.searchParams.get('state');

  if (returnedState !== state) {
    res.writeHead(400);
    res.end('State mismatch. Please try again.');
    server.close();
    return;
  }

  if (!code) {
    res.writeHead(400);
    res.end('No authorization code received.');
    server.close();
    return;
  }

  // Exchange code for token
  try {
    const tokenResp = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI,
        code_verifier: codeVerifier,
      }).toString(),
    });

    const tokenData = await tokenResp.json() as Record<string, unknown>;

    if (!tokenResp.ok) {
      console.error('\nToken exchange failed:', JSON.stringify(tokenData, null, 2));
      res.writeHead(500);
      res.end('Token exchange failed. Check terminal for details.');
      server.close();
      return;
    }

    const accessToken = tokenData.access_token as string;
    const refreshToken = tokenData.refresh_token as string | undefined;

    console.log('\n========================================');
    console.log('  OAuth 2.0 Authorization Successful!');
    console.log('========================================');
    console.log(`\naccess_token: ${accessToken}`);
    if (refreshToken) {
      console.log(`refresh_token: ${refreshToken}`);
    }
    console.log(`\nscope: ${tokenData.scope}`);
    console.log(`expires_in: ${tokenData.expires_in}s`);
    console.log('\nPaste the access_token into config.yaml → x.access_token');
    console.log('========================================\n');

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<html><body style="text-align:center;font-family:sans-serif;padding:60px">
      <h1>Authorization Successful!</h1>
      <p>You can close this tab and return to the terminal.</p>
    </body></html>`);
  } catch (err) {
    console.error('\nError exchanging token:', err);
    res.writeHead(500);
    res.end('Error exchanging token.');
  }

  server.close();
});

server.listen(3000, () => {
  console.log('\nStarting OAuth 2.0 authorization flow...');
  console.log(`\nOpening browser to authorize your X app...\n`);

  // Open browser
  const openCmd =
    process.platform === 'darwin' ? 'open' :
    process.platform === 'win32' ? 'start' : 'xdg-open';

  exec(`${openCmd} "${authUrl.toString()}"`);
});
