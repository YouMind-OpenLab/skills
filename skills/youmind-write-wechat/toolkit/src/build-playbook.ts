/**
 * Build writing playbook from historical corpus.
 *
 * Usage:
 *   npx tsx src/build-playbook.ts --client demo
 *   npx tsx src/build-playbook.ts --client demo --verbose
 */

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_DIR = resolve(__dirname, '../..');

function main() {
  const args = process.argv.slice(2);
  const get = (flag: string) => {
    const i = args.indexOf(flag);
    return i >= 0 && i + 1 < args.length ? args[i + 1] : undefined;
  };
  const verbose = args.includes('--verbose');
  const client = get('--client');
  if (!client) { console.error('需要 --client 参数'); process.exit(1); }

  const corpusDir = resolve(PROJECT_DIR, 'clients', client, 'corpus');
  if (!existsSync(corpusDir)) {
    console.error(`Corpus directory not found: ${corpusDir}`);
    console.error(`Create it and add .md files: mkdir -p ${corpusDir}`);
    process.exit(1);
  }

  const files = readdirSync(corpusDir)
    .filter(f => f.endsWith('.md'))
    .sort()
    .map(f => resolve(corpusDir, f));

  if (!files.length) {
    console.error(`No .md files found in ${corpusDir}`);
    console.error('Add at least 20 historical articles (50+ recommended).');
    process.exit(1);
  }

  let totalChars = 0;
  const titleLengths: number[] = [];
  const h2Counts: number[] = [];
  const articles: { file: string; chars: number; title: string; h2_count: number }[] = [];
  let skipped = 0;

  for (const fp of files) {
    let text: string;
    try {
      text = readFileSync(fp, 'utf-8');
    } catch (e) {
      console.error(`[WARN] 无法读取文件 ${fp}: ${e}`);
      skipped++;
      continue;
    }

    if (!text.trim()) {
      console.error(`[WARN] 跳过空文件: ${fp}`);
      skipped++;
      continue;
    }

    const chars = text.length;
    totalChars += chars;

    let title = '';
    let h2Count = 0;

    for (const line of text.split('\n')) {
      const stripped = line.trim();
      if (stripped.startsWith('# ') && !stripped.startsWith('## ')) {
        title = stripped.slice(2).trim();
        titleLengths.push(title.length);
      } else if (stripped.startsWith('## ')) {
        h2Count++;
      }
    }

    h2Counts.push(h2Count);
    const fileName = fp.split('/').pop()!;
    articles.push({ file: fileName, chars, title, h2_count: h2Count });

    if (verbose) {
      console.error(`  ${fileName} — ${chars} chars, title="${title}", h2=${h2Count}`);
    }
  }

  if (!articles.length) {
    console.error('所有 corpus 文件均无效，无法生成统计信息。');
    process.exit(1);
  }

  if (skipped) console.error(`[WARN] 跳过 ${skipped} 个无效或空文件`);

  const avg = (arr: number[]) => arr.length ? Math.floor(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

  const stats = {
    total_articles: articles.length,
    avg_chars: Math.floor(totalChars / articles.length),
    avg_title_length: avg(titleLengths),
    avg_h2_count: avg(h2Counts),
    articles,
  };

  console.log(JSON.stringify(stats, null, 2));

  console.log(`\n--- Batch Analysis Instructions ---`);
  console.log(`Total articles: ${articles.length}`);
  console.log(`Average length: ${stats.avg_chars} chars`);
  console.log(`Average title length: ${stats.avg_title_length} chars`);
  console.log(`Average H2 sections: ${stats.avg_h2_count}`);
  console.log();
  console.log('Read each article and extract the following patterns:');
  console.log('1. Title patterns (character count range, common strategies)');
  console.log('2. Opening patterns (hook types, first sentence styles)');
  console.log('3. Paragraph rhythm (sentence count distribution)');
  console.log('4. Word fingerprints (forbidden words, catchphrases)');
  console.log('5. H2 naming habits');
  console.log('6. Ending patterns (CTA types)');
  console.log('7. Emotional tone (formal/casual/humorous spectrum)');
  console.log('8. Image style preferences');
  console.log();
  console.log(`Save results to: ${resolve(PROJECT_DIR, 'clients', client, 'playbook.md')}`);
}

const isMain = process.argv[1]?.includes('build-playbook');
if (isMain) main();
