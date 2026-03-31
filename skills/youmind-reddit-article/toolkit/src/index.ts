/**
 * YouMind Reddit Toolkit — Public API
 */

export { RedditConverter, previewHtml, type ConvertResult } from './converter.js';
export { publishPost, type PublishResult, type PublishOptions } from './publisher.js';
export {
  getAccessToken, submitSelfPost, submitLinkPost,
  getSubredditFlairs, getHotPosts, crossPost,
  loadRedditConfig,
  type RedditConfig, type SubmitResult, type Flair, type HotPost,
} from './reddit-api.js';

// Vendored core (copied per skill repo for standalone publishing)
export {
  search, webSearch, listBoards, getBoard,
  listMaterials, getMaterial, listCrafts, getCraft,
  saveArticle, mineTopics,
  type SearchOptions, type SearchResponse,
  type Board, type Material, type Craft,
  type MinedContent, type MineTopicsOptions,
} from './core/youmind-api.js';
