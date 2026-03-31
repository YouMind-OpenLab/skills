/**
 * YouMind LinkedIn Toolkit — Public API
 */

export {
  LinkedInConverter, previewHtml,
  type PostConvertResult, type ArticleConvertResult,
} from './converter.js';
export {
  publishLinkedInPost, publishLinkedInArticle, recommendContentType,
  type PublishPostOptions, type PublishPostResult,
  type PublishArticleOptions, type PublishArticleResult,
} from './publisher.js';
export {
  getProfile, createTextPost, createImagePost, createArticle,
  uploadImage, loadLinkedInConfig,
  type LinkedInConfig, type PostResult, type ArticleResult,
  type Profile, type ImageUploadResult,
} from './linkedin-api.js';

// Re-export shared utilities from content-core
export {
  search, webSearch, listBoards, getBoard,
  listMaterials, getMaterial, listCrafts, getCraft,
  saveArticle, mineTopics,
  type SearchOptions, type SearchResponse,
  type Board, type Material, type Craft,
  type MinedContent, type MineTopicsOptions,
} from 'youmind-content-core';
