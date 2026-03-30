/**
 * YouMind WeChat Toolkit - Public API
 */

export { WeChatConverter, previewHtml, type ConvertResult, type ConverterOptions } from './converter.js';
export {
  generateTheme,
  listThemes,
  listPresetColors,
  ColorPalette,
  PRESET_COLORS,
  PRESET_COLOR_LIST,
  DEFAULT_COLOR,
  DEFAULT_THEME,
  type Theme,
  type ThemeKey,
  type ThemeStyles,
  type ThemeOptions,
  type HeadingSize,
  type ParagraphSpacing,
  type FontFamily,
} from './theme-engine.js';
export { createDraft, type DraftResult, type CreateDraftOptions } from './publisher.js';
export { getAccessToken, uploadImage, uploadThumb } from './wechat-api.js';
export {
  generateGemini, generateOpenAI, generateDoubao,
  searchNanoBanana, selectFallbackCover, resolveProvider,
  GENERATORS, SIZE_MAP,
} from './image-gen.js';
export { analyzeDiff, type DiffAnalysis } from './learn-edits.js';
export {
  search, webSearch, listBoards, getBoard,
  listMaterials, getMaterial, listCrafts, getCraft,
  saveArticle, mineTopics,
  type SearchOptions, type SearchResponse, type SearchResult,
  type WebSearchOptions, type WebSearchResponse, type WebSearchResult,
  type Board, type Material, type Craft, type SavedDocument,
  type MinedContent, type MineTopicsOptions,
} from './youmind-api.js';
export { latexToSvg, convertMathToHtml, processMathInHtml } from './math-processor.js';
export { renderMermaidToPng, processMermaidBlocks, isMermaidAvailable } from './mermaid-processor.js';
export { enhanceCodeBlocks } from './code-block-processor.js';
