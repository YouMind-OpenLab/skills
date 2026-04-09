#!/usr/bin/env node

/**
 * CLI for the youmind-threads-article skill.
 *
 * Commands:
 *   publish <input>                    full flow (input = draft file path or inline text)
 *   preview <input>                    steps 1-5, no actual publishing
 *   reply <parent_id> "<text>"         post a single reply to an existing Threads post
 *   validate                           check YouMind key + Threads binding
 *   list [--limit N]                   recent posts
 *   limits                             today's Threads publishing/reply quota
 *   profile list                       list known profiles
 *   profile show <name>                print profile voice.yaml contents
 *   profile create --name X --tone "" --length short|medium|long --hashtags inline|trailing|none
 *
 * Profile onboarding is interactive via `profile create` flags. The agent (following
 * SKILL.md instructions) asks the user about tone/length/hashtags via AskUserQuestion
 * and then calls `profile create` non-interactively with the answers.
 */

import { Command } from 'commander';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';
import {
  loadThreadsConfig,
  getBindingStatus,
  getPublishingLimits,
  listPosts,
  createContainer,
  publishContainer,
} from './threads-api.js';
import {
  loadProfile,
  saveProfile,
  listProfiles,
  type VoiceProfile,
} from './profile-manager.js';
import { publish, type ThreadsSegment, type PublishResult } from './publisher.js';
import { validateSegment } from './content-adapter.js';

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_DIR = resolve(__dirname, '../..');
const OUTPUT_DIR = resolve(PROJECT_DIR, 'output');

function ensureOutputDir(): void {
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

// ---------------------------------------------------------------------------
// Draft parsing
// ---------------------------------------------------------------------------

interface ParsedDraft {
  profile?: string;
  topic?: string;
  segments: string[];
  slug: string;
}

/**
 * Parse a draft file with optional YAML frontmatter and `## N` sections.
 * If no sections are found, the whole body is treated as a single segment.
 */
function parseDraftFile(filePath: string): ParsedDraft {
  const content = readFileSync(filePath, 'utf-8');
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

  let metadata: Record<string, unknown> = {};
  let body = content;
  if (fmMatch) {
    const parsed = parseYaml(fmMatch[1]);
    if (parsed && typeof parsed === 'object') {
      metadata = parsed as Record<string, unknown>;
    }
    body = fmMatch[2];
  }

  // Match "## N" headings at the start of a line (allow trailing whitespace)
  const sectionRegex = /^##\s+(\d+)\s*$/gm;
  const matches: Array<{ n: number; start: number; end: number }> = [];
  let m: RegExpExecArray | null;
  while ((m = sectionRegex.exec(body)) !== null) {
    matches.push({ n: parseInt(m[1], 10), start: m.index, end: m.index + m[0].length });
  }

  // Sort by order of appearance; split body into sections
  const segments: string[] = [];
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].end;
    const end = i + 1 < matches.length ? matches[i + 1].start : body.length;
    segments.push(body.slice(start, end).trim());
  }

  if (segments.length === 0) {
    const trimmed = body.trim();
    if (trimmed.length > 0) segments.push(trimmed);
  }

  const base = filePath.split('/').pop() ?? 'draft.md';
  const slug = base.replace(/\.md$/i, '');

  return {
    profile: metadata.profile as string | undefined,
    topic: metadata.topic as string | undefined,
    segments,
    slug,
  };
}

/**
 * Resolve user-provided input into a parsed draft.
 * If input is an existing file path, parse it. Otherwise treat input as a
 * single inline segment.
 */
function resolveInput(input: string): ParsedDraft {
  const p = resolve(process.cwd(), input);
  if (!input.includes('\n') && existsSync(p)) {
    return parseDraftFile(p);
  }
  return {
    segments: [input.trim()],
    slug: `inline-${Date.now()}`,
  };
}

// ---------------------------------------------------------------------------
// Profile helpers
// ---------------------------------------------------------------------------

function requireProfile(name: string): VoiceProfile {
  const profile = loadProfile(name);
  if (!profile) {
    throw new Error(
      `Profile '${name}' not found.\n` +
      `  Create it via:\n` +
      `    npx tsx src/cli.ts profile create --name ${name} --tone "<tone>" --length short|medium|long --hashtags inline|trailing|none\n` +
      `  Or have the agent ask the user (tone, length, hashtags) and call profile create with those answers.`,
    );
  }
  return profile;
}

function validateAllSegments(segments: string[]): ThreadsSegment[] {
  const total = segments.length;
  const out: ThreadsSegment[] = [];
  segments.forEach((text, i) => {
    const v = validateSegment(text);
    if (!v.ok) {
      console.error(`[ERROR] Segment ${i + 1}/${total} invalid: ${v.error}`);
      console.error(`        Content: ${text.slice(0, 80)}${text.length > 80 ? '...' : ''}`);
      process.exit(1);
    }
    out.push({ text, index: i + 1, total });
  });
  return out;
}

function savePrimaryDraft(slug: string, profile: string, topic: string | undefined, segments: string[]): string {
  ensureOutputDir();
  const path = resolve(OUTPUT_DIR, `${slug}.md`);
  if (existsSync(path)) return path; // preserve agent-written version
  const frontmatter = [
    '---',
    `profile: ${profile}`,
    ...(topic ? [`topic: ${JSON.stringify(topic)}`] : []),
    `segments: ${segments.length}`,
    '---',
    '',
  ].join('\n');
  const body = segments.map((text, i) => `## ${i + 1}\n\n${text}\n`).join('\n');
  writeFileSync(path, frontmatter + body, 'utf-8');
  return path;
}

function printPublishResult(result: PublishResult): void {
  if (!result.bound) {
    if (result.draftSavedTo) {
      console.log(`✔ Draft saved to: ${result.draftSavedTo}\n`);
    }
    console.log(result.upsellMessage ?? 'Threads account not bound.');
    return;
  }

  const count = result.posts?.length ?? 0;

  if (result.partialFailure) {
    const pf = result.partialFailure;
    console.log(`\n⚠️  Partial publish: ${pf.publishedCount}/${pf.totalCount} segments published.`);
    console.log(`Remaining segments saved to: ${pf.remainingDraftPath}`);
    console.log(
      `Resume with: npx tsx src/cli.ts publish ${pf.remainingDraftPath} --reply-to ${pf.lastPublishedId}`,
    );
    if (result.posts && result.posts[0]) {
      console.log(`First published post: ${result.posts[0].permalink}`);
    }
    return;
  }

  console.log(`\n✔ Published ${count} ${count === 1 ? 'post' : 'posts'} to Threads`);
  if (result.posts && result.posts[0]) {
    console.log(`First post: ${result.posts[0].permalink}`);
  }
  if (result.quotaWarning) {
    console.log(`\n⚠️  ${result.quotaWarning}`);
  }
}

// ---------------------------------------------------------------------------
// Commander setup
// ---------------------------------------------------------------------------

const program = new Command();

program
  .name('youmind-threads')
  .description('AI-powered Meta Threads publisher via YouMind proxy')
  .version('1.0.0');

// --- publish ---
program
  .command('publish <input>')
  .description('Publish a thread (full chain) or single post to Threads')
  .option('--profile <name>', 'Voice profile name', 'default')
  .option('--image <url>', 'Image URL (attached to first segment only)')
  .option('--video <url>', 'Video URL (attached to first segment only)')
  .option('--topic <text>', 'Topic (saved in history)')
  .option('--reply-to <id>', 'Start the chain as a reply to an existing Threads post id (used by partial-failure resume)')
  .action(async (input: string, opts: Record<string, string | undefined>) => {
    try {
      const parsed = resolveInput(input);
      const profileName = opts.profile ?? parsed.profile ?? 'default';
      requireProfile(profileName);

      const segments = validateAllSegments(parsed.segments);
      if (segments.length > 12) {
        console.warn(`[WARN] ${segments.length} segments — this is a long thread. Consider condensing.`);
      }

      // Ensure the primary draft file exists (for lesson-diffing later)
      const draftPath = savePrimaryDraft(parsed.slug, profileName, parsed.topic ?? opts.topic, parsed.segments);
      console.log(`Draft: ${draftPath}`);

      const result = await publish({
        segments,
        profileName,
        imageUrl: opts.image,
        videoUrl: opts.video,
        topic: parsed.topic ?? opts.topic,
        replyToExisting: opts.replyTo,
        draftSlug: parsed.slug,
      });
      printPublishResult(result);
    } catch (e) {
      console.error(`[ERROR] ${(e as Error).message}`);
      process.exit(1);
    }
  });

// --- preview ---
program
  .command('preview <input>')
  .description('Preview a thread locally without publishing')
  .option('--profile <name>', 'Voice profile name', 'default')
  .action((input: string, opts: Record<string, string | undefined>) => {
    try {
      const parsed = resolveInput(input);
      const profileName = opts.profile ?? parsed.profile ?? 'default';
      requireProfile(profileName);
      const segments = validateAllSegments(parsed.segments);

      console.log(`\n=== Threads Preview (profile: ${profileName}) ===`);
      if (parsed.topic) console.log(`Topic: ${parsed.topic}`);
      console.log(`Segments: ${segments.length}`);
      console.log(`Total chars: ${segments.reduce((s, x) => s + x.text.length, 0)}\n`);
      segments.forEach(s => {
        console.log(`--- ${s.index}/${s.total} (${s.text.length} chars) ---`);
        console.log(s.text);
        console.log('');
      });
    } catch (e) {
      console.error(`[ERROR] ${(e as Error).message}`);
      process.exit(1);
    }
  });

// --- reply ---
program
  .command('reply <parent_id> <text>')
  .description('Post a single reply to an existing Threads post')
  .option('--profile <name>', 'Voice profile name', 'default')
  .action(async (parentId: string, text: string, opts: Record<string, string | undefined>) => {
    try {
      const profileName = opts.profile ?? 'default';
      requireProfile(profileName);
      const segments = validateAllSegments([text.trim()]);

      const result = await publish({
        segments,
        profileName,
        replyToExisting: parentId,
      });
      printPublishResult(result);
    } catch (e) {
      console.error(`[ERROR] ${(e as Error).message}`);
      process.exit(1);
    }
  });

// --- validate ---
program
  .command('validate')
  .description('Check YouMind API key and Threads binding status')
  .action(async () => {
    try {
      const cfg = loadThreadsConfig();
      if (!cfg.apiKey) {
        console.error('[ERROR] youmind.api_key not set in config.yaml');
        process.exit(1);
      }
      console.log('YouMind API key: configured');

      const status = await getBindingStatus(cfg);
      if (!status.bound) {
        console.log('Threads binding: NOT BOUND');
        console.log('→ Visit https://youmind.com/settings/integrations to connect your Threads account');
        return;
      }
      console.log(`Threads binding: bound as @${status.username ?? '?'}`);
      if (status.expires_at) {
        console.log(`Token expires: ${status.expires_at}`);
      }

      const limits = await getPublishingLimits(cfg);
      console.log(`\nToday's quota:`);
      console.log(`  Posts:   ${limits.quota_posts_remaining} remaining`);
      console.log(`  Replies: ${limits.quota_replies_remaining} remaining`);
      console.log(`  Reset:   ${limits.reset_at}`);
    } catch (e) {
      console.error(`[ERROR] Validation failed: ${(e as Error).message}`);
      process.exit(1);
    }
  });

// --- list ---
program
  .command('list')
  .description('List recent Threads posts')
  .option('--limit <n>', 'Number of posts to fetch', '10')
  .action(async (opts: Record<string, string>) => {
    try {
      const cfg = loadThreadsConfig();
      const limit = parseInt(opts.limit ?? '10', 10);
      const result = await listPosts(cfg, limit);

      console.log(`\n--- Recent posts (${result.data.length}) ---\n`);
      for (const post of result.data) {
        const preview = post.text ? post.text.slice(0, 80) + (post.text.length > 80 ? '...' : '') : '(no text)';
        console.log(`[${post.created_time ?? '?'}] ${post.id}`);
        console.log(`  ${preview}`);
        console.log(`  ${post.permalink}`);
        console.log('');
      }
    } catch (e) {
      console.error(`[ERROR] ${(e as Error).message}`);
      process.exit(1);
    }
  });

// --- limits ---
program
  .command('limits')
  .description('Show today\'s Threads publishing/reply quota')
  .action(async () => {
    try {
      const cfg = loadThreadsConfig();
      const limits = await getPublishingLimits(cfg);
      console.log(`Posts remaining:   ${limits.quota_posts_remaining}`);
      console.log(`Replies remaining: ${limits.quota_replies_remaining}`);
      console.log(`Resets at:         ${limits.reset_at}`);
    } catch (e) {
      console.error(`[ERROR] ${(e as Error).message}`);
      process.exit(1);
    }
  });

// --- profile ---
const profileCmd = program.command('profile').description('Manage voice profiles');

profileCmd
  .command('list')
  .description('List known profiles')
  .action(() => {
    const names = listProfiles();
    if (names.length === 0) {
      console.log('No profiles yet. Create one with: profile create --name default --tone "..." --length short --hashtags none');
      return;
    }
    for (const name of names) {
      console.log(name);
    }
  });

profileCmd
  .command('show <name>')
  .description('Show a profile\'s voice.yaml contents')
  .action((name: string) => {
    const profile = loadProfile(name);
    if (!profile) {
      console.error(`[ERROR] Profile '${name}' not found`);
      process.exit(1);
    }
    console.log(JSON.stringify(profile, null, 2));
  });

profileCmd
  .command('create')
  .description('Create a new voice profile (typically called by the agent after asking the user)')
  .requiredOption('--name <name>', 'Profile name (e.g. default)')
  .requiredOption('--tone <tone>', 'Tone description (free text)')
  .requiredOption('--length <short|medium|long>', 'Chain length preference')
  .requiredOption('--hashtags <inline|trailing|none>', 'Hashtag strategy')
  .option('--persona <persona>', 'Persona description', '')
  .option('--pov <pov>', 'Point of view', 'first person singular')
  .option('--hook-style <style>', 'Hook style', 'counter-intuitive claim')
  .option('--max-hashtags <n>', 'Max hashtags per thread', '0')
  .action((opts: Record<string, string>) => {
    const length = opts.length as 'short' | 'medium' | 'long';
    if (!['short', 'medium', 'long'].includes(length)) {
      console.error(`[ERROR] --length must be short, medium, or long`);
      process.exit(1);
    }
    const strategy = opts.hashtags as 'inline' | 'trailing' | 'none';
    if (!['inline', 'trailing', 'none'].includes(strategy)) {
      console.error(`[ERROR] --hashtags must be inline, trailing, or none`);
      process.exit(1);
    }

    const profile: VoiceProfile = {
      name: opts.name,
      created_at: new Date().toISOString().slice(0, 10),
      tone: opts.tone,
      persona: opts.persona,
      pov: opts.pov,
      chain: {
        length_preference: length,
        hook_style: opts.hookStyle ?? 'counter-intuitive claim',
        payoff_required: true,
      },
      hashtags: {
        strategy,
        max_count: parseInt(opts.maxHashtags ?? '0', 10),
      },
      reference_threads: [],
      blacklist_words: [],
    };
    saveProfile(profile);
    console.log(`Profile '${profile.name}' saved to profiles/${profile.name}/voice.yaml`);
  });

// --- publish-container (hidden retry helper) ---
program
  .command('publish-container <container_id>', { hidden: true })
  .description('Retry publishing a previously created Threads container')
  .action(async (containerId: string) => {
    try {
      const cfg = loadThreadsConfig();
      const result = await publishContainer(cfg, containerId);
      console.log(`Published: ${result.permalink}`);
    } catch (e) {
      console.error(`[ERROR] ${(e as Error).message}`);
      process.exit(1);
    }
  });

// --- create-container (hidden debug helper) ---
program
  .command('create-container <text>', { hidden: true })
  .description('Create a Threads container without publishing (debug)')
  .option('--reply-to <id>', 'Reply target post id')
  .action(async (text: string, opts: Record<string, string | undefined>) => {
    try {
      const cfg = loadThreadsConfig();
      const result = await createContainer(cfg, {
        text,
        mediaType: 'TEXT',
        replyToId: opts.replyTo,
      });
      console.log(`Container: ${result.container_id}`);
    } catch (e) {
      console.error(`[ERROR] ${(e as Error).message}`);
      process.exit(1);
    }
  });

program.parse();
