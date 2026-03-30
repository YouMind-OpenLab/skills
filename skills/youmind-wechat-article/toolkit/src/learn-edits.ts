/**
 * Learn from human edits by analyzing diffs between draft and final.
 *
 * Usage:
 *   npx tsx src/learn-edits.ts --client demo --draft draft.md --final final.md
 *   npx tsx src/learn-edits.ts --client demo --summarize
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_DIR = resolve(__dirname, '../..');

// ---------------------------------------------------------------------------
// Diff analysis
// ---------------------------------------------------------------------------

interface DiffAnalysis {
  total_additions: number;
  total_deletions: number;
  categories: {
    word_replacements: unknown[];
    paragraph_deletions: unknown[];
    paragraph_additions: unknown[];
    structure_changes: unknown[];
    title_changes: { from: string; to: string }[];
    tone_adjustments: unknown[];
  };
  raw_additions: string[];
  raw_deletions: string[];
}

function analyzeDiff(draftText: string, finalText: string): DiffAnalysis {
  const draftLines = draftText.split('\n');
  const finalLines = finalText.split('\n');

  // Simple line-based diff (additions and deletions)
  const draftSet = new Set(draftLines.map(l => l.trim()));
  const finalSet = new Set(finalLines.map(l => l.trim()));

  const addedLines: string[] = [];
  const removedLines: string[] = [];

  for (const line of finalLines) {
    const trimmed = line.trim();
    if (trimmed && !draftSet.has(trimmed)) addedLines.push(trimmed);
  }
  for (const line of draftLines) {
    const trimmed = line.trim();
    if (trimmed && !finalSet.has(trimmed)) removedLines.push(trimmed);
  }

  const categories: DiffAnalysis['categories'] = {
    word_replacements: [],
    paragraph_deletions: [],
    paragraph_additions: [],
    structure_changes: [],
    title_changes: [],
    tone_adjustments: [],
  };

  // Detect title changes
  for (const r of removedLines) {
    if (r.startsWith('# ')) {
      for (const a of addedLines) {
        if (a.startsWith('# ')) {
          categories.title_changes.push({
            from: r.slice(2).trim(),
            to: a.slice(2).trim(),
          });
        }
      }
    }
  }

  // Detect H2 structure changes
  const removedH2 = removedLines.filter(l => l.startsWith('## '));
  const addedH2 = addedLines.filter(l => l.startsWith('## '));
  if (removedH2.length || addedH2.length) {
    categories.structure_changes.push({
      removed_headings: removedH2.map(h => h.slice(3).trim()),
      added_headings: addedH2.map(h => h.slice(3).trim()),
    });
  }

  return {
    total_additions: addedLines.length,
    total_deletions: removedLines.length,
    categories,
    raw_additions: addedLines.slice(0, 20),
    raw_deletions: removedLines.slice(0, 20),
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const args = process.argv.slice(2);
  const get = (flag: string) => {
    const i = args.indexOf(flag);
    return i >= 0 && i + 1 < args.length ? args[i + 1] : undefined;
  };
  const has = (flag: string) => args.includes(flag);

  const client = get('--client');
  if (!client) { console.error('需要 --client 参数'); process.exit(1); }

  const lessonsDir = resolve(PROJECT_DIR, 'clients', client, 'lessons');
  mkdirSync(lessonsDir, { recursive: true });

  // --- Summarize mode ---
  if (has('--summarize')) {
    const files = readdirSync(lessonsDir).filter(f => f.endsWith('.yaml')).sort();
    const lessons: unknown[] = [];
    for (const f of files) {
      try {
        const data = parseYaml(readFileSync(resolve(lessonsDir, f), 'utf-8'));
        if (data) lessons.push(data);
      } catch (e) {
        console.error(`[WARN] 跳过无法解析的文件 ${f}: ${e}`);
      }
    }
    console.log(JSON.stringify(lessons, null, 2));
    console.error(`Total lessons: ${lessons.length}`);
    if (lessons.length >= 5) {
      console.error('Recommendation: Run playbook update to consolidate patterns.');
    }
    return;
  }

  // --- Diff mode ---
  const draftPath = get('--draft');
  const finalPath = get('--final');
  if (!draftPath || !finalPath) {
    console.error('需要 --draft 和 --final 参数 (或使用 --summarize)');
    process.exit(1);
  }

  if (!existsSync(draftPath)) { console.error(`Draft 文件不存在: ${draftPath}`); process.exit(1); }
  if (!existsSync(finalPath)) { console.error(`Final 文件不存在: ${finalPath}`); process.exit(1); }

  const draftText = readFileSync(draftPath, 'utf-8');
  const finalText = readFileSync(finalPath, 'utf-8');

  const analysis = analyzeDiff(draftText, finalText);

  const now = new Date();
  const lesson = {
    date: now.toISOString().slice(0, 10),
    draft: draftPath,
    final: finalPath,
    edits: analysis,
    patterns: [], // To be filled by Agent analysis
  };

  const ts = now.toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '_');
  const outputFile = resolve(lessonsDir, `${ts}-diff.yaml`);
  writeFileSync(outputFile, stringifyYaml(lesson), 'utf-8');

  console.log(JSON.stringify(analysis, null, 2));
  console.error(`Lesson saved to: ${outputFile}`);

  // Check if playbook update needed
  const lessonCount = readdirSync(lessonsDir).filter(f => f.endsWith('.yaml')).length;
  if (lessonCount >= 5 && lessonCount % 5 === 0) {
    console.error(
      `${lessonCount} lessons accumulated. Consider updating playbook:\n` +
      `  npx tsx src/learn-edits.ts --client ${client} --summarize`,
    );
  }
}

// Export for module usage
export { analyzeDiff, type DiffAnalysis };

const isMain = process.argv[1]?.includes('learn-edits');
if (isMain) main();
