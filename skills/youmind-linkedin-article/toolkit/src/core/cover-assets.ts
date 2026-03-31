/**
 * Remote cover image assets hosted on marketing-assets.youmind.com.
 */

const COVER_BASE_URL = 'https://marketing-assets.youmind.com/wechat-skill';

export interface CoverMeta {
  url: string;
  hue: string;
  tone: string;
  mood: string;
}

export const COVER_PALETTE: Record<string, CoverMeta> = {
  'blue-clouds-oil': {
    url: `${COVER_BASE_URL}/blue-clouds-oil.jpg`,
    hue: 'blue', tone: 'warm', mood: 'artistic',
  },
  'blue-light-wave': {
    url: `${COVER_BASE_URL}/blue-light-wave.jpg`,
    hue: 'blue', tone: 'cool', mood: 'tech',
  },
  'city-skyline-painting': {
    url: `${COVER_BASE_URL}/city-skyline-painting.jpg`,
    hue: 'warm', tone: 'warm', mood: 'atmospheric',
  },
  'cyan-gradient': {
    url: `${COVER_BASE_URL}/cyan-gradient.jpg`,
    hue: 'cyan', tone: 'cool', mood: 'clean',
  },
  'green-gradient': {
    url: `${COVER_BASE_URL}/green-gradient.jpg`,
    hue: 'green', tone: 'cool', mood: 'fresh',
  },
  'lavender-silk': {
    url: `${COVER_BASE_URL}/lavender-silk.jpg`,
    hue: 'purple', tone: 'cool', mood: 'elegant',
  },
  'orange-warm': {
    url: `${COVER_BASE_URL}/orange-warm.jpg`,
    hue: 'orange', tone: 'warm', mood: 'energetic',
  },
  'pink-blue-diagonal': {
    url: `${COVER_BASE_URL}/pink-blue-diagonal.jpg`,
    hue: 'pink', tone: 'cool', mood: 'modern',
  },
  'purple-teal-diagonal': {
    url: `${COVER_BASE_URL}/purple-teal-diagonal.jpg`,
    hue: 'purple', tone: 'cool', mood: 'tech',
  },
  'sunset-watercolor': {
    url: `${COVER_BASE_URL}/sunset-watercolor.jpg`,
    hue: 'orange', tone: 'warm', mood: 'artistic',
  },
  'warm-colorful-blur': {
    url: `${COVER_BASE_URL}/warm-colorful-blur.jpg`,
    hue: 'warm', tone: 'warm', mood: 'energetic',
  },
};

export const COLOR_HUE_MAP: Record<string, string> = {
  '#3498db': 'blue', '#2980b9': 'blue', '#1abc9c': 'cyan',
  '#e74c3c': 'warm', '#c0392b': 'warm', '#e91e63': 'pink',
  '#2ecc71': 'green', '#27ae60': 'green',
  '#9b59b6': 'purple', '#8e44ad': 'purple',
  '#f39c12': 'orange', '#f1c40f': 'orange',
  '#34495e': 'blue', '#2c3e50': 'blue',
};
