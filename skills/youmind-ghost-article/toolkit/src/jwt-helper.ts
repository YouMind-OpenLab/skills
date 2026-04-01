/**
 * JWT helper for Ghost Admin API authentication.
 *
 * Generates short-lived JWT tokens using Node.js crypto module.
 * NO external JWT library required.
 *
 * Ghost Admin API key format: {id}:{secret}
 * - id: 24-char hex string (used as JWT kid)
 * - secret: 64-char hex string (used as HMAC-SHA256 signing key)
 */

import { createHmac } from 'node:crypto';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface JwtHeader {
  alg: 'HS256';
  typ: 'JWT';
  kid: string;
}

interface JwtPayload {
  iat: number;
  exp: number;
  aud: string;
}

// ---------------------------------------------------------------------------
// Token cache
// ---------------------------------------------------------------------------

interface TokenCache {
  token: string;
  expiresAt: number;
}

const cache = new Map<string, TokenCache>();

// ---------------------------------------------------------------------------
// Base64url encoding
// ---------------------------------------------------------------------------

function base64urlEncode(input: string | Buffer): string {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf-8') : input;
  return buf
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// ---------------------------------------------------------------------------
// JWT generation
// ---------------------------------------------------------------------------

/**
 * Parse a Ghost Admin API key into its id and secret components.
 */
export function parseApiKey(adminApiKey: string): { id: string; secret: string } {
  const colonIndex = adminApiKey.indexOf(':');
  if (colonIndex === -1) {
    throw new Error(
      'Invalid Ghost Admin API key format. Expected {id}:{secret}. ' +
      'Get your key from Ghost Admin > Settings > Integrations.'
    );
  }

  const id = adminApiKey.slice(0, colonIndex);
  const secret = adminApiKey.slice(colonIndex + 1);

  if (!id || !secret) {
    throw new Error(
      'Invalid Ghost Admin API key: both id and secret must be non-empty. ' +
      'Expected format: {24-char-hex-id}:{64-char-hex-secret}'
    );
  }

  return { id, secret };
}

/**
 * Generate a JWT token for Ghost Admin API.
 *
 * Token spec:
 * - Header: { alg: "HS256", typ: "JWT", kid: {id} }
 * - Payload: { iat: now, exp: now+5min, aud: "/admin/" }
 * - Signature: HMAC-SHA256 with secret (hex-decoded to buffer)
 *
 * Tokens are cached for 4 minutes (regenerated 1 minute before expiry).
 */
export function generateToken(adminApiKey: string): string {
  const now = Math.floor(Date.now() / 1000);

  // Check cache (valid for 4 minutes, tokens last 5 minutes)
  const cached = cache.get(adminApiKey);
  if (cached && now < cached.expiresAt) {
    return cached.token;
  }

  const { id, secret } = parseApiKey(adminApiKey);

  // Decode hex secret to buffer for HMAC signing
  const secretBuffer = Buffer.from(secret, 'hex');

  // Build JWT header
  const header: JwtHeader = {
    alg: 'HS256',
    typ: 'JWT',
    kid: id,
  };

  // Build JWT payload (5 minute expiry)
  const payload: JwtPayload = {
    iat: now,
    exp: now + 5 * 60,
    aud: '/admin/',
  };

  // Encode header and payload
  const headerEncoded = base64urlEncode(JSON.stringify(header));
  const payloadEncoded = base64urlEncode(JSON.stringify(payload));
  const signingInput = `${headerEncoded}.${payloadEncoded}`;

  // Sign with HMAC-SHA256
  const signature = createHmac('sha256', secretBuffer)
    .update(signingInput)
    .digest();
  const signatureEncoded = base64urlEncode(signature);

  const token = `${signingInput}.${signatureEncoded}`;

  // Cache for 4 minutes (1 minute safety margin before 5-minute expiry)
  cache.set(adminApiKey, {
    token,
    expiresAt: now + 4 * 60,
  });

  return token;
}

/**
 * Clear the token cache (useful for testing or forced re-authentication).
 */
export function clearTokenCache(): void {
  cache.clear();
}
