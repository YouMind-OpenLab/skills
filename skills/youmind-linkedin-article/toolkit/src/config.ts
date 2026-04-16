import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SKILL_CONFIG_NAME = 'youmind-linkedin-article';

export const DEFAULT_YOUMIND_OPENAPI_BASE_URL = 'https://youmind.com/openapi/v1';
export const YOUMIND_CONFIG_ERROR_HINT =
  `Set youmind.api_key in ~/.youmind/config.yaml. Optional skill overrides live in ~/.youmind/config/${SKILL_CONFIG_NAME}.yaml.`;

function getHomeDir(): string {
  return process.env.HOME || process.env.USERPROFILE || '';
}

function loadYamlFile(path: string): Record<string, unknown> {
  if (!path || !existsSync(path)) {
    return {};
  }
  return (parseYaml(readFileSync(path, 'utf-8')) ?? {}) as Record<string, unknown>;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasConfiguredValue(value: unknown): boolean {
  if (value === undefined || value === null) {
    return false;
  }
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  return true;
}

function mergeWithFallback(
  primary: Record<string, unknown>,
  fallback: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...primary };

  for (const [key, fallbackValue] of Object.entries(fallback)) {
    const currentValue = result[key];

    if (isPlainObject(currentValue) && isPlainObject(fallbackValue)) {
      result[key] = mergeWithFallback(currentValue, fallbackValue);
      continue;
    }

    if (!hasConfiguredValue(currentValue) && hasConfiguredValue(fallbackValue)) {
      result[key] = fallbackValue;
    }
  }

  return result;
}

function loadSharedConfig(): Record<string, unknown> {
  const home = getHomeDir();
  if (!home) {
    return {};
  }
  return loadYamlFile(resolve(home, '.youmind', 'config.yaml'));
}

function loadSkillOverrideConfig(): Record<string, unknown> {
  const home = getHomeDir();
  if (!home) {
    return {};
  }
  return loadYamlFile(resolve(home, '.youmind', 'config', `${SKILL_CONFIG_NAME}.yaml`));
}

export function loadLayeredConfig(): Record<string, unknown> {
  return mergeWithFallback(loadSkillOverrideConfig(), loadSharedConfig());
}

export function normalizeBaseUrl(value: string | undefined): string {
  if (!value) return '';
  const trimmed = value.replace(/\/+$/, '');
  if (trimmed.endsWith('/openapi/v1')) return trimmed;
  if (trimmed.endsWith('/openapi')) return `${trimmed}/v1`;
  return `${trimmed}/openapi/v1`;
}

function getImageYouMindConfig(raw: Record<string, unknown>): Record<string, unknown> {
  const image = raw.image;
  if (!isPlainObject(image)) {
    return {};
  }
  const providers = image.providers;
  if (!isPlainObject(providers)) {
    return {};
  }
  const youmind = providers.youmind;
  return isPlainObject(youmind) ? youmind : {};
}

export function loadYouMindConfig(): {
  apiKey: string;
  baseUrl: string;
  raw: Record<string, unknown>;
} {
  const raw = loadLayeredConfig();
  const youmind = isPlainObject(raw.youmind) ? raw.youmind : {};
  const imageYouMind = getImageYouMindConfig(raw);
  const apiKey =
    (typeof youmind.api_key === 'string' && youmind.api_key) ||
    (typeof imageYouMind.api_key === 'string' && imageYouMind.api_key) ||
    '';
  const configuredBaseUrl =
    typeof youmind.base_url === 'string' ? normalizeBaseUrl(youmind.base_url) : '';

  return {
    raw,
    apiKey,
    baseUrl: configuredBaseUrl || DEFAULT_YOUMIND_OPENAPI_BASE_URL,
  };
}
