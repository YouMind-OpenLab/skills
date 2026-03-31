/**
 * Mermaid diagram processor — renders mermaid code blocks to PNG via mmdc.
 * mmdc is an optional dependency; gracefully degrades when unavailable.
 */

import { execSync } from 'node:child_process';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type * as cheerio from 'cheerio';

let mermaidAvailable: boolean | undefined;

function checkMmdc(): boolean {
  if (mermaidAvailable !== undefined) return mermaidAvailable;
  try {
    execSync('mmdc --version', { stdio: 'pipe', timeout: 5000 });
    mermaidAvailable = true;
  } catch {
    mermaidAvailable = false;
  }
  return mermaidAvailable;
}

export function renderMermaidToPng(code: string): string | null {
  if (!checkMmdc()) return null;

  const tempDir = mkdtempSync(join(tmpdir(), 'mermaid-'));
  const inputFile = join(tempDir, 'input.mmd');
  const outputFile = join(tempDir, 'output.png');

  try {
    writeFileSync(inputFile, code, 'utf-8');
    execSync(
      `mmdc -i "${inputFile}" -o "${outputFile}" -b white --quiet -s 2`,
      { timeout: 30000, stdio: 'pipe' },
    );
    if (existsSync(outputFile)) {
      return outputFile;
    }
    return null;
  } catch (error) {
    console.warn('Mermaid rendering failed:', error instanceof Error ? error.message : error);
    return null;
  }
}

export function processMermaidBlocks($: cheerio.CheerioAPI): void {
  if (!checkMmdc()) {
    const hasMermaid = $('pre code.language-mermaid').length > 0;
    if (hasMermaid) {
      console.warn(
        'Found mermaid code blocks but mmdc is not installed.\n' +
          'Install it for mermaid diagram support: npm install -g @mermaid-js/mermaid-cli',
      );
    }
    return;
  }

  $('pre').each((_, pre) => {
    const code = $(pre).find('code.language-mermaid');
    if (!code.length) return;

    const mermaidCode = code.text();
    if (!mermaidCode.trim()) return;

    const pngPath = renderMermaidToPng(mermaidCode);
    if (pngPath) {
      $(pre).replaceWith(
        `<p style="text-align: center; margin: 24px 0;"><img src="${pngPath}" alt="Mermaid Diagram" style="max-width: 100%; height: auto;"></p>`,
      );
    }
  });
}

export function isMermaidAvailable(): boolean {
  return checkMmdc();
}
