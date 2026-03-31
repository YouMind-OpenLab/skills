/**
 * YouMind Content Core — shared toolkit for multi-platform article skills.
 */

// Shared types
export type {
  ContentResult, PlatformConfig, ImageConfig, ProviderConfig,
  ClientStyle, HistoryEntry,
} from './types.js';

// Image generation
export {
  generateGemini, generateOpenAI, generateDoubao,
  searchNanoBanana, selectFallbackCover, downloadFallbackCover, resolveProvider,
  GENERATORS, SIZE_MAP,
  COVER_PALETTE, COLOR_HUE_MAP,
} from './image-gen.js';
export type { CoverMeta } from './cover-assets.js';

// YouMind API
export {
  search, webSearch, listBoards, getBoard,
  listMaterials, getMaterial, listCrafts, getCraft,
  saveArticle, mineTopics, chatGenerateImage,
  loadYouMindConfig,
} from './youmind-api.js';
export type {
  YouMindConfig,
  SearchOptions, SearchResponse, SearchResult,
  WebSearchOptions, WebSearchResponse, WebSearchResult,
  Board, Material, Craft, SavedDocument,
  MinedContent, MineTopicsOptions, ChatImageResult,
} from './youmind-api.js';

// Content processors
export { latexToSvg, convertMathToHtml, processMathInHtml } from './math-processor.js';
export { renderMermaidToPng, processMermaidBlocks, isMermaidAvailable } from './mermaid-processor.js';
export { enhanceCodeBlocks } from './code-block-processor.js';

// Edit learning
export { analyzeDiff } from './learn-edits.js';
export type { DiffAnalysis } from './learn-edits.js';
