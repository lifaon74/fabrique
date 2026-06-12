import { rm } from 'node:fs/promises';
import { join } from 'node:path';
import process from 'node:process';
import { execCommandInherit } from '../../cmd/exec-command.ts';
import { readPackageJsonFile } from '../../file/package-json/read-package-json-file.ts';
import { writeJsonFileSafe } from '../../file/write-json-file-safe.ts';
import type { Logger } from '../../log/logger.ts';
import { relativePath } from '../../path/relative-path.ts';
import { toAbsolutePath } from '../../path/to-absolute-path.ts';
import { copyOtherPackageFiles } from '../other-files/copy-other-package-files.ts';
import {
  generateTypescriptBuildPackageJsonFile,
  type GenerateTypescriptBuildPackageJsonFileOptions,
} from '../package-json/generate-build-package-json-file/typescript/generate-typescript-build-package-json-file.ts';
import { buildTypescriptIndexFile } from './build-typescript-index-file.ts';

export interface BuildTypescriptProjectOptions extends Omit<
  GenerateTypescriptBuildPackageJsonFileOptions,
  'indexFilePath' | 'protectedIndexFilePath'
> {
  readonly sourceDirectory?: string;
  readonly outputDirectory?: string;
  readonly cwd?: string;
  readonly logger: Logger;
}

export async function buildTypescriptProject({
  sourceDirectory = 'src',
  outputDirectory = 'dist',
  cwd = process.cwd(),
  logger,
  ...options
}: BuildTypescriptProjectOptions): Promise<void> {
  await using stack: AsyncDisposableStack = new AsyncDisposableStack();

  const include: string[] = [];

  const absoluteIndexFilePath: string | null = await logger.asyncTask(
    'build index.ts',
    (): Promise<string | null> => {
      return buildTypescriptIndexFile({
        sourceDirectory,
        cwd,
      });
    },
  );

  if (absoluteIndexFilePath === null) {
    throw new Error('Empty public typescript index file.');
  } else {
    stack.defer((): Promise<void> => rm(absoluteIndexFilePath));

    include.push(relativePath(absoluteIndexFilePath, cwd));
  }

  const absoluteProtectedIndexFilePath: string | null = await logger.asyncTask(
    'build index.protected.ts',
    (): Promise<string | null> => {
      return buildTypescriptIndexFile({
        sourceDirectory,
        type: 'protected',
        cwd,
      });
    },
  );

  if (absoluteProtectedIndexFilePath !== null) {
    stack.defer((): Promise<void> => rm(absoluteProtectedIndexFilePath));

    include.push(relativePath(absoluteProtectedIndexFilePath, cwd));
  }

  await logger.asyncTask('build tsconfig.build.json', async (): Promise<void> => {
    const outDir: string = relativePath(outputDirectory, cwd);

    const tsconfigBuildPath: string = toAbsolutePath('tsconfig.build.json', cwd);

    await writeJsonFileSafe(tsconfigBuildPath, {
      extends: './tsconfig.json',
      compilerOptions: {
        declaration: true,
        declarationDir: outDir,
        rootDir: '.',
        outDir,
      },
      include,
    });

    stack.defer((): Promise<void> => rm(tsconfigBuildPath));
  });

  await logger.asyncTask('compile typescript', async (logger: Logger): Promise<void> => {
    await execCommandInherit(logger, 'tsc', ['-p', './tsconfig.build.json'], { cwd });
  });

  await logger.asyncTask('build package.json', async (): Promise<void> => {
    await writeJsonFileSafe(
      join(outputDirectory, 'package.json'),
      generateTypescriptBuildPackageJsonFile(await readPackageJsonFile(join(cwd, 'package.json')), {
        ...options,
        indexFilePath: relativePath(absoluteIndexFilePath, cwd),
        protectedIndexFilePath:
          absoluteProtectedIndexFilePath === null
            ? null
            : relativePath(absoluteProtectedIndexFilePath, cwd),
      }),
    );
  });

  await logger.asyncTask('copy other files', async (logger: Logger): Promise<void> => {
    await copyOtherPackageFiles({
      outputDirectory,
      cwd,
      logger,
    });
  });
}
