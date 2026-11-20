import type { SpawnOptions } from 'node:child_process';
import process from 'node:process';
import { execCommand, execCommandInherit } from '../../cmd/exec-command.ts';
import type { Logger } from '../../log/logger.ts';

export interface GitCommitOptions extends SpawnOptions {
  readonly message: string;
  readonly cwd?: string;
  readonly logger: Logger;
}

/**
 * Commits the staged changes. Returns false when nothing is staged.
 */
export async function gitCommit({
  message,
  cwd = process.cwd(),
  logger,
  ...spawnOptions
}: GitCommitOptions): Promise<boolean> {
  const stagedFiles: string = await execCommand(
    logger,
    'git',
    ['diff', '--cached', '--name-only'],
    { cwd, ...spawnOptions },
  );

  if (stagedFiles.trim() === '') {
    return false;
  }

  await execCommandInherit(logger, 'git', ['commit', '-m', message], { cwd, ...spawnOptions });
  return true;
}
