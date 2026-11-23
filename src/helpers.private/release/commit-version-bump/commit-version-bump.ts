import { join } from 'node:path';
import process from 'node:process';
import { execCommandInherit } from '../../cmd/exec-command.ts';
import { readPackageJsonFile } from '../../file/package-json/read-package-json-file.ts';
import { gitAddPaths } from '../../git/git-add-paths/git-add-paths.ts';
import { gitCommit } from '../../git/git-commit/git-commit.ts';
import type { GitIdentity } from '../../git/git-identity/git-identity.ts';
import { setUpGitConfig } from '../../git/set-up-git-config.ts';
import type { Logger } from '../../log/logger.ts';

export interface CommitVersionBumpOptions {
  readonly cwd?: string;
  readonly identity?: GitIdentity;
  readonly dry?: boolean;
  readonly logger: Logger;
}

/**
 * Commits the version bump (package.json, CHANGELOG.md and the consumed changesets) and
 * pushes it to the release branch, with one retry when the branch moved in the meantime.
 */
export async function commitVersionBump({
  cwd = process.cwd(),
  identity = 'local',
  dry = false,
  logger,
}: CommitVersionBumpOptions): Promise<void> {
  const version: string = (await readPackageJsonFile(join(cwd, 'package.json'))).version;
  // a deploy key push triggers workflows, unlike a GITHUB_TOKEN push: "[skip ci]" prevents
  // a green no-op release run on the version bump push
  const message: string = `chore: bump package version to ${version} [skip ci]`;

  if (dry) {
    logger.debug('(dry) git add package.json CHANGELOG.md .changeset');
    logger.debug(`(dry) git commit -m ${message}`);
    logger.debug('(dry) git pull --rebase');
    logger.debug('(dry) git push');
    return;
  }

  if (identity === 'bot') {
    await setUpGitConfig({ logger, cwd });
  }

  await gitAddPaths({ paths: ['package.json', 'CHANGELOG.md', '.changeset'], cwd, logger });

  const committed: boolean = await gitCommit({ message, cwd, logger });

  if (!committed) {
    logger.info('No version bump to commit.');
    return;
  }

  let lastError: unknown;

  for (let attempt: number = 0; attempt < 2; attempt++) {
    try {
      await execCommandInherit(logger, 'git', ['pull', '--rebase'], { cwd });
      await execCommandInherit(logger, 'git', ['push'], { cwd });
      return;
    } catch (error: unknown) {
      lastError = error;
    }
  }

  throw new Error(
    'Unable to push the version bump commit. Rescue: run "git pull --rebase" on the release branch (resolve any conflict), then push.',
    { cause: lastError },
  );
}
