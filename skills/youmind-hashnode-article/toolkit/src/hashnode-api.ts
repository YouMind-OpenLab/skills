/**
 * Hashnode GraphQL API client.
 *
 * API endpoint: https://gql.hashnode.com
 * Auth: Bearer token (Personal Access Token)
 *
 * Docs: https://apidocs.hashnode.com
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

const HASHNODE_GQL_ENDPOINT = 'https://gql.hashnode.com';

interface HashnodeConfig {
  token: string;
  publicationId: string;
}

interface FullConfig {
  hashnode: HashnodeConfig;
  youmind?: { api_key?: string; base_url?: string };
}

function loadCentralCredentials(): Record<string, unknown> {
  const home = process.env.HOME || process.env.USERPROFILE || '';
  const p = resolve(home, '.youmind-skill', 'credentials.yaml');
  if (existsSync(p)) {
    return parseYaml(readFileSync(p, 'utf-8')) ?? {};
  }
  return {};
}

export function loadConfig(): FullConfig {
  const central = loadCentralCredentials();
  let local: Record<string, unknown> = {};
  for (const name of ['config.yaml', 'config.example.yaml']) {
    const p = resolve(PROJECT_DIR, name);
    if (existsSync(p)) {
      local = parseYaml(readFileSync(p, 'utf-8')) ?? {};
      break;
    }
  }
  const hn = { ...(central.hashnode as Record<string, unknown> ?? {}), ...(local.hashnode as Record<string, unknown> ?? {}) };
  for (const [k, v] of Object.entries(hn)) {
    if (v === '' && (central.hashnode as Record<string, unknown>)?.[k]) {
      hn[k] = (central.hashnode as Record<string, unknown>)[k];
    }
  }
  const youmind = { ...(central.youmind as Record<string, unknown> ?? {}), ...(local.youmind as Record<string, unknown> ?? {}) };
  for (const [k, v] of Object.entries(youmind)) {
    if (v === '' && (central.youmind as Record<string, unknown>)?.[k]) {
      youmind[k] = (central.youmind as Record<string, unknown>)[k];
    }
  }
  return {
    hashnode: {
      token: (hn.token as string) || '',
      publicationId: (hn.publication_id as string) || '',
    },
    youmind: youmind as FullConfig['youmind'],
  };
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HashnodePost {
  id: string;
  title: string;
  subtitle: string | null;
  slug: string;
  url: string;
  canonicalUrl: string | null;
  coverImage: { url: string } | null;
  brief: string;
  content: { markdown: string; html: string };
  tags: { id: string; name: string; slug: string }[];
  series: { id: string; name: string } | null;
  publishedAt: string | null;
  readTimeInMinutes: number;
  reactionCount: number;
  views: number;
  [key: string]: unknown;
}

export interface PublishPostInput {
  title: string;
  contentMarkdown: string;
  subtitle?: string;
  tags?: { id: string; name: string; slug: string }[];
  tagSlugs?: string[];
  coverImageOptions?: { coverImageURL: string };
  canonicalUrl?: string;
  seriesId?: string;
  metaTags?: { title?: string; description?: string; image?: string };
  publishAs?: string;
  disableComments?: boolean;
}

export interface UpdatePostInput {
  title?: string;
  contentMarkdown?: string;
  subtitle?: string;
  tags?: { id: string; name: string; slug: string }[];
  tagSlugs?: string[];
  coverImageOptions?: { coverImageURL: string };
  canonicalUrl?: string;
  seriesId?: string;
  metaTags?: { title?: string; description?: string; image?: string };
}

interface GraphQLResponse<T> {
  data?: T;
  errors?: { message: string; extensions?: Record<string, unknown> }[];
}

// ---------------------------------------------------------------------------
// GraphQL client
// ---------------------------------------------------------------------------

async function gql<T = unknown>(
  token: string,
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  if (!token) {
    throw new Error(
      'Hashnode token not configured. Set hashnode.token in config.yaml.',
    );
  }

  const resp = await fetch(HASHNODE_GQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token,
    },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(
      `Hashnode API request failed (${resp.status}): ${text.slice(0, 500)}`,
    );
  }

  const result = (await resp.json()) as GraphQLResponse<T>;

  if (result.errors?.length) {
    const messages = result.errors.map(e => e.message).join('; ');
    throw new Error(`Hashnode GraphQL error: ${messages}`);
  }

  if (!result.data) {
    throw new Error('Hashnode API returned no data.');
  }

  return result.data;
}

// ---------------------------------------------------------------------------
// GraphQL Queries & Mutations
// ---------------------------------------------------------------------------

const PUBLISH_POST_MUTATION = `
  mutation PublishPost($input: PublishPostInput!) {
    publishPost(input: $input) {
      post {
        id
        title
        subtitle
        slug
        url
        canonicalUrl
        coverImage {
          url
        }
        brief
        tags {
          id
          name
          slug
        }
        series {
          id
          name
        }
        publishedAt
        readTimeInMinutes
      }
    }
  }
`;

const UPDATE_POST_MUTATION = `
  mutation UpdatePost($input: UpdatePostInput!) {
    updatePost(input: $input) {
      post {
        id
        title
        subtitle
        slug
        url
        canonicalUrl
        coverImage {
          url
        }
        brief
        tags {
          id
          name
          slug
        }
        series {
          id
          name
        }
        publishedAt
        readTimeInMinutes
      }
    }
  }
`;

const GET_POST_QUERY = `
  query GetPost($id: ID!) {
    post(id: $id) {
      id
      title
      subtitle
      slug
      url
      canonicalUrl
      coverImage {
        url
      }
      brief
      content {
        markdown
        html
      }
      tags {
        id
        name
        slug
      }
      series {
        id
        name
      }
      publishedAt
      readTimeInMinutes
      reactionCount
      views
    }
  }
`;

const LIST_POSTS_QUERY = `
  query ListPosts($publicationId: ObjectId!, $first: Int!) {
    publication(id: $publicationId) {
      id
      title
      posts(first: $first) {
        edges {
          node {
            id
            title
            subtitle
            slug
            url
            brief
            coverImage {
              url
            }
            tags {
              id
              name
              slug
            }
            series {
              id
              name
            }
            publishedAt
            readTimeInMinutes
            reactionCount
            views
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`;

const SEARCH_TAGS_QUERY = `
  query SearchTags($keyword: String!, $first: Int!) {
    searchTags(keyword: $keyword, first: $first) {
      edges {
        node {
          id
          name
          slug
          postsCount
        }
      }
    }
  }
`;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Publish a new post to a Hashnode publication.
 */
export async function publishPost(
  token: string,
  publicationId: string,
  options: PublishPostInput,
): Promise<HashnodePost> {
  const input: Record<string, unknown> = {
    publicationId,
    title: options.title,
    contentMarkdown: options.contentMarkdown,
  };

  if (options.subtitle) input.subtitle = options.subtitle;
  if (options.tagSlugs?.length) {
    // Use tag IDs if available, otherwise use slugs
    // Hashnode API accepts tags array with slug for matching
    input.tags = options.tagSlugs.map(slug => ({ slug, name: slug, id: '' }));
  }
  if (options.tags?.length) input.tags = options.tags;
  if (options.coverImageOptions) input.coverImageOptions = options.coverImageOptions;
  if (options.canonicalUrl) input.canonicalUrl = options.canonicalUrl;
  if (options.seriesId) input.seriesId = options.seriesId;
  if (options.metaTags) input.metaTags = options.metaTags;
  if (options.disableComments !== undefined) input.disableComments = options.disableComments;

  const result = await gql<{ publishPost: { post: HashnodePost } }>(
    token,
    PUBLISH_POST_MUTATION,
    { input },
  );

  return result.publishPost.post;
}

/**
 * Update an existing Hashnode post.
 */
export async function updatePost(
  token: string,
  postId: string,
  options: UpdatePostInput,
): Promise<HashnodePost> {
  const input: Record<string, unknown> = {
    id: postId,
  };

  if (options.title !== undefined) input.title = options.title;
  if (options.contentMarkdown !== undefined) input.contentMarkdown = options.contentMarkdown;
  if (options.subtitle !== undefined) input.subtitle = options.subtitle;
  if (options.tags?.length) input.tags = options.tags;
  if (options.tagSlugs?.length) {
    input.tags = options.tagSlugs.map(slug => ({ slug, name: slug, id: '' }));
  }
  if (options.coverImageOptions) input.coverImageOptions = options.coverImageOptions;
  if (options.canonicalUrl !== undefined) input.canonicalUrl = options.canonicalUrl;
  if (options.seriesId !== undefined) input.seriesId = options.seriesId;
  if (options.metaTags) input.metaTags = options.metaTags;

  const result = await gql<{ updatePost: { post: HashnodePost } }>(
    token,
    UPDATE_POST_MUTATION,
    { input },
  );

  return result.updatePost.post;
}

/**
 * Get a single Hashnode post by ID.
 */
export async function getPost(
  token: string,
  postId: string,
): Promise<HashnodePost> {
  const result = await gql<{ post: HashnodePost }>(
    token,
    GET_POST_QUERY,
    { id: postId },
  );

  return result.post;
}

/**
 * List posts from a Hashnode publication.
 */
export async function listPosts(
  token: string,
  publicationId: string,
  first = 10,
): Promise<HashnodePost[]> {
  const result = await gql<{
    publication: {
      posts: {
        edges: { node: HashnodePost }[];
        pageInfo: { hasNextPage: boolean; endCursor: string | null };
      };
    };
  }>(token, LIST_POSTS_QUERY, { publicationId, first });

  return result.publication.posts.edges.map(e => e.node);
}

/**
 * Search for Hashnode tags by keyword.
 */
export async function searchTags(
  token: string,
  keyword: string,
  first = 10,
): Promise<{ id: string; name: string; slug: string; postsCount: number }[]> {
  const result = await gql<{
    searchTags: {
      edges: { node: { id: string; name: string; slug: string; postsCount: number } }[];
    };
  }>(token, SEARCH_TAGS_QUERY, { keyword, first });

  return result.searchTags.edges.map(e => e.node);
}
