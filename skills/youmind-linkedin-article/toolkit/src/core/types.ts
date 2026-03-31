/**
 * Shared types for YouMind multi-platform content skills.
 */

export interface ContentResult {
  title: string;
  body: string;
  digest: string;
  images: string[];
  tags?: string[];
  language?: 'zh' | 'en' | 'auto';
}

export interface PlatformConfig {
  projectDir: string;
  platform: 'wechat' | 'reddit' | 'linkedin';
  youmind?: { api_key?: string; base_url?: string };
  image?: ImageConfig;
}

export interface ImageConfig {
  default_provider?: string;
  providers?: Record<string, ProviderConfig>;
}

export interface ProviderConfig {
  api_key?: string;
  model?: string;
  base_url?: string;
}

export interface ClientStyle {
  name: string;
  industry?: string;
  audience?: string;
  topics?: string[];
  blacklist?: string[];
  theme?: string;
  theme_color?: string;
  youmind_boards?: string[];
  language?: 'zh' | 'en' | 'auto';
}

export interface HistoryEntry {
  date: string;
  title: string;
  platform: string;
  topic_source?: string;
  keywords?: string[];
  knowledge_refs?: string[];
  framework?: string;
  word_count?: number;
  media_id?: string;
  post_id?: string;
  post_url?: string;
  theme?: string;
  stats?: Record<string, unknown> | null;
}
