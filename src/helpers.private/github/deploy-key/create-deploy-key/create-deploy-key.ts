import process from 'node:process';
import { execCommand } from '../../../cmd/exec-command.ts';
import type { Logger } from '../../../log/logger.ts';

export interface CreateDeployKeyOptions {
  /** The repository, as `owner/name`. */
  readonly repository: string;
  readonly title: string;
  /** The single-line OpenSSH public key. */
  readonly publicKey: string;
  readonly cwd?: string;
  readonly logger: Logger;
}

/**
 * Adds a write deploy key to the repository and returns its id.
 */
export async function createDeployKey({
  repository,
  title,
  publicKey,
  cwd = process.cwd(),
  logger,
}: CreateDeployKeyOptions): Promise<number> {
  const output: string = await execCommand(
    logger,
    'gh',
    [
      'api',
      '--method',
      'POST',
      `repos/${repository}/keys`,
      '-f',
      `title=${title}`,
      '-f',
      `key=${publicKey}`,
      '-F',
      'read_only=false',
    ],
    { cwd },
  );

  return (JSON.parse(output) as { readonly id: number }).id;
}
