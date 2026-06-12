import type { SpawnOptions } from 'node:child_process';
import { execCommandInherit } from '../cmd/exec-command.ts';
import type { Logger } from '../log/logger.ts';

export interface GitAddAllFilesOptions extends SpawnOptions {
  readonly logger: Logger;
}

/**
 * Adds all the files to git.
 */
export async function gitAddAllFiles({
  logger,
  ...spawnOptions
}: GitAddAllFilesOptions): Promise<void> {
  await execCommandInherit(logger, 'git', ['add', '-A'], spawnOptions);
}
