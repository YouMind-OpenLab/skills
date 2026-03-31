/**
 * YouMind Dynamic Theme Engine for WeChat
 *
 * Ported from YouMind's styles.ts — generates WeChat-compatible inline CSS
 * dynamically based on theme key + color. No YAML theme files needed.
 *
 * 4 themes: simple | center | decoration | prominent
 * 8 preset colors + custom HEX color support
 */

// --- Preset Colors ---

export const PRESET_COLORS: Record<string, string> = {
  'classic-blue': '#3498db',
  'vibrant-red': '#e74c3c',
  'fresh-green': '#2ecc71',
  'elegant-purple': '#9b59b6',
  'warm-orange': '#f39c12',
  'mint-cyan': '#1abc9c',
  'ink-gray': '#34495e',
  'rose-pink': '#e91e63',
};

export const PRESET_COLOR_LIST = Object.values(PRESET_COLORS);
export const DEFAULT_COLOR = '#3498db';
export const DEFAULT_THEME = 'simple';

// --- Types ---

export type ThemeKey = 'simple' | 'center' | 'decoration' | 'prominent';
export type HeadingSize = 'minus2' | 'minus1' | 'standard' | 'plus1';
export type ParagraphSpacing = 'compact' | 'normal' | 'loose';
export type FontFamily = 'default' | 'optima' | 'serif';

export interface ThemeStyles {
  container: string;
  h1: string;
  h2: string;
  h3: string;
  h4: string;
  h5: string;
  h6: string;
  p: string;
  strong: string;
  em: string;
  strike: string;
  u: string;
  a: string;
  ul: string;
  ol: string;
  li: string;
  liText: string;
  taskList: string;
  taskListItem: string;
  taskListItemCheckbox: string;
  blockquote: string;
  code: string;
  pre: string;
  hr: string;
  img: string;
  tableWrapper: string;
  table: string;
  th: string;
  td: string;
  tr: string;
  codeBlockPre: string;
  codeBlockCode: string;
}

export interface Theme {
  name: string;
  key: ThemeKey;
  description: string;
  color: string;
  styles: ThemeStyles;
}

export interface ThemeOptions {
  themeKey?: ThemeKey;
  color?: string;
  fontFamily?: FontFamily;
  fontSize?: number;
  headingSize?: HeadingSize;
  paragraphSpacing?: ParagraphSpacing;
}

// --- Font Configs ---

const FONTS: Record<string, string> = {
  default:
    'PingFang SC,system-ui,-apple-system,BlinkMacSystemFont,Helvetica Neue,Hiragino Sans GB,Microsoft YaHei UI,Microsoft YaHei,Arial,sans-serif',
  optima: 'Georgia, Microsoft YaHei, PingFangSC, serif',
  serif:
    'Optima-Regular, Optima, PingFangSC-light, PingFangTC-light, "PingFang SC", Cambria, Cochin, Georgia, Times, "Times New Roman", serif',
};

const PARAGRAPH_SPACING_MAP: Record<ParagraphSpacing, number> = {
  compact: 12,
  normal: 20,
  loose: 28,
};

const HEADING_SIZE_SCALE: Record<HeadingSize, number> = {
  minus2: 0.64,
  minus1: 0.8,
  standard: 1.0,
  plus1: 1.15,
};

const HEADING_SPACING_SCALE: Record<HeadingSize, number> = {
  minus2: 0.5,
  minus1: 0.72,
  standard: 1.0,
  plus1: 1.18,
};

const LINE_HEIGHT_MAP: Record<number, number> = {
  14: 1.8,
  15: 1.78,
  16: 1.75,
  17: 1.72,
  18: 1.7,
};

// --- Color Palette ---

export class ColorPalette {
  private mainColor: string;
  private luminance: number;

  constructor(color: string) {
    this.mainColor = color;
    this.luminance = ColorPalette.calcLuminance(color);
  }

  private static hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 0, b: 0 };
  }

  private static rgbToHex(r: number, g: number, b: number): string {
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }

  private static calcLuminance(hex: string): number {
    const rgb = ColorPalette.hexToRgb(hex);
    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((val) => {
      const n = val / 255;
      return n <= 0.03928 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  private adjustBrightness(hex: string, amount: number): string {
    const rgb = ColorPalette.hexToRgb(hex);
    const lum = ColorPalette.calcLuminance(hex);
    let factor: number;
    if (amount > 0) {
      factor = lum < 0.4 ? amount * 1.5 : amount * 0.8;
    } else {
      factor = lum > 0.6 ? amount * 1.5 : amount * 0.8;
    }
    const adj = (v: number) => Math.min(255, Math.max(0, Math.round(v * (1 + factor))));
    return ColorPalette.rgbToHex(adj(rgb.r), adj(rgb.g), adj(rgb.b));
  }

  private mix(c1: string, c2: string, ratio: number): string {
    const rgb1 = ColorPalette.hexToRgb(c1);
    const rgb2 = ColorPalette.hexToRgb(c2);
    return ColorPalette.rgbToHex(
      Math.round(rgb1.r * ratio + rgb2.r * (1 - ratio)),
      Math.round(rgb1.g * ratio + rgb2.g * (1 - ratio)),
      Math.round(rgb1.b * ratio + rgb2.b * (1 - ratio)),
    );
  }

  get primary(): string {
    return this.mainColor;
  }

  get primaryDark(): string {
    if (this.luminance < 0.4) return this.mix(this.mainColor, '#ffffff', 0.85);
    return this.adjustBrightness(this.mainColor, -0.2);
  }

  get primaryLight(): string {
    if (this.luminance < 0.4) return this.mix(this.mainColor, '#ffffff', 0.6);
    return this.adjustBrightness(this.mainColor, 0.2);
  }

  get primaryLightest(): string {
    return this.mix(this.mainColor, '#ffffff', 0.1);
  }

  get background(): string {
    return this.mix(this.mainColor, '#ffffff', 0.05);
  }

  rgba(alpha: number): string {
    const rgb = ColorPalette.hexToRgb(this.mainColor);
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
  }

  get isDark(): boolean {
    return this.luminance < 0.5;
  }
}

// --- Style Generation Helpers ---

function getFontVal(fontFamily?: string): string {
  return FONTS[fontFamily || 'default'] || FONTS.default;
}

function getLineHeight(fontSize: number): number {
  return LINE_HEIGHT_MAP[fontSize] ?? 1.75;
}

function headingFontSize(base: number, hs: HeadingSize = 'standard'): number {
  return Math.max(14, Math.round(base * (HEADING_SIZE_SCALE[hs] ?? 1)));
}

function headingSpacing(size: number, hs: HeadingSize = 'standard'): number {
  return Math.max(4, Math.round(size * (HEADING_SPACING_SCALE[hs] ?? 1)));
}

function headingLayout(mt: number, mb: number, hs: HeadingSize = 'standard'): string {
  return `margin-top: ${headingSpacing(mt, hs)}px !important; margin-bottom: ${headingSpacing(mb, hs)}px !important; line-height: 1.4em !important; word-break: break-all;`;
}

function containerStyle(ff?: string, fs = 16): string {
  const fv = getFontVal(ff);
  const lh = getLineHeight(fs);
  return `max-width: 720px; margin: 0 auto; padding: 8px; font-family: ${fv}; font-size: ${fs}px; line-height: ${lh} !important; word-wrap: break-word;`;
}

function pLayout(fs = 16, ps: ParagraphSpacing = 'normal'): string {
  const mb = PARAGRAPH_SPACING_MAP[ps] ?? 20;
  const lh = getLineHeight(fs);
  return `margin: 5px 0 ${mb}px !important; line-height: ${lh}em !important; text-align: start !important; font-size: ${fs}px; font-weight: 400; color: #2c2c2c !important; word-break: break-all;`;
}

const BQ_LAYOUT = 'margin: 4px 0; padding: 16px 8px 1px 8px !important;';
const LIST_LAYOUT = 'margin: 8px 0 !important;';

// --- Theme Generators ---

type ThemeGenerator = (
  p: ColorPalette,
  ff: string | undefined,
  fs: number,
  ps: ParagraphSpacing,
  hs: HeadingSize,
) => ThemeStyles;

function genSimple(p: ColorPalette, ff: string | undefined, fs: number, ps: ParagraphSpacing, hs: HeadingSize): ThemeStyles {
  const fv = getFontVal(ff);
  const font = `font-family: ${fv};`;
  const pl = pLayout(fs, ps);
  return {
    container: containerStyle(ff, fs),
    h1: `font-size: ${headingFontSize(28, hs)}px; font-weight: 800; color: ${p.primary} !important; ${headingLayout(44, 28, hs)} letter-spacing: -0.03em; ${font}`,
    h2: `font-size: ${headingFontSize(24, hs)}px; font-weight: 700; color: ${p.primary} !important; ${headingLayout(36, 24, hs)} letter-spacing: -0.02em; ${font}`,
    h3: `font-size: ${headingFontSize(20, hs)}px; font-weight: 700; color: ${p.primary} !important; ${headingLayout(28, 20, hs)} letter-spacing: -0.01em; ${font}`,
    h4: `font-size: ${headingFontSize(18, hs)}px; font-weight: 600; color: ${p.primary} !important; ${headingLayout(22, 18, hs)} ${font}`,
    h5: `font-size: ${headingFontSize(16, hs)}px; font-weight: 600; color: ${p.primary} !important; ${headingLayout(16, 10, hs)} ${font}`,
    h6: `font-size: ${headingFontSize(15, hs)}px; font-weight: 600; color: ${p.primary} !important; ${headingLayout(14, 12, hs)} ${font}`,
    p: `${pl} ${font}`,
    strong: `font-weight: 700; color: ${p.primary} !important; ${font}`,
    em: `font-style: italic; ${font}`,
    strike: `text-decoration: line-through; opacity: 0.65; ${font}`,
    u: `text-decoration: underline; text-decoration-color: ${p.primary}; text-underline-offset: 2px; ${font}`,
    a: `color: ${p.primary} !important; text-decoration: none; border-bottom: 1px solid ${p.primary}; ${font}`,
    ul: `${LIST_LAYOUT} padding-left: 20px; list-style-type: disc; color: ${p.primary}; ${font}`,
    ol: `${LIST_LAYOUT} padding-left: 20px; list-style-type: decimal; ${font}`,
    li: `margin: 8px 0; line-height: 1.6 !important; padding-left: 0; ${font}`,
    liText: `color: inherit; ${font}`,
    taskList: `${LIST_LAYOUT} padding-left: 20px; list-style: none; ${font}`,
    taskListItem: `margin: 4px 0; line-height: 1.7 !important; padding-left: 4px; list-style: none; ${font}`,
    taskListItemCheckbox: `margin-right: 10px; width: 18px; height: 18px; vertical-align: middle; cursor: pointer; accent-color: ${p.primary};`,
    blockquote: `${BQ_LAYOUT} border-left: 3px solid ${p.primary}; font-style: italic; opacity: 0.85; ${font}`,
    code: `font-family: "SF Mono", Consolas, Monaco, monospace; font-size: 14px; padding: 2px 4px; background-color: rgba(0, 0, 0, 0.05) !important; border-radius: 2px;`,
    pre: `margin: 28px 0; padding: 20px; background-color: rgba(0, 0, 0, 0.03) !important; border-radius: 0; overflow-x: auto; line-height: 1.6 !important; border: 1px solid rgba(0, 0, 0, 0.08);`,
    hr: `margin: 3rem 0; border: none; height: 1px; background-color: ${p.rgba(0.2)};`,
    img: `max-width: 100%; max-height: 600px !important; height: auto; display: block; margin: 32px auto;`,
    tableWrapper: `padding: 0 8px; margin: 12px 0; max-width: 100%; overflow: auto;`,
    table: `min-width: 100%; border-collapse: collapse; font-size: 16px; ${font}`,
    th: `padding: 12px 16px; text-align: left; border-bottom: 2px solid rgba(0, 0, 0, 0.15); font-weight: 700; word-break: keep-all; ${font}`,
    td: `padding: 12px 16px; border-bottom: 1px solid rgba(0, 0, 0, 0.08); word-break: keep-all; ${font}`,
    tr: '',
    codeBlockPre: `background: rgba(0, 0, 0, 0.03); padding: 0; border-radius: 0; overflow-x: auto; overflow-y: hidden; margin: 28px 0; border: 1px solid rgba(0, 0, 0, 0.08);`,
    codeBlockCode: `font-family: "SF Mono", Consolas, Monaco, monospace; font-size: 14px; line-height: 1.6; display: block; white-space: pre; padding: 20px;`,
  };
}

function genCenter(p: ColorPalette, ff: string | undefined, fs: number, ps: ParagraphSpacing, hs: HeadingSize): ThemeStyles {
  const fv = getFontVal(ff);
  const font = `font-family: ${fv};`;
  const pl = pLayout(fs, ps);
  return {
    container: containerStyle(ff, fs),
    h1: `font-size: ${headingFontSize(26, hs)}px; font-weight: 700; color: ${p.primary} !important; line-height: 1.4 !important; ${headingLayout(44, 28, hs)} text-align: center; padding: ${headingSpacing(16, hs)}px 0; background-image: linear-gradient(${p.rgba(0.35)}, ${p.rgba(0.35)}), linear-gradient(${p.rgba(0.35)}, ${p.rgba(0.35)}); background-size: 100% 1px, 100% 1px; background-position: center top, center bottom; background-repeat: no-repeat; ${font}`,
    h2: `font-size: ${headingFontSize(22, hs)}px; font-weight: 700; color: ${p.primary} !important; line-height: 1.35 !important; ${headingLayout(36, 24, hs)} text-align: center; padding: ${headingSpacing(12, hs)}px 0; background-image: linear-gradient(${p.rgba(0.3)}, ${p.rgba(0.3)}), linear-gradient(${p.rgba(0.3)}, ${p.rgba(0.3)}); background-size: 80% 1px, 80% 1px; background-position: center top, center bottom; background-repeat: no-repeat; ${font}`,
    h3: `font-size: ${headingFontSize(19, hs)}px; font-weight: 600; color: ${p.primary} !important; line-height: 1.4 !important; ${headingLayout(28, 20, hs)} text-align: center; padding: ${headingSpacing(10, hs)}px 0; background-image: linear-gradient(${p.rgba(0.25)}, ${p.rgba(0.25)}), linear-gradient(${p.rgba(0.25)}, ${p.rgba(0.25)}); background-size: 70% 1px, 70% 1px; background-position: center top, center bottom; background-repeat: no-repeat; ${font}`,
    h4: `font-size: ${headingFontSize(17, hs)}px; font-weight: 600; color: ${p.primary} !important; line-height: 1.4 !important; ${headingLayout(22, 18, hs)} text-align: center; padding: ${headingSpacing(8, hs)}px 0; background-image: linear-gradient(${p.rgba(0.2)}, ${p.rgba(0.2)}), linear-gradient(${p.rgba(0.2)}, ${p.rgba(0.2)}); background-size: 60% 1px, 60% 1px; background-position: center top, center bottom; background-repeat: no-repeat; ${font}`,
    h5: `font-size: ${headingFontSize(16, hs)}px; font-weight: 600; color: ${p.primary} !important; line-height: 1.4 !important; ${headingLayout(16, 10, hs)} text-align: center; padding: ${headingSpacing(6, hs)}px 0; background-image: linear-gradient(${p.rgba(0.18)}, ${p.rgba(0.18)}), linear-gradient(${p.rgba(0.18)}, ${p.rgba(0.18)}); background-size: 50% 1px, 50% 1px; background-position: center top, center bottom; background-repeat: no-repeat; ${font}`,
    h6: `font-size: ${headingFontSize(15, hs)}px; font-weight: 500; color: ${p.primary} !important; line-height: 1.4 !important; ${headingLayout(14, 12, hs)} text-align: center; padding: ${headingSpacing(6, hs)}px 0; background-image: linear-gradient(${p.rgba(0.15)}, ${p.rgba(0.15)}), linear-gradient(${p.rgba(0.15)}, ${p.rgba(0.15)}); background-size: 40% 1px, 40% 1px; background-position: center top, center bottom; background-repeat: no-repeat; ${font}`,
    p: `${pl} ${font}`,
    strong: `font-weight: 700; color: ${p.primary} !important; ${font}`,
    em: `font-style: italic; ${font}`,
    strike: `text-decoration: line-through; opacity: 0.6; ${font}`,
    u: `text-decoration: underline; text-decoration-color: ${p.primary}; text-underline-offset: 3px; ${font}`,
    a: `color: ${p.primary} !important; text-decoration: underline; text-underline-offset: 3px; ${font}`,
    ul: `padding-left: 24px; list-style-type: disc; color: ${p.primary}; ${LIST_LAYOUT} ${font}`,
    ol: `padding-left: 24px; list-style-type: decimal; ${LIST_LAYOUT} ${font}`,
    li: `margin: 8px 0; line-height: 1.7 !important; ${font}`,
    liText: `color: inherit; ${font}`,
    taskList: `padding-left: 8px; list-style: none; ${LIST_LAYOUT} ${font}`,
    taskListItem: `margin: 4px 0; line-height: 1.7 !important; list-style: none; ${font}`,
    taskListItemCheckbox: `margin-right: 10px; width: 16px; height: 16px; vertical-align: middle; cursor-pointer; accent-color: ${p.primary};`,
    blockquote: `${BQ_LAYOUT} border-left: 5px solid ${p.primary}; background-color: ${p.rgba(0.05)} !important; line-height: 1.7 !important; font-style: italic; ${font}`,
    code: `font-family: "SF Mono", Consolas, Monaco, monospace; font-size: 14px; padding: 2px 6px; background-color: ${p.rgba(0.1)} !important; color: ${p.primary} !important; border-radius: 4px;`,
    pre: `margin: 24px 0; padding: 16px; background-color: ${p.rgba(0.05)} !important; border-radius: 6px; overflow-x: auto; line-height: 1.6 !important; border: 1px solid ${p.rgba(0.15)};`,
    hr: `margin: 2rem auto; border: none; height: 3px; width: 60%; background-color: ${p.primary};`,
    img: `max-width: 100%; max-height: 600px !important; height: auto; display: block; margin: 24px auto; border-radius: 6px;`,
    tableWrapper: `padding: 0 8px; margin: 12px 0; max-width: 100%; overflow: auto;`,
    table: `min-width: 100%; border-collapse: collapse; font-size: 15px; ${font}`,
    th: `background-color: ${p.primary} !important; padding: 12px 16px; text-align: center; border: 1px solid ${p.rgba(0.2)}; font-weight: 600; color: #ffffff !important; word-break: keep-all; ${font}`,
    td: `padding: 12px 16px; border: 1px solid ${p.rgba(0.15)}; text-align: left; word-break: keep-all; ${font}`,
    tr: '',
    codeBlockPre: `background-color: #1e1e1e; padding: 0; border-radius: 6px; overflow-x: auto; overflow-y: hidden; margin: 24px 0;`,
    codeBlockCode: `color: #e8e8e8; font-family: "SF Mono", Consolas, Monaco, monospace; font-size: 14px; line-height: 1.6; display: block; white-space: pre; padding: 16px 20px;`,
  };
}

function genDecoration(p: ColorPalette, ff: string | undefined, fs: number, ps: ParagraphSpacing, hs: HeadingSize): ThemeStyles {
  const fv = getFontVal(ff);
  const font = `font-family: ${fv};`;
  const pl = pLayout(fs, ps);
  return {
    container: containerStyle(ff, fs),
    h1: `font-size: ${headingFontSize(26, hs)}px; font-weight: 700; color: ${p.primary} !important; ${headingLayout(44, 28, hs)} padding-left: ${headingSpacing(8, hs)}px; padding-bottom: ${headingSpacing(4, hs)}px; letter-spacing: 0.5px; border-left: 5px solid ${p.primary}; border-bottom: 1px solid ${p.primary}; ${font}`,
    h2: `font-size: ${headingFontSize(22, hs)}px; font-weight: 600; color: ${p.primary} !important; ${headingLayout(36, 24, hs)} padding-left: ${headingSpacing(10, hs)}px; border-left: 4px double ${p.primary}; ${font}`,
    h3: `font-size: ${headingFontSize(19, hs)}px; font-weight: 600; color: ${p.primary} !important; ${headingLayout(28, 20, hs)} padding-left: ${headingSpacing(10, hs)}px; border-left: 3px solid ${p.primary}; text-shadow: 0 1px 2px ${p.rgba(0.1)}; ${font}`,
    h4: `font-size: ${headingFontSize(18, hs)}px; font-weight: 600; color: ${p.primary} !important; ${headingLayout(22, 18, hs)} padding-left: ${headingSpacing(8, hs)}px; border-left: 2px dashed ${p.primary}; ${font}`,
    h5: `font-size: ${headingFontSize(17, hs)}px; font-weight: 600; color: ${p.primary} !important; ${headingLayout(16, 10, hs)} padding-left: ${headingSpacing(8, hs)}px; border-left: 2px solid ${p.primary}; ${font}`,
    h6: `font-size: ${headingFontSize(16, hs)}px; font-weight: 600; color: ${p.primary} !important; ${headingLayout(14, 12, hs)} padding-left: ${headingSpacing(8, hs)}px; border-left: 1px solid ${p.primary}; ${font}`,
    p: `${pl} ${font}`,
    strong: `font-weight: 600; color: ${p.primary} !important; ${font}`,
    em: `font-style: italic; color: #444444 !important; ${font}`,
    strike: `text-decoration: line-through; color: #888888 !important; ${font}`,
    u: `text-decoration: underline; text-decoration-color: ${p.rgba(0.35)}; text-underline-offset: 3px; ${font}`,
    a: `color: ${p.primary} !important; text-decoration: none; background-image: linear-gradient(${p.rgba(0.4)}, ${p.rgba(0.4)}); background-size: 100% 1px; background-position: 0 100%; background-repeat: no-repeat; padding-bottom: 1px; ${font}`,
    ul: `padding-left: 26px; list-style-type: disc; color: ${p.primary}; ${LIST_LAYOUT} ${font}`,
    ol: `padding-left: 26px; list-style-type: decimal; ${LIST_LAYOUT} ${font}`,
    li: `margin: 8px 0; line-height: 1.8 !important; ${font}`,
    liText: `color: #2c2c2c; ${font}`,
    taskList: `padding-left: 8px; list-style: none; ${LIST_LAYOUT} ${font}`,
    taskListItem: `margin: 4px 0; line-height: 1.8 !important; list-style: none; color: #2c2c2c !important; ${font}`,
    taskListItemCheckbox: `margin-right: 10px; width: 14px; height: 14px; vertical-align: middle; cursor: pointer; accent-color: ${p.primary};`,
    blockquote: `${BQ_LAYOUT} font-size: 15px; color: #555555 !important; background: linear-gradient(135deg, ${p.rgba(0.05)}, ${p.rgba(0.02)}); border-left: 3px solid ${p.primary}; border-radius: 0 8px 8px 0; line-height: 1.8 !important; ${font}`,
    code: `font-family: "SF Mono", Menlo, Consolas, monospace; font-size: 0.9em; padding: 2px 6px; background-color: ${p.rgba(0.06)} !important; color: ${p.rgba(0.85)} !important; border-radius: 4px;`,
    pre: `margin: 28px 0; padding: 18px; background-color: ${p.rgba(0.03)} !important; border-radius: 8px; overflow-x: auto; line-height: 1.6 !important; box-shadow: 0 2px 10px ${p.rgba(0.05)};`,
    hr: `margin: 2.5rem auto; border: none; height: 1px; width: 50%; background: linear-gradient(to right, transparent, ${p.rgba(0.3)}, ${p.rgba(0.3)}, transparent);`,
    img: `max-width: 100%; max-height: 600px !important; height: auto; display: block; margin: 28px auto; border-radius: 6px; border: 1px solid ${p.rgba(0.1)}; box-shadow: 0 2px 8px ${p.rgba(0.06)}, 0 8px 24px ${p.rgba(0.08)};`,
    tableWrapper: `padding: 0 8px; margin: 12px 0; max-width: 100%; overflow: auto;`,
    table: `min-width: 100%; border-collapse: collapse; font-size: 15px; box-shadow: 0 2px 6px ${p.rgba(0.04)}, 0 4px 12px ${p.rgba(0.03)}; ${font}`,
    th: `background: linear-gradient(180deg, ${p.rgba(0.15)} 0%, ${p.rgba(0.08)} 100%) !important; padding: 20px 28px; text-align: left; font-weight: 600; font-size: 15px; color: ${p.primary} !important; border: 1px solid ${p.rgba(0.2)}; border-top: 3px solid ${p.primary}; word-break: keep-all; ${font}`,
    td: `padding: 20px 28px; font-size: 15px; line-height: 1.75; background: #ffffff !important; color: #3a3a3a !important; border: 1px solid ${p.rgba(0.12)}; word-break: keep-all; ${font}`,
    tr: '',
    codeBlockPre: `background-color: #2d3748; padding: 0; border-radius: 8px; overflow-x: auto; overflow-y: hidden; margin: 28px 0; border: 1px solid ${p.rgba(0.15)}; box-shadow: 0 4px 16px ${p.rgba(0.1)};`,
    codeBlockCode: `color: #e2e8f0; font-family: "SF Mono", Menlo, Consolas, monospace; font-size: 14px; line-height: 1.7; display: block; white-space: pre; padding: 20px;`,
  };
}

function genProminent(p: ColorPalette, ff: string | undefined, fs: number, ps: ParagraphSpacing, hs: HeadingSize): ThemeStyles {
  const fv = getFontVal(ff);
  const font = `font-family: ${fv};`;
  const pl = pLayout(fs, ps);
  return {
    container: containerStyle(ff, fs),
    h1: `font-size: ${headingFontSize(26, hs)}px; font-weight: 700; color: #ffffff !important; ${headingLayout(44, 28, hs)} background-color: ${p.primary}; padding: ${headingSpacing(16, hs)}px ${headingSpacing(24, hs)}px; border-radius: 16px; box-shadow: 0 4px 12px ${p.rgba(0.25)}; ${font}`,
    h2: `font-size: ${headingFontSize(22, hs)}px; font-weight: 600; color: ${p.primary} !important; ${headingLayout(36, 24, hs)} padding-left: ${headingSpacing(12, hs)}px; border-left: 4px solid ${p.primary}; ${font}`,
    h3: `font-size: ${headingFontSize(19, hs)}px; font-weight: 600; color: ${p.primary} !important; ${headingLayout(28, 20, hs)} padding: ${headingSpacing(6, hs)}px ${headingSpacing(12, hs)}px; background-color: ${p.rgba(0.1)}; border-radius: 6px; border-left: 3px solid ${p.primary}; ${font}`,
    h4: `font-size: ${headingFontSize(18, hs)}px; font-weight: 600; color: ${p.primary} !important; ${headingLayout(22, 18, hs)} padding-left: ${headingSpacing(10, hs)}px; border-left: 3px solid ${p.primary}; ${font}`,
    h5: `font-size: ${headingFontSize(17, hs)}px; font-weight: 600; color: ${p.primary} !important; ${headingLayout(16, 10, hs)} padding-left: ${headingSpacing(8, hs)}px; border-left: 2px solid ${p.primary}; ${font}`,
    h6: `font-size: ${headingFontSize(16, hs)}px; font-weight: 600; color: ${p.primary} !important; ${headingLayout(14, 12, hs)} padding-left: ${headingSpacing(8, hs)}px; border-left: 2px dashed ${p.primary}; ${font}`,
    p: `${pl} ${font}`,
    strong: `font-weight: 600; color: ${p.primary} !important; ${font}`,
    em: `font-style: italic; color: #444444 !important; ${font}`,
    strike: `text-decoration: line-through; color: #888888 !important; ${font}`,
    u: `text-decoration: underline; text-decoration-color: ${p.rgba(0.35)}; text-underline-offset: 3px; ${font}`,
    a: `color: ${p.primary} !important; text-decoration: none; background-image: linear-gradient(${p.rgba(0.4)}, ${p.rgba(0.4)}); background-size: 100% 1px; background-position: 0 100%; background-repeat: no-repeat; padding-bottom: 1px; ${font}`,
    ul: `padding-left: 26px; list-style-type: disc; color: ${p.primary}; ${LIST_LAYOUT} ${font}`,
    ol: `padding-left: 26px; list-style-type: decimal; ${LIST_LAYOUT} ${font}`,
    li: `margin: 8px 0; line-height: 1.8 !important; ${font}`,
    liText: `color: #2c2c2c; ${font}`,
    taskList: `padding-left: 8px; list-style: none; ${LIST_LAYOUT} ${font}`,
    taskListItem: `margin: 4px 0; line-height: 1.8 !important; list-style: none; color: #2c2c2c !important; ${font}`,
    taskListItemCheckbox: `margin-right: 10px; width: 14px; height: 14px; vertical-align: middle; cursor: pointer; accent-color: ${p.primary};`,
    blockquote: `${BQ_LAYOUT} font-size: 15px; color: #555555 !important; background: linear-gradient(135deg, ${p.rgba(0.05)}, ${p.rgba(0.02)}); border-left: 3px solid ${p.primary}; border-radius: 0 8px 8px 0; line-height: 1.8 !important; ${font}`,
    code: `font-family: "SF Mono", Menlo, Consolas, monospace; font-size: 0.9em; padding: 2px 6px; background-color: ${p.rgba(0.06)} !important; color: ${p.rgba(0.85)} !important; border-radius: 4px;`,
    pre: `margin: 28px 0; padding: 18px; background-color: ${p.rgba(0.03)} !important; border-radius: 8px; overflow-x: auto; line-height: 1.6 !important; box-shadow: 0 2px 10px ${p.rgba(0.05)};`,
    hr: `margin: 2.5rem auto; border: none; height: 1px; width: 50%; background: linear-gradient(to right, transparent, ${p.rgba(0.3)}, ${p.rgba(0.3)}, transparent);`,
    img: `max-width: 100%; max-height: 600px !important; height: auto; display: block; margin: 28px auto; border-radius: 6px; border: 1px solid ${p.rgba(0.1)}; box-shadow: 0 2px 8px ${p.rgba(0.06)}, 0 8px 24px ${p.rgba(0.08)};`,
    tableWrapper: `padding: 0 8px; margin: 12px 0; max-width: 100%; overflow: auto;`,
    table: `min-width: 100%; border-collapse: collapse; font-size: 15px; box-shadow: 0 2px 6px ${p.rgba(0.04)}, 0 4px 12px ${p.rgba(0.03)}; ${font}`,
    th: `background: linear-gradient(180deg, ${p.rgba(0.15)} 0%, ${p.rgba(0.08)} 100%) !important; padding: 20px 28px; text-align: left; font-weight: 600; font-size: 15px; color: ${p.primary} !important; border: 1px solid ${p.rgba(0.2)}; border-top: 3px solid ${p.primary}; word-break: keep-all; ${font}`,
    td: `padding: 20px 28px; font-size: 15px; line-height: 1.75; background: #ffffff !important; color: #3a3a3a !important; border: 1px solid ${p.rgba(0.12)}; word-break: keep-all; ${font}`,
    tr: '',
    codeBlockPre: `background-color: #2d3748; padding: 0; border-radius: 8px; overflow-x: auto; overflow-y: hidden; margin: 28px 0; border: 1px solid ${p.rgba(0.15)}; box-shadow: 0 4px 16px ${p.rgba(0.1)};`,
    codeBlockCode: `color: #e2e8f0; font-family: "SF Mono", Menlo, Consolas, monospace; font-size: 14px; line-height: 1.7; display: block; white-space: pre; padding: 20px;`,
  };
}

// --- Theme Generator Registry ---

const THEME_GENERATORS: Record<ThemeKey, { fn: ThemeGenerator; enName: string; cnName: string }> = {
  simple: { fn: genSimple, enName: 'Minimal Modern', cnName: '极简现代' },
  center: { fn: genCenter, enName: 'Elegant Centered', cnName: '优雅对称' },
  decoration: { fn: genDecoration, enName: 'Refined Ornamental', cnName: '精致装饰' },
  prominent: { fn: genProminent, enName: 'Bold Prominent', cnName: '醒目风格' },
};

// --- Public API ---

export function generateTheme(options: ThemeOptions = {}): Theme {
  const {
    themeKey = 'simple',
    color = DEFAULT_COLOR,
    fontFamily = 'default',
    fontSize = 16,
    headingSize = 'standard',
    paragraphSpacing = 'normal',
  } = options;

  const key = (themeKey in THEME_GENERATORS ? themeKey : 'simple') as ThemeKey;
  const { fn, enName, cnName } = THEME_GENERATORS[key];
  const palette = new ColorPalette(color);
  const styles = fn(palette, fontFamily, fontSize, paragraphSpacing, headingSize);

  return {
    name: cnName,
    key,
    description: `${cnName} (${enName}) - color: ${color}`,
    color,
    styles,
  };
}

export function listThemes(): Array<{ key: ThemeKey; name: string; description: string }> {
  return Object.entries(THEME_GENERATORS).map(([key, { enName, cnName }]) => ({
    key: key as ThemeKey,
    name: cnName,
    description: enName,
  }));
}

export function listPresetColors(): Record<string, string> {
  return { ...PRESET_COLORS };
}
