/**
 * Mermaid 图表处理器
 * 使用 @mermaid-js/mermaid-cli (mmdc) 将 mermaid 代码渲染为 PNG 图片
 *
 * 流程: mermaid code → mmdc → PNG 临时文件 → <img src="path"> → CLI 上传到微信 CDN
 *
 * mmdc 为可选依赖，未安装时优雅降级（保留代码块原样）
 * 安装方式: npm install -g @mermaid-js/mermaid-cli
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

/**
 * 使用 mmdc 将 mermaid 代码渲染为 PNG 文件
 * @returns PNG 文件路径，失败或 mmdc 不可用时返回 null
 */
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
  // 注意：不删除临时文件！CLI publish 需要读取 PNG 进行上传
  // 临时文件在系统重启时会被自动清理
}

/**
 * 处理 HTML 中的 mermaid 代码块
 * 将 ```mermaid 代码块渲染为 PNG 图片
 * 图片路径会被 converter 的 processImages 收集，CLI publish 时上传到微信 CDN
 */
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
    // 渲染失败时保留原代码块
  });
}

/**
 * 检查 mermaid CLI 是否可用
 */
export function isMermaidAvailable(): boolean {
  return checkMmdc();
}
