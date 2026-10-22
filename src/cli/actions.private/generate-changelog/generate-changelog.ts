import { rm } from 'node:fs/promises';
import process from 'node:process';
import type { BuildMode } from '../../../helpers.private/build/build-mode/build-mode.ts';
import {
  buildTypescriptProject,
  type BuildTypescriptProjectOptions,
} from '../../../helpers.private/build/typescript/build-typescript-project.ts';
import { execCommandInherit } from '../../../helpers.private/cmd/exec-command.ts';
import type { PackageJson } from '../../../helpers.private/file/package-json/package-json.ts';
import { readPackageJsonFile } from '../../../helpers.private/file/package-json/read-package-json-file.ts';
import type { Logger } from '../../../helpers.private/log/logger.ts';
import { toAbsolutePath } from '../../../helpers.private/path/to-absolute-path.ts';

export interface GenerateChangelogOptions {
  readonly cwd?: string;
  readonly output?: string;
  readonly logger: Logger;
}

/**
 * Generates/updates the changelog.
 */
export function generateChangelog({
  cwd = process.cwd(),
  output = 'dist',
  logger,
}: GenerateChangelogOptions): Promise<void> {
  return logger.asyncTask('changelog', async (logger: Logger): Promise<void> => {
    execCommandInherit(logger, 'changeset', ['version']);
  });
}

/* ==== INTERNAL ==== */

interface BuildLibProjectOptions extends BuildTypescriptProjectOptions {
  readonly mode?: BuildMode;
  readonly logger: Logger;
}

async function buildLibProject({ logger, ...options }: BuildLibProjectOptions): Promise<void> {
  await logger.asyncTask('build-lib-project', async (logger: Logger): Promise<void> => {
    await buildTypescriptProject({
      ...options,
      logger,
    });
  });
}
