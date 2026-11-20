import type { SpawnOptions } from 'node:child_process';
import { join } from 'node:path';
import process from 'node:process';
import { execCommandInherit } from '../cmd/exec-command.ts';
import type { Logger } from '../log/logger.ts';

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
