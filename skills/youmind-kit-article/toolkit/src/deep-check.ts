import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { adaptForKit } from './content-adapter.js';
import {
  deleteBroadcast,
  getBroadcast,
  listEmailTemplates,
  loadKitConfig,
  validateConnection,
} from './kit-api.js';

type JsonObject = Record<string, unknown>;

interface DeepCheckReport {
  config: {
    baseUrl: string;
  };
  directOpenApi: JsonObject;
  genericPublisher: JsonObject;
  cli: JsonObject;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TOOLKIT_DIR = resolve(__dirname, '..');
const DIST_CLI = resolve(TOOLKIT_DIR, 'dist/cli.js');
const KIT_CAMPAIGNS_URL = 'https://app.kit.com/campaigns';

function requireNumber(value: unknown, label: string): number {
  const parsed = Number(value);
  assert.ok(Number.isFinite(parsed) && parsed > 0, `${label} must be a positive number`);
  return parsed;
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function postOpenApi(
  endpoint: string,
  body: JsonObject,
  apiKey: string,
  baseUrl: string,
): Promise<unknown> {
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'x-use-camel-case': 'true',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(20_000),
      });

      const text = await response.text();
      const parsed = parseJson(text);
      if (!response.ok) {
        throw new Error(`${endpoint} failed (${response.status}): ${text}`);
      }
      return parsed;
    } catch (error) {
      if (attempt === 5) {
        throw error;
      }
      await new Promise((resolveDelay) => setTimeout(resolveDelay, attempt * 500));
    }
  }

  throw new Error(`${endpoint} failed after retries`);
}

function runCli(args: string[]): string {
  const result = spawnSync(process.execPath, [DIST_CLI, ...args], {
    cwd: TOOLKIT_DIR,
    encoding: 'utf-8',
  });

  if (result.status !== 0) {
    const stderr = result.stderr?.trim();
    const stdout = result.stdout?.trim();
    throw new Error(
      `CLI ${args.join(' ')} failed (${result.status}): ${stderr || stdout || 'no output'}`,
    );
  }

  return result.stdout.trim();
}

async function runDirectOpenApiChecks(
  apiKey: string,
  baseUrl: string,
  cleanupIds: number[],
): Promise<JsonObject> {
  const report: JsonObject = {};

  const validate = (await postOpenApi('/kit/validateConnection', {}, apiKey, baseUrl)) as JsonObject;
  assert.equal(validate.ok, true, 'validateConnection should return ok=true');
  assert.equal(typeof validate.accountId, 'string', 'validateConnection should return accountId');
  report.validateConnection = validate;

  const templates = (await postOpenApi(
    '/kit/listEmailTemplates',
    { perPage: 10, includeTotalCount: true },
    apiKey,
    baseUrl,
  )) as JsonObject;
  const emailTemplates = Array.isArray(templates.emailTemplates)
    ? (templates.emailTemplates as JsonObject[])
    : [];
  assert.ok(emailTemplates.length > 0, 'listEmailTemplates should return at least one template');
  const template = emailTemplates[0];
  const templateId = requireNumber(template.id, 'template id');
  const senderEmail = String(validate.primaryEmailAddress ?? '');
  assert.ok(senderEmail.length > 0, 'validateConnection should return primaryEmailAddress');
  report.listEmailTemplates = {
    firstTemplate: template,
    pagination: templates.pagination,
  };

  const created = (await postOpenApi(
    '/kit/createBroadcast',
    {
      subject: 'YouMind Kit deep-check create',
      content: '<p>direct create path</p>',
      description: 'direct create path',
      previewText: 'direct create preview',
      public: false,
      sendAt: null,
      emailAddress: senderEmail,
      emailTemplateId: templateId,
    },
    apiKey,
    baseUrl,
  )) as JsonObject;
  const createdId = requireNumber(created.id, 'created broadcast id');
  cleanupIds.push(createdId);
  assert.equal(created.isPublic, false, 'legacy public=false alias should create a private broadcast');
  assert.equal(created.publicUrl, null, 'private create should not expose a fake publicUrl');
  report.createBroadcast = created;

  const fetched = (await postOpenApi(
    '/kit/getBroadcast',
    { id: createdId },
    apiKey,
    baseUrl,
  )) as JsonObject;
  assert.equal(fetched.id, createdId, 'getBroadcast should return the created broadcast');
  assert.equal(fetched.publicUrl, null, 'private get should not expose a fake publicUrl');
  report.getBroadcast = fetched;

  const updated = (await postOpenApi(
    '/kit/updateBroadcast',
    {
      id: createdId,
      subject: 'YouMind Kit deep-check updated',
      content: '<p>direct update path</p>',
      description: 'direct update path',
      previewText: 'direct update preview',
      isPublic: false,
      sendAt: null,
      emailAddress: senderEmail,
      emailTemplateId: templateId,
      subscriberFilter: fetched.subscriberFilter,
    },
    apiKey,
    baseUrl,
  )) as JsonObject;
  assert.equal(updated.id, createdId, 'updateBroadcast should update the created broadcast');
  assert.equal(updated.subject, 'YouMind Kit deep-check updated');
  report.updateBroadcast = updated;

  const listed = (await postOpenApi(
    '/kit/listBroadcasts',
    { perPage: 10, includeTotalCount: true },
    apiKey,
    baseUrl,
  )) as JsonObject;
  const listedBroadcasts = Array.isArray(listed.broadcasts) ? (listed.broadcasts as JsonObject[]) : [];
  assert.ok(
    listedBroadcasts.some((item) => Number(item.id) === createdId),
    'listBroadcasts should include the created broadcast',
  );
  report.listBroadcasts = {
    count: listedBroadcasts.length,
    firstIds: listedBroadcasts.slice(0, 5).map((item) => item.id),
    pagination: listed.pagination,
  };

  return report;
}

async function runGenericPublisherChecks(
  apiKey: string,
  baseUrl: string,
  cleanupIds: number[],
): Promise<JsonObject> {
  const report: JsonObject = {};
  const markdown = '# YouMind Kit Generic Publish\n\nThis post is created via createTokenPlatformPost.';
  const adapted = await adaptForKit({ markdown });

  const created = (await postOpenApi(
    '/createTokenPlatformPost',
    {
      platform: 'kit',
      title: adapted.subject,
      content: adapted.html,
    },
    apiKey,
    baseUrl,
  )) as JsonObject;

  const createdId = requireNumber(created.postId, 'generic publish postId');
  cleanupIds.push(createdId);
  assert.equal(typeof created.url, 'string', 'generic publish should return a completion URL');
  assert.equal(typeof created.message, 'string', 'generic publish should return a completion note');
  report.createTokenPlatformPost = created;

  const fetched = await getBroadcast(loadKitConfig(), createdId);
  assert.equal(fetched.id, createdId, 'generic publish should create a retrievable Kit broadcast');
  assert.equal(fetched.subject, adapted.subject, 'generic publish should preserve the title');
  assert.equal(fetched.isPublic, true, 'generic publish should create a public Kit broadcast');
  report.followupGetBroadcast = {
    id: fetched.id,
    subject: fetched.subject,
    isPublic: fetched.isPublic,
    publicUrl: fetched.publicUrl ?? null,
  };

  const completionUrl = String(created.url ?? '');
  const completionMessage = String(created.message ?? '');
  if (fetched.publicUrl) {
    assert.equal(
      completionUrl,
      fetched.publicUrl,
      'generic publish should prefer the real Kit publicUrl when available',
    );
  } else {
    assert.equal(
      completionUrl,
      KIT_CAMPAIGNS_URL,
      'generic publish should fall back to the Kit campaigns dashboard when no publicUrl is available',
    );
    assert.match(
      completionMessage,
      /https:\/\/app\.kit\.com\/campaigns/,
      'generic publish note should point to the Kit campaigns dashboard when no publicUrl is available',
    );
  }

  return report;
}

function runCliChecks(
  tempDir: string,
  emailTemplateId: number,
  senderEmail: string,
  cleanupIds: number[],
): JsonObject {
  const markdownPath = join(tempDir, 'cli-article.md');
  const previewPath = join(tempDir, 'cli-preview.html');
  writeFileSync(
    markdownPath,
    '# YouMind Kit CLI Deep Check\n\nPrivate CLI publish after preview generation.',
    'utf-8',
  );

  const validateOutput = runCli(['validate']);
  assert.match(validateOutput, /^OK:/m, 'CLI validate should print OK');

  const templatesOutput = runCli(['templates', '--per-page', '10']);
  assert.match(templatesOutput, /Template ID:/, 'CLI templates should print template metadata');

  const previewOutput = runCli(['preview', markdownPath, '--output', previewPath]);
  assert.match(previewOutput, /Preview generated:/, 'CLI preview should report the output path');
  const previewHtml = readFileSync(previewPath, 'utf-8');
  assert.match(previewHtml, /Kit Preview/, 'preview HTML should contain the Kit shell');
  assert.match(previewHtml, /YouMind Kit CLI Deep Check/, 'preview HTML should contain the subject');

  const publishOutput = runCli([
    'publish',
    markdownPath,
    '--private',
    '--email-address',
    senderEmail,
    '--email-template-id',
    String(emailTemplateId),
  ]);
  const publishIdMatch = publishOutput.match(/Broadcast ID:\s+(\d+)/);
  assert.ok(publishIdMatch, 'CLI publish should print the broadcast ID');
  const publishId = requireNumber(publishIdMatch?.[1], 'CLI broadcast id');
  cleanupIds.push(publishId);
  assert.match(publishOutput, /Public:\s+no/, 'CLI publish should confirm private mode');

  const getOutput = runCli(['get', String(publishId)]);
  assert.match(getOutput, new RegExp(`Broadcast ID: ${publishId}`), 'CLI get should return the broadcast');

  const listOutput = runCli(['list', '--per-page', '10']);
  assert.match(listOutput, new RegExp(`Broadcast ID: ${publishId}`), 'CLI list should include the new broadcast');

  const deleteOutput = runCli(['delete', String(publishId)]);
  assert.match(deleteOutput, new RegExp(`Deleted: ${publishId}`), 'CLI delete should confirm cleanup');

  return {
    validate: validateOutput,
    templates: templatesOutput,
    preview: previewOutput,
    publish: publishOutput,
    get: getOutput,
    list: listOutput,
    delete: deleteOutput,
  };
}

async function cleanupBroadcasts(config: ReturnType<typeof loadKitConfig>, ids: number[]): Promise<void> {
  for (const id of [...new Set(ids)]) {
    try {
      await deleteBroadcast(config, id);
    } catch {
      // Ignore cleanup failures.
    }
  }
}

async function main(): Promise<void> {
  const config = loadKitConfig();
  assert.ok(config.apiKey, 'YouMind API key is required in ~/.youmind/config.yaml');
  assert.ok(config.baseUrl, 'YouMind OpenAPI baseUrl is required');

  const report: DeepCheckReport = {
    config: { baseUrl: config.baseUrl },
    directOpenApi: {},
    genericPublisher: {},
    cli: {},
  };

  const tempDir = mkdtempSync(join(tmpdir(), 'youmind-kit-deep-check-'));
  const cleanupIds: number[] = [];

  try {
    report.directOpenApi = await runDirectOpenApiChecks(config.apiKey, config.baseUrl, cleanupIds);

    const templates = await listEmailTemplates(config, { perPage: 10, includeTotalCount: true });
    const template = templates.emailTemplates[0];
    assert.ok(template, 'At least one template is required for CLI checks');

    const connection = await validateConnection(config);
    assert.ok(connection.primaryEmailAddress, 'primaryEmailAddress is required for CLI checks');

    report.genericPublisher = await runGenericPublisherChecks(
      config.apiKey,
      config.baseUrl,
      cleanupIds,
    );

    report.cli = runCliChecks(
      tempDir,
      requireNumber(template.id, 'CLI template id'),
      connection.primaryEmailAddress,
      cleanupIds,
    );

    console.log(JSON.stringify(report, null, 2));
  } finally {
    await cleanupBroadcasts(config, cleanupIds);
    rmSync(tempDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exit(1);
});
