/**
 * LinkedIn Posts API wrapper.
 *
 * Handles post creation, image upload, and profile retrieval via LinkedIn API v2.
 *
 * Usage:
 *   import { createPost, uploadImage, getProfile } from './linkedin-api.js';
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_DIR = resolve(__dirname, '../..');

const LINKEDIN_API_BASE = 'https://api.linkedin.com/v2';
const LINKEDIN_REST_BASE = 'https://api.linkedin.com/rest';

export interface LinkedInConfig {
  accessToken: string;
  personUrn: string;
  organizationUrn?: string;
}

export function loadLinkedInConfig(): LinkedInConfig {
  for (const name of ['config.yaml', 'config.example.yaml']) {
    const p = resolve(PROJECT_DIR, name);
    if (existsSync(p)) {
      const raw = parseYaml(readFileSync(p, 'utf-8')) ?? {};
      const li = raw.linkedin ?? {};
      return {
        accessToken: li.access_token || '',
        personUrn: li.person_urn || '',
        organizationUrn: li.organization_urn || undefined,
      };
    }
  }
  return { accessToken: '', personUrn: '' };
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LinkedInPost {
  id: string;
  activity?: string;
  [key: string]: unknown;
}

export interface CreatePostOptions {
  text: string;
  visibility?: 'PUBLIC' | 'CONNECTIONS';
  /** Post as organization instead of person */
  asOrganization?: boolean;
  /** Media asset URNs to attach (from uploadImage) */
  mediaAssets?: Array<{
    id: string;
    title?: string;
    description?: string;
  }>;
}

export interface ImageUploadResult {
  asset: string;
  downloadUrl?: string;
}

export interface LinkedInProfile {
  sub: string;
  name: string;
  email?: string;
  picture?: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

async function linkedInFetch<T = unknown>(
  url: string,
  options: RequestInit,
  config: LinkedInConfig,
): Promise<T> {
  if (!config.accessToken) {
    throw new Error(
      'LinkedIn access token not configured. Set linkedin.access_token in config.yaml.',
    );
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${config.accessToken}`,
    'X-Restli-Protocol-Version': '2.0.0',
    'LinkedIn-Version': '202401',
    ...(options.headers as Record<string, string> || {}),
  };

  const resp = await fetch(url, {
    ...options,
    headers,
    signal: AbortSignal.timeout(30_000),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(
      `LinkedIn API error (${resp.status}): ${text.slice(0, 500)}`,
    );
  }

  const contentType = resp.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return resp.json() as Promise<T>;
  }

  return {} as T;
}

// ---------------------------------------------------------------------------
// Public API -- Create Post
// ---------------------------------------------------------------------------

/**
 * Create a LinkedIn post (UGC format via /posts endpoint).
 */
export async function createPost(
  config: LinkedInConfig,
  options: CreatePostOptions,
): Promise<LinkedInPost> {
  const author = options.asOrganization && config.organizationUrn
    ? config.organizationUrn
    : config.personUrn;

  if (!author) {
    throw new Error(
      'No author URN configured. Set linkedin.person_urn (or linkedin.organization_urn for org posts) in config.yaml.',
    );
  }

  const body: Record<string, unknown> = {
    author,
    commentary: options.text,
    visibility: options.visibility || 'PUBLIC',
    distribution: {
      feedDistribution: 'MAIN_FEED',
      targetEntities: [],
      thirdPartyDistributionChannels: [],
    },
    lifecycleState: 'PUBLISHED',
  };

  // Attach media if provided
  if (options.mediaAssets?.length) {
    body.content = {
      multiImage: {
        images: options.mediaAssets.map(asset => ({
          id: asset.id,
          altText: asset.title || '',
        })),
      },
    };
  }

  const result = await linkedInFetch<LinkedInPost>(
    `${LINKEDIN_REST_BASE}/posts`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
    config,
  );

  return result;
}

// ---------------------------------------------------------------------------
// Public API -- Upload Image
// ---------------------------------------------------------------------------

/**
 * Upload an image to LinkedIn for use in posts.
 * Two-step process: register upload, then PUT binary data.
 *
 * @param config LinkedIn configuration
 * @param imageSource Local file path or URL to download from
 * @returns The asset URN to use in createPost
 */
export async function uploadImage(
  config: LinkedInConfig,
  imageSource: string,
): Promise<ImageUploadResult> {
  const owner = config.personUrn;
  if (!owner) {
    throw new Error('linkedin.person_urn required for image upload.');
  }

  // Step 1: Register the upload
  const registerBody = {
    registerUploadRequest: {
      recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
      owner,
      serviceRelationships: [
        {
          relationshipType: 'OWNER',
          identifier: 'urn:li:userGeneratedContent',
        },
      ],
    },
  };

  const registerResp = await linkedInFetch<Record<string, unknown>>(
    `${LINKEDIN_API_BASE}/assets?action=registerUpload`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registerBody),
    },
    config,
  );

  const value = registerResp.value as Record<string, unknown> | undefined;
  if (!value) {
    throw new Error('LinkedIn image register failed: no value in response');
  }

  const asset = value.asset as string;
  const uploadMechanism = value.uploadMechanism as Record<string, unknown>;
  const uploadRequest =
    uploadMechanism?.[
      'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'
    ] as Record<string, unknown> | undefined;

  if (!uploadRequest?.uploadUrl) {
    throw new Error('LinkedIn image register failed: no uploadUrl in response');
  }

  const uploadUrl = uploadRequest.uploadUrl as string;

  // Step 2: Get the image binary
  let imageBuffer: Buffer;

  if (imageSource.startsWith('http://') || imageSource.startsWith('https://')) {
    const imgResp = await fetch(imageSource, {
      signal: AbortSignal.timeout(30_000),
    });
    if (!imgResp.ok) {
      throw new Error(`Failed to download image from ${imageSource}: ${imgResp.status}`);
    }
    imageBuffer = Buffer.from(await imgResp.arrayBuffer());
  } else {
    const imgPath = resolve(imageSource);
    if (!existsSync(imgPath)) {
      throw new Error(`Image file not found: ${imgPath}`);
    }
    imageBuffer = readFileSync(imgPath);
  }

  // Step 3: PUT the binary to the upload URL
  const putResp = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
      'Content-Type': 'application/octet-stream',
    },
    body: imageBuffer,
    signal: AbortSignal.timeout(60_000),
  });

  if (!putResp.ok) {
    const errText = await putResp.text().catch(() => '');
    throw new Error(`LinkedIn image upload PUT failed (${putResp.status}): ${errText.slice(0, 300)}`);
  }

  return { asset };
}

// ---------------------------------------------------------------------------
// Public API -- Get Profile
// ---------------------------------------------------------------------------

/**
 * Get the authenticated user's profile info.
 */
export async function getProfile(config: LinkedInConfig): Promise<LinkedInProfile> {
  return linkedInFetch<LinkedInProfile>(
    `${LINKEDIN_API_BASE}/userinfo`,
    { method: 'GET' },
    config,
  );
}

// ---------------------------------------------------------------------------
// CLI (when run directly)
// ---------------------------------------------------------------------------

async function cli() {
  const args = process.argv.slice(2);
  const command = args[0];
  const config = loadLinkedInConfig();

  if (!command || command === '--help') {
    console.log(`LinkedIn API CLI

Commands:
  create-post --text "..." [--visibility PUBLIC|CONNECTIONS] [--as-org]
  upload-image <file-or-url>
  profile`);
    return;
  }

  const getArg = (flag: string): string | undefined => {
    const i = args.indexOf(flag);
    return i >= 0 && i + 1 < args.length ? args[i + 1] : undefined;
  };

  switch (command) {
    case 'create-post': {
      const text = getArg('--text');
      if (!text) {
        console.error('--text required');
        process.exit(1);
      }
      const visibility = (getArg('--visibility') || 'PUBLIC') as 'PUBLIC' | 'CONNECTIONS';
      const asOrg = args.includes('--as-org');
      const result = await createPost(config, { text, visibility, asOrganization: asOrg });
      console.log(JSON.stringify(result, null, 2));
      break;
    }

    case 'upload-image': {
      const source = args[1];
      if (!source) {
        console.error('Image file path or URL required');
        process.exit(1);
      }
      const result = await uploadImage(config, source);
      console.log(JSON.stringify(result, null, 2));
      break;
    }

    case 'profile': {
      const profile = await getProfile(config);
      console.log(JSON.stringify(profile, null, 2));
      break;
    }

    default:
      console.error(`Unknown command: ${command}`);
      process.exit(1);
  }
}

const isMain =
  process.argv[1]?.endsWith('linkedin-api.ts') ||
  process.argv[1]?.endsWith('linkedin-api.js');
if (isMain) {
  cli().catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}
