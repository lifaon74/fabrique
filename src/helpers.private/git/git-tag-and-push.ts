import type { SpawnOptions } from 'node:child_process';
import { execCommandInherit } from '../cmd/exec-command.ts';
import type { Logger } from '../log/logger.ts';

export interface GitTagAndPushOptions extends SpawnOptions {
  readonly tag: string;
  readonly message?: string;
  readonly logger: Logger;
}

/**
 * Git tag and push
 */
export async function gitTagAndPush({
  tag,
  message = `release ${tag}`,
  logger,
  ...spawnOptions
}: GitTagAndPushOptions): Promise<void> {
  await execCommandInherit(logger, 'git', ['tag', '-a', tag, '-m', message], spawnOptions);
  await execCommandInherit(logger, 'git', ['push', '--tags'], spawnOptions);
}
