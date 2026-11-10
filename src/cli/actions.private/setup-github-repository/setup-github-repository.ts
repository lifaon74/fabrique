import { randomUUID } from 'node:crypto';
import { rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execCommand } from '../../../helpers.private/cmd/exec-command.ts';
import { buildBranchRulesetPayload } from '../../../helpers.private/github/github-ruleset/build-branch-ruleset-payload/build-branch-ruleset-payload.ts';
import { buildTagRulesetPayload } from '../../../helpers.private/github/github-ruleset/build-tag-ruleset-payload/build-tag-ruleset-payload.ts';
import {
  type GithubRulesetPayload,
  type GithubRulesetSummary,
} from '../../../helpers.private/github/github-ruleset/github-ruleset.ts';
import type { Logger } from '../../../helpers.private/log/logger.ts';

const PROTECTED_BRANCHES: readonly string[] = ['main', 'develop'];
const RELEASE_TAG_PATTERN: string = 'v*';
const DEFAULT_REQUIRED_CHECKS: readonly string[] = ['Check'];

export interface SetupGithubRepositoryOptions {
  readonly dry?: boolean;
  readonly cwd?: string;
  readonly requiredChecks?: readonly string[];
  readonly approvals?: number;
  readonly logger: Logger;
}

/**
 * Configures the basic rules of the GitHub repository of the current project, using the GitHub CLI:
 * - repository settings: merge commits only, head branches deleted on merge
 * - a ruleset protecting the release branches: no push, force-push or deletion, required CI checks
 * - a ruleset protecting the release tags: no deletion, no force-push
 */
export function setupGithubRepository({
  dry = false,
  cwd = process.cwd(),
  requiredChecks = DEFAULT_REQUIRED_CHECKS,
  approvals = 0,
  logger,
}: SetupGithubRepositoryOptions): Promise<void> {
  return logger.asyncTask('setup-github-repository', async (logger: Logger): Promise<void> => {
    verifyApprovals(approvals);
    verifyRequiredChecks(requiredChecks);

    const repository: GithubRepository = await readGithubRepository({ cwd, logger });

    if (repository.visibility !== 'PUBLIC') {
      logger.warn(
        `Rulesets are a paid feature on ${repository.visibility.toLowerCase()} repositories: some rules may not be applied.`,
      );
    }

    await updateRepositorySettings({ repository, dry, cwd, logger });
    await upsertRuleset({
      repository,
      dry,
      cwd,
      logger,
      payload: buildBranchRulesetPayload({
        branches: PROTECTED_BRANCHES,
        requiredChecks,
        approvals,
      }),
    });
    await upsertRuleset({
      repository,
      dry,
      cwd,
      logger,
      payload: buildTagRulesetPayload({ pattern: RELEASE_TAG_PATTERN }),
    });
  });
}

/*----------*/

interface GithubRepository {
  readonly nameWithOwner: string;
  /** Values returned by `gh repo view --json`: ADMIN, MAINTAIN, WRITE, READ or NONE */
  readonly viewerPermission: 'ADMIN' | 'MAINTAIN' | 'WRITE' | 'READ' | 'NONE';
  /** Values returned by `gh repo view --json`: PUBLIC, PRIVATE or INTERNAL */
  readonly visibility: 'PUBLIC' | 'PRIVATE' | 'INTERNAL';
}

function verifyApprovals(approvals: number): void {
  if (!Number.isInteger(approvals) || approvals < 0) {
    throw new Error(`"approvals" must be a positive integer (got ${approvals}).`);
  }
}

function verifyRequiredChecks(requiredChecks: readonly string[]): void {
  if (requiredChecks.length === 0) {
    throw new Error(`"requiredChecks" must contain at least one check name.`);
  }
}

interface ReadGithubRepositoryOptions {
  readonly cwd: string;
  readonly logger: Logger;
}

async function readGithubRepository({
  cwd,
  logger,
}: ReadGithubRepositoryOptions): Promise<GithubRepository> {
  const output: string = await execCommand(
    logger,
    'gh',
    ['repo', 'view', '--json', 'nameWithOwner,viewerPermission,visibility'],
    { cwd },
  );

  const repository: GithubRepository = JSON.parse(output);

  if (repository.viewerPermission !== 'ADMIN') {
    throw new Error(
      `Administrator permission required on ${repository.nameWithOwner} (got "${repository.viewerPermission}").`,
    );
  }

  return repository;
}

interface UpdateRepositorySettingsOptions {
  readonly repository: GithubRepository;
  readonly dry: boolean;
  readonly cwd: string;
  readonly logger: Logger;
}

async function updateRepositorySettings({
  repository,
  dry,
  cwd,
  logger,
}: UpdateRepositorySettingsOptions): Promise<void> {
  const args: string[] = [
    'repo',
    'edit',
    repository.nameWithOwner,
    '--delete-branch-on-merge=true',
    '--enable-merge-commit=true',
    '--enable-rebase-merge=false',
    '--enable-squash-merge=false',
  ];

  if (dry) {
    logger.debug(`(dry) gh ${args.join(' ')}`);
  } else {
    await execCommand(logger, 'gh', args, { cwd });
  }
}

interface UpsertRulesetOptions {
  readonly repository: GithubRepository;
  readonly dry: boolean;
  readonly cwd: string;
  readonly logger: Logger;
  readonly payload: GithubRulesetPayload;
}

async function upsertRuleset({
  repository,
  dry,
  cwd,
  logger,
  payload,
}: UpsertRulesetOptions): Promise<void> {
  const rulesets: readonly GithubRulesetSummary[] = await listRulesets({ repository, cwd, logger });

  const existing: GithubRulesetSummary | undefined = rulesets.find(
    (ruleset: GithubRulesetSummary): boolean => ruleset.name === payload.name,
  );

  const method: 'POST' | 'PUT' = existing === undefined ? 'POST' : 'PUT';
  const url: string =
    existing === undefined
      ? `repos/${repository.nameWithOwner}/rulesets`
      : `repos/${repository.nameWithOwner}/rulesets/${existing.id}`;

  if (dry) {
    logger.debug(`(dry) gh api --method ${method} ${url} --input <${payload.name} payload>`);
    return;
  }

  const payloadFile: string = await writePayloadFile(payload);

  try {
    await execCommand(logger, 'gh', ['api', '--method', method, url, '--input', payloadFile], {
      cwd,
    });
  } finally {
    await rm(payloadFile, { force: true });
  }
}

interface ListRulesetsOptions {
  readonly repository: GithubRepository;
  readonly cwd: string;
  readonly logger: Logger;
}

async function listRulesets({
  repository,
  cwd,
  logger,
}: ListRulesetsOptions): Promise<readonly GithubRulesetSummary[]> {
  const output: string = await execCommand(
    logger,
    'gh',
    ['api', `repos/${repository.nameWithOwner}/rulesets?per_page=100`],
    { cwd },
  );

  return JSON.parse(output);
}

async function writePayloadFile(payload: GithubRulesetPayload): Promise<string> {
  const payloadFile: string = join(tmpdir(), `fabrique-github-ruleset-${randomUUID()}.json`);

  await writeFile(payloadFile, JSON.stringify(payload, null, 2));

  return payloadFile;
}
