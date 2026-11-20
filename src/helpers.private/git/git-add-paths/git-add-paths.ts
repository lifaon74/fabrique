import type { SpawnOptions } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';
import { execCommandInherit } from '../../cmd/exec-command.ts';
import type { Logger } from '../../log/logger.ts';

export interface GitAddPathsOptions extends SpawnOptions {
  readonly paths: readonly string[];
  readonly cwd?: string;
  readonly logger: Logger;
}

/**
 * Stages the existing paths only, including the deletions inside the staged directories.
 */
export async function gitAddPaths({
  paths,
  cwd = process.cwd(),
  logger,
  ...spawnOptions
}: GitAddPathsOptions): Promise<void> {
  const existingPaths: readonly string[] = paths.filter((path: string): boolean => {
    return existsSync(join(cwd, path));
  });

  if (existingPaths.length === 0) {
    logger.info('Nothing to stage.');
    return;
  }

  await execCommandInherit(logger, 'git', ['add', '-A', '--', ...existingPaths], {
    cwd,
    ...spawnOptions,
  });
}
