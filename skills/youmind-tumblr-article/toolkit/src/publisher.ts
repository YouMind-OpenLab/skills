import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { adaptForTumblr } from './content-adapter.js';
import {
  createTumblrPost,
  type TumblrPostState,
  loadTumblrConfig,
  type TumblrConfig,
  type TumblrPost,
} from './tumblr-api.js';

export interface PublishOptions {
  input: string;
  isFile?: boolean;
  title?: string;
  tags?: string[];
  coverImageUrl?: string;
  blogIdentifier?: string;
  state?: TumblrPostState;
  publishOn?: string;
  date?: string;
  slug?: string;
  config?: TumblrConfig;
}

export interface PublishResult {
  post: TumblrPost;
  body: string;
  warnings: string[];
}

function getHomeDir(): string {
  return process.env.HOME || process.env.USERPROFILE || '';
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'tumblr-post';
}

export function saveLocalDraft(title: string, body: string): string {
  const home = getHomeDir();
  const slug = slugify(title);

  if (home) {
    const canonicalDir = resolve(home, '.youmind', 'articles', 'tumblr');
    mkdirSync(canonicalDir, { recursive: true });
    const canonicalPath = resolve(canonicalDir, `${slug}.html`);
    writeFileSync(canonicalPath, body, 'utf-8');
    return canonicalPath;
  }

  const fallbackDir = resolve(process.cwd(), '..', 'output');
  mkdirSync(fallbackDir, { recursive: true });
  const fallbackPath = resolve(fallbackDir, `${slug}.html`);
  writeFileSync(fallbackPath, body, 'utf-8');
  return fallbackPath;
}

export async function publish(options: PublishOptions): Promise<PublishResult> {
  const config = options.config ?? loadTumblrConfig();
  if (!config.apiKey) {
    throw new Error('youmind.api_key not set. Configure ~/.youmind/config.yaml.');
  }

  const raw =
    options.isFile !== false && existsSync(resolve(options.input))
      ? readFileSync(resolve(options.input), 'utf-8')
      : options.input;

  const adapted = adaptForTumblr({
    raw,
    title: options.title,
    tags: options.tags,
    coverImageUrl: options.coverImageUrl,
  });

  const post = await createTumblrPost(config, {
    title: adapted.title,
    content: adapted.body,
    tags: adapted.tags,
    coverImageUrl: options.coverImageUrl,
    blogIdentifier: options.blogIdentifier,
    state: options.state,
    publishOn: options.publishOn,
    date: options.date,
    slug: options.slug,
  });

  return {
    post,
    body: adapted.body,
    warnings: adapted.warnings,
  };
}

export function preview(options: Omit<PublishOptions, 'config'>): {
  title: string;
  body: string;
  tags: string[];
  warnings: string[];
} {
  const raw =
    options.isFile !== false && existsSync(resolve(options.input))
      ? readFileSync(resolve(options.input), 'utf-8')
      : options.input;

  const adapted = adaptForTumblr({
    raw,
    title: options.title,
    tags: options.tags,
    coverImageUrl: options.coverImageUrl,
  });

  return adapted;
}
