import { rm } from 'node:fs/promises';
import process from 'node:process';
import type { BuildMode } from '../../../helpers.private/build/build-mode/build-mode.ts';
import {
  buildTypescriptProject,
  type BuildTypescriptProjectOptions,
} from '../../../helpers.private/build/typescript/build-typescript-project.ts';
import type { PackageJson } from '../../../helpers.private/file/package-json/package-json.ts';
import { readPackageJsonFile } from '../../../helpers.private/file/package-json/read-package-json-file.ts';
import type { Logger } from '../../../helpers.private/log/logger.ts';
import { toAbsolutePath } from '../../../helpers.private/path/to-absolute-path.ts';

export interface BuildProjectOptions {
  readonly mode?: BuildMode;
  readonly cwd?: string;
  readonly output?: string;
  readonly logger: Logger;
}

/**
 * Builds a npm package.
 */
export function buildProject({
  mode = 'prod',
  cwd = process.cwd(),
  output = 'dist',
  logger,
}: BuildProjectOptions): Promise<void> {
  return logger.asyncTask('build', async (logger: Logger): Promise<void> => {
    await rm(toAbsolutePath(output, cwd), {
      force: true,
      recursive: true,
    });

    const packageJson: PackageJson = await readPackageJsonFile(toAbsolutePath('package.json', cwd));

    const type: string = packageJson.fabrique?.type ?? 'lib';

    switch (type) {
      case 'lib':
        await buildLibProject({
          sourceDirectory: 'src',
          outputDirectory: output,
          cwd,
          mode,
          logger,
        });
        break;
      default:
        throw new Error(`Unknown type ${type}.`);
    }
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
