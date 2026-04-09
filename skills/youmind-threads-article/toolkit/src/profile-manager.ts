/**
 * profile-manager.ts — voice/history/lessons persistence for Threads profiles.
 *
 * IO-only module. Does not prompt users or make decisions about profile contents.
 * Onboarding (first-time profile creation) lives in cli.ts.
 *
 * Storage layout (all under skill root):
 *   profiles/
 *     _index.json          (committed marker, this module ignores it)
 *     <name>/
 *       voice.yaml         (VoiceProfile)
 *       history.yaml       (HistoryEntry[], append-only list)
 *       lessons.md         (markdown, append-only)
 */

import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
} from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface VoiceProfile {
  name: string;
  created_at: string;
  tone: string;
  persona: string;
  pov: string;
  chain: {
    length_preference: 'short' | 'medium' | 'long';
    hook_style: string;
    payoff_required: boolean;
  };
  hashtags: {
    strategy: 'inline' | 'trailing' | 'none';
    max_count: number;
  };
  reference_threads: string[];
  blacklist_words: string[];
}

export interface HistoryEntry {
  date: string;
  topic: string;
  segments: number;
  char_total: number;
  posts: Array<{ index: number; id: string; permalink: string }>;
  stats: null | { likes?: number; reposts?: number; replies?: number };
}

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_DIR = resolve(__dirname, '../..');
const PROFILES_DIR = resolve(PROJECT_DIR, 'profiles');

function profileDir(name: string): string {
  return resolve(PROFILES_DIR, name);
}

function ensureProfileDir(name: string): string {
  const d = profileDir(name);
  if (!existsSync(d)) {
    mkdirSync(d, { recursive: true });
  }
  return d;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** List profile names found on disk (excludes _index.json marker). */
export function listProfiles(): string[] {
  if (!existsSync(PROFILES_DIR)) return [];
  return readdirSync(PROFILES_DIR)
    .filter(name => {
      if (name.startsWith('_') || name.startsWith('.')) return false;
      const full = resolve(PROFILES_DIR, name);
      return statSync(full).isDirectory();
    })
    .sort();
}

/** Load a voice profile, or null if not found. */
export function loadProfile(name: string): VoiceProfile | null {
  const p = resolve(profileDir(name), 'voice.yaml');
  if (!existsSync(p)) return null;
  const parsed = parseYaml(readFileSync(p, 'utf-8'));
  if (!parsed || typeof parsed !== 'object') return null;
  return parsed as VoiceProfile;
}

/** Write (create or overwrite) voice.yaml. */
export function saveProfile(profile: VoiceProfile): void {
  ensureProfileDir(profile.name);
  const p = resolve(profileDir(profile.name), 'voice.yaml');
  writeFileSync(p, stringifyYaml(profile), 'utf-8');
}

/** Append a history entry. Creates history.yaml if missing. */
export function appendHistory(profileName: string, entry: HistoryEntry): void {
  ensureProfileDir(profileName);
  const p = resolve(profileDir(profileName), 'history.yaml');
  let existing: HistoryEntry[] = [];
  if (existsSync(p)) {
    const parsed = parseYaml(readFileSync(p, 'utf-8'));
    if (Array.isArray(parsed)) {
      existing = parsed as HistoryEntry[];
    }
  }
  existing.push(entry);
  writeFileSync(p, stringifyYaml(existing), 'utf-8');
}

/** Load lessons.md content, or empty string if missing. */
export function loadLessons(profileName: string): string {
  const p = resolve(profileDir(profileName), 'lessons.md');
  if (!existsSync(p)) return '';
  return readFileSync(p, 'utf-8');
}

/** Append markdown to lessons.md. Creates the file if missing. */
export function appendLessons(profileName: string, markdown: string): void {
  ensureProfileDir(profileName);
  const p = resolve(profileDir(profileName), 'lessons.md');
  const prefix = existsSync(p) ? '\n\n' : '';
  const current = existsSync(p) ? readFileSync(p, 'utf-8') : '';
  writeFileSync(p, current + prefix + markdown.trimEnd() + '\n', 'utf-8');
}
