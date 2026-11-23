import { randomUUID } from 'node:crypto';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execCommand } from '../../../helpers.private/cmd/exec-command.ts';
import { createDeployKey } from '../../../helpers.private/github/deploy-key/create-deploy-key/create-deploy-key.ts';
import { deleteDeployKey } from '../../../helpers.private/github/deploy-key/delete-deploy-key/delete-deploy-key.ts';
import { findDeployKeysByTitle } from '../../../helpers.private/github/deploy-key/find-deploy-keys-by-title/find-deploy-keys-by-title.ts';
import { generateKeyPair } from '../../../helpers.private/github/deploy-key/generate-key-pair/generate-key-pair.ts';
import { buildBranchRulesetPayload } from '../../../helpers.private/github/github-ruleset/build-branch-ruleset-payload/build-branch-ruleset-payload.ts';
import { buildTagRulesetPayload } from '../../../helpers.private/github/github-ruleset/build-tag-ruleset-payload/build-tag-ruleset-payload.ts';
import {
  type GithubRulesetPayload,
  type GithubRulesetSummary,
} from '../../../helpers.private/github/github-ruleset/github-ruleset.ts';
import { setActionsSecret } from '../../../helpers.private/github/set-actions-secret/set-actions-secret.ts';
import type { Logger } from '../../../helpers.private/log/logger.ts';

const PROTECTED_BRANCHES: readonly string[] = ['main', 'develop'];
const RELEASE_TAG_PATTERN: string = 'v*';
const DEFAULT_REQUIRED_CHECKS: readonly string[] = ['Check'];
const DEPLOY_KEY_TITLE: string = 'fabrique-release';
const DEPLOY_KEY_NAME: string = 'id_ed25519';
const RELEASE_DEPLOY_KEY_SECRET: string = 'RELEASE_DEPLOY_KEY';

export interface SetupGithubRepositoryOptions {
  readonly dry?: boolean;
  readonly cwd?: string;
  readonly requiredChecks?: readonly string[];
  readonly approvals?: number;
  readonly logger: Logger;
}

/**
 * Configures the basic rules of the GitHub repository of the current project, using the GitHub CLI:
 * - repository settings: merge commits only, auto-merge, head branches deleted on merge
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

    const oldKeyIds: readonly number[] = await rotateReleaseDeployKey({
      repository,
      dry,
      cwd,
      logger,
    });

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

    await deleteOldDeployKeys({ repository, oldKeyIds, dry, cwd, logger });
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
    '--enable-auto-merge=true',
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

interface RotateReleaseDeployKeyOptions {
  readonly repository: GithubRepository;
  readonly dry: boolean;
  readonly cwd: string;
  readonly logger: Logger;
}

/**
 * Creates a fresh write deploy key and stores its private half in the `RELEASE_DEPLOY_KEY`
 * Actions secret, then returns the ids of the deploy keys to remove (the previous release
 * deploy keys).
 *
 * The secret is set BEFORE any ruleset update: a ruleset failure then leaves the previous
 * key and the previous ruleset consistent, and a re-run repairs everything.
 */
async function rotateReleaseDeployKey({
  repository,
  dry,
  cwd,
  logger,
}: RotateReleaseDeployKeyOptions): Promise<readonly number[]> {
  const oldKeyIds: readonly number[] = await findDeployKeysByTitle({
    repository: repository.nameWithOwner,
    title: DEPLOY_KEY_TITLE,
    cwd,
    logger,
  });

  if (dry) {
    logger.debug(
      `(dry) ssh-keygen -t ed25519 -N '' -C ${DEPLOY_KEY_TITLE} -f <temporary directory>/${DEPLOY_KEY_NAME} -q`,
    );
    logger.debug(
      `(dry) gh api --method POST repos/${repository.nameWithOwner}/keys -f title=${DEPLOY_KEY_TITLE} -f key=<${DEPLOY_KEY_TITLE} public key> -F read_only=false`,
    );
    logger.debug(
      `(dry) gh secret set ${RELEASE_DEPLOY_KEY_SECRET} --repo ${repository.nameWithOwner} < <${DEPLOY_KEY_TITLE} private key>`,
    );

    for (const oldKeyId of oldKeyIds) {
      logger.debug(
        `(dry) gh api --method DELETE repos/${repository.nameWithOwner}/keys/${oldKeyId}`,
      );
    }

    return oldKeyIds;
  }

  const tempDirectory: string = await mkdtemp(join(tmpdir(), 'fabrique-deploy-key-'));

  try {
    const { privateKeyPath, publicKey } = await generateKeyPair({
      directory: tempDirectory,
      name: DEPLOY_KEY_NAME,
      comment: DEPLOY_KEY_TITLE,
      logger,
    });

    await createDeployKey({
      repository: repository.nameWithOwner,
      title: DEPLOY_KEY_TITLE,
      publicKey,
      cwd,
      logger,
    });

    await setActionsSecret({
      repository: repository.nameWithOwner,
      name: RELEASE_DEPLOY_KEY_SECRET,
      privateKeyPath,
      cwd,
      logger,
    });

    return oldKeyIds;
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
}

interface DeleteOldDeployKeysOptions {
  readonly repository: GithubRepository;
  readonly oldKeyIds: readonly number[];
  readonly dry: boolean;
  readonly cwd: string;
  readonly logger: Logger;
}

/**
 * Removes the previous release deploy keys, AFTER the ruleset updates: the ruleset PUT
 * replaces the bypass actors wholesale, so the old keys are unreferenced by then.
 */
async function deleteOldDeployKeys({
  repository,
  oldKeyIds,
  dry,
  cwd,
  logger,
}: DeleteOldDeployKeysOptions): Promise<void> {
  if (dry) {
    return; // the deletions were already logged by "rotateReleaseDeployKey"
  }

  for (const oldKeyId of oldKeyIds) {
    await deleteDeployKey({
      repository: repository.nameWithOwner,
      keyId: oldKeyId,
      cwd,
      logger,
    });
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
