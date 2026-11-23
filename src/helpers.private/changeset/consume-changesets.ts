import type { SpawnOptions } from 'node:child_process';
import { join } from 'node:path';
import process from 'node:process';
import { execCommandInherit } from '../cmd/exec-command.ts';
import type { Logger } from '../log/logger.ts';
import { listPendingChangesets } from './list-pending-changesets/list-pending-changesets.ts';

export interface ConsumeChangesetsOptions extends SpawnOptions {
  readonly cwd?: string;
  readonly targetDirectory?: string;
  readonly logger: Logger;
}

export async function consumeChangesets({
  logger,
  cwd = process.cwd(),
  targetDirectory = cwd,
  ...options
}: ConsumeChangesetsOptions): Promise<void> {
  const pendingChangesets: readonly string[] = await listPendingChangesets({
    cwd: targetDirectory,
  });

  if (pendingChangesets.length === 0) {
    logger.info('No pending changesets, skipping changeset version.');
    return;
  }

  await execCommandInherit(
    logger,
    'node',
    [join(cwd, 'node_modules/@changesets/cli/bin.js'), 'version'],
    {
      ...options,
      cwd: targetDirectory,
    },
  );
}
