import process from 'node:process';
import { execCommand } from '../../../cmd/exec-command.ts';
import type { Logger } from '../../../log/logger.ts';

export interface DeleteDeployKeyOptions {
  /** The repository, as `owner/name`. */
  readonly repository: string;
  readonly keyId: number;
  readonly cwd?: string;
  readonly logger: Logger;
}

/**
 * Removes a deploy key from the repository. A failed deletion is never swallowed:
 * a leftover write deploy key bypasses the branch ruleset and must not be hidden.
 */
export async function deleteDeployKey({
  repository,
  keyId,
  cwd = process.cwd(),
  logger,
}: DeleteDeployKeyOptions): Promise<void> {
  await execCommand(
    logger,
    'gh',
    ['api', '--method', 'DELETE', `repos/${repository}/keys/${keyId}`],
    {
      cwd,
    },
  );
}
