import process from 'node:process';
import { execCommand } from '../../cmd/exec-command.ts';
import type { Logger } from '../../log/logger.ts';

export interface SetActionsSecretOptions {
  /** The repository, as `owner/name`. */
  readonly repository: string;
  readonly name: string;
  /**
   * The file whose content becomes the secret value: it is streamed on the standard
   * input of the command and never travels as an argument (arguments are logged).
   */
  readonly privateKeyPath: string;
  readonly cwd?: string;
  readonly logger: Logger;
}

/**
 * Creates or updates a repository Actions secret with the content of the given file.
 */
export async function setActionsSecret({
  repository,
  name,
  privateKeyPath,
  cwd = process.cwd(),
  logger,
}: SetActionsSecretOptions): Promise<void> {
  await execCommand(
    logger,
    'gh',
    ['secret', 'set', name, '--repo', repository, '<', privateKeyPath],
    { shell: true, cwd },
  );
}
