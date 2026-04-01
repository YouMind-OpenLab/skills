#!/usr/bin/env node
/**
 * LinkedIn OAuth 2.0 one-click helper
 * Usage: node dist/oauth-helper.js --client-id <id> --client-secret <secret>
 *
 * Automates the full OAuth flow:
 * 1. Starts a local server to capture the callback
 * 2. Opens the browser for LinkedIn authorization
 * 3. Exchanges authorization code for access token
 * 4. Fetches person URN via userinfo API
 * 5. Writes credentials to config.yaml
 */

import http from 'node:http';
import https from 'node:https';
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = resolve(__dirname, '..', '..', 'config.yaml');

const REDIRECT_URI = 'http://localhost:3000/callback';
const SCOPES = 'openid profile w_member_social';
const PORT = 3000;

function parseArgs(args: string[]): { clientId: string; clientSecret: string } {
  let clientId = '';
  let clientSecret = '';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--client-id' && args[i + 1]) clientId = args[++i];
    else if (args[i] === '--client-secret' && args[i + 1]) clientSecret = args[++i];
    else if (args[i] === '--help' || args[i] === '-h') {
      console.log(`Usage: node dist/oauth-helper.js --client-id <id> --client-secret <secret>

Options:
  --client-id      LinkedIn App Client ID (required)
  --client-secret  LinkedIn App Client Secret (required)
  -h, --help       Show this help message`);
      process.exit(0);
    }
  }

  if (!clientId || !clientSecret) {
    console.error('Error: --client-id and --client-secret are required.\nRun with --help for usage.');
    process.exit(1);
  }

  return { clientId, clientSecret };
}

function httpsPost(url: string, body: Record<string, string>): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const data = new URLSearchParams(body).toString();
    const req = https.request(
      {
        hostname: u.hostname,
        path: u.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(data),
        },
      },
      (res) => {
        let buf = '';
        res.on('data', (c) => (buf += c));
        res.on('end', () => resolve({ status: res.statusCode!, body: buf }));
      },
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function httpsGet(url: string, headers: Record<string, string>): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request(
      { hostname: u.hostname, path: u.pathname + u.search, method: 'GET', headers },
      (res) => {
        let buf = '';
        res.on('data', (c) => (buf += c));
        res.on('end', () => resolve({ status: res.statusCode!, body: buf }));
      },
    );
    req.on('error', reject);
    req.end();
  });
}

function writeConfig(accessToken: string, personUrn: string): void {
  let youmindApiKey = '';
  let organizationUrn = '';

  if (existsSync(CONFIG_PATH)) {
    const existing = readFileSync(CONFIG_PATH, 'utf-8');
    const keyMatch = existing.match(/api_key:\s*"([^"]*)"/);
    const orgMatch = existing.match(/organization_urn:\s*"([^"]*)"/);
    if (keyMatch) youmindApiKey = keyMatch[1];
    if (orgMatch) organizationUrn = orgMatch[1];
  }

  const config = `# YouMind LinkedIn Skill Configuration

# YouMind OpenAPI (knowledge base search, web search, article archiving)
youmind:
  api_key: "${youmindApiKey}"              # sk-ym-xxxxxxxxxxxxxxxxxxxx
  base_url: "https://youmind.com/openapi/v1"

# LinkedIn API credentials
linkedin:
  access_token: "${accessToken}"
  person_urn: "${personUrn}"
  organization_urn: "${organizationUrn}"     # Optional: urn:li:organization:{id} for company pages
`;

  writeFileSync(CONFIG_PATH, config);
}

function main(): void {
  const { clientId, clientSecret } = parseArgs(process.argv.slice(2));

  const server = http.createServer(async (req, res) => {
    if (!req.url?.startsWith('/callback')) {
      res.end('ignored');
      return;
    }

    const code = new URL(req.url, `http://localhost:${PORT}`).searchParams.get('code');
    if (!code) {
      res.writeHead(400);
      res.end('No code found in callback URL');
      return;
    }

    console.log('\n[1/3] Authorization code received, exchanging for access token...');

    try {
      const tokenRes = await httpsPost('https://www.linkedin.com/oauth/v2/accessToken', {
        grant_type: 'authorization_code',
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: REDIRECT_URI,
      });

      const tokenData = JSON.parse(tokenRes.body);
      if (!tokenData.access_token) {
        console.error('Failed to get access token:', tokenRes.body);
        res.writeHead(500);
        res.end('Failed to get access token: ' + tokenRes.body);
        server.close();
        process.exit(1);
      }

      const accessToken = tokenData.access_token;
      const expiresIn = tokenData.expires_in;
      console.log(`[2/3] Access token obtained! (expires in ${Math.round(expiresIn / 86400)} days)`);

      const profileRes = await httpsGet('https://api.linkedin.com/v2/userinfo', {
        Authorization: `Bearer ${accessToken}`,
      });

      const profile = JSON.parse(profileRes.body);
      const personUrn = profile.sub ? `urn:li:person:${profile.sub}` : '';
      const name = profile.name || 'Unknown';

      console.log(`[3/3] Profile: ${name}, Person URN: ${personUrn}`);

      writeConfig(accessToken, personUrn);
      console.log(`\nconfig.yaml saved to: ${CONFIG_PATH}`);
      console.log('\nAll done! You can now use the LinkedIn skill.');

      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`<html><body style="font-family:system-ui;text-align:center;padding:60px">
        <h1>LinkedIn Authorization Complete!</h1>
        <p>Welcome, <strong>${name}</strong></p>
        <p>Person URN: <code>${personUrn}</code></p>
        <p>Access token saved to <code>config.yaml</code></p>
        <p style="color:green;font-size:1.2em;margin-top:30px">You can close this page now.</p>
      </body></html>`);
    } catch (err) {
      console.error('OAuth flow failed:', err);
      res.writeHead(500);
      res.end('OAuth flow failed: ' + String(err));
    }

    setTimeout(() => {
      server.close();
      process.exit(0);
    }, 1000);
  });

  server.listen(PORT, () => {
    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPES)}`;
    console.log(`Local server started on http://localhost:${PORT}`);
    console.log('Opening browser for LinkedIn authorization...\n');

    try {
      const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
      execSync(`${cmd} "${authUrl}"`);
    } catch {
      console.log('Could not open browser automatically. Please open this URL manually:\n');
      console.log(authUrl + '\n');
    }
  });
}

main();
