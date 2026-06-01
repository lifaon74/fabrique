import { rm } from 'node:fs/promises';
import { isAbsolute, join, relative } from 'node:path';
import process from 'node:process';
import { generateTypescriptIndexFile } from '../../../helpers.private/build/generate-typescript-index-file.ts';
import { execCommandInherit } from '../../../helpers.private/cmd/exec-command.ts';
import type { PackageJson } from '../../../helpers.private/file/package-json/package-json.ts';
import { readPackageJsonFile } from '../../../helpers.private/file/package-json/read-package-json-file.ts';
import { writeJsonFileSafe } from '../../../helpers.private/file/write-json-file-safe.ts';
import type { Logger } from '../../../helpers.private/log/logger.ts';
import { removeTrailingSlash } from '../../../helpers.private/path/remove-traling-slash.ts';
import type { ReleaseMode } from '../../../helpers.private/release/release-mode/release-mode.ts';

export interface BuildProjectOptions {
  readonly mode?: ReleaseMode;
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
  output = join(cwd, 'dist'),
  logger,
}: BuildProjectOptions): Promise<void> {
  return logger.asyncTask('build', async (logger: Logger): Promise<void> => {
    cwd = removeTrailingSlash(cwd);

    const packageJson: PackageJson = await readPackageJsonFile(join(cwd, 'package.json'));

    const type: string = packageJson.fabrique?.type ?? 'lib';

    switch (type) {
      case 'lib':
        await buildLibProject({
          sourceDirectory: 'src',
          outputDirectory: output,
          cwd,
          logger,
        });
        break;
      default:
        throw new Error(`Unknown type ${type}.`);
    }
  });
}

/* ==== INTERNAL ==== */

interface BuildLibProjectOptions extends Omit<BuildTypescriptProjectOptions, 'sourceDirectory'> {}

async function buildLibProject(options: BuildLibProjectOptions): Promise<void> {
  await buildTypescriptProject({
    ...options,
    sourceDirectory: 'src',
  });
}

/* TYPESCRIPT */

interface BuildTypescriptProjectOptions {
  readonly sourceDirectory?: string;
  readonly outputDirectory?: string;
  readonly cwd?: string;
  readonly logger: Logger;
}

async function buildTypescriptProject({
  sourceDirectory = 'src',
  outputDirectory = 'dist',
  cwd = process.cwd(),
  logger,
}: BuildTypescriptProjectOptions): Promise<void> {
  await using stack: AsyncDisposableStack = new AsyncDisposableStack();

  // for await (const entry of glob(`${sourceDirectory}/**/*.{js,js.map}`, {
  //   cwd,
  // })) {
  //   await rm(entry);
  // }

  const include: string[] = [];

  const publicOutputPath: string | null = await generateTypescriptIndexFile({
    sourceDirectory,
    cwd,
  });

  if (publicOutputPath === null) {
    throw new Error('Empty public typescript index file.');
  } else {
    stack.defer((): Promise<void> => rm(publicOutputPath));

    include.push(isAbsolute(publicOutputPath) ? relative(cwd, publicOutputPath) : publicOutputPath);
  }

  const protectedOutputPath: string | null = await generateTypescriptIndexFile({
    sourceDirectory,
    type: 'protected',
    cwd,
  });

  if (protectedOutputPath !== null) {
    stack.defer((): Promise<void> => rm(protectedOutputPath));

    include.push(
      isAbsolute(protectedOutputPath) ? relative(cwd, protectedOutputPath) : protectedOutputPath,
    );
  }

  const outDir: string = isAbsolute(outputDirectory)
    ? relative(cwd, outputDirectory)
    : outputDirectory;

  const tsconfigBuildPath: string = join(cwd, 'tsconfig.build.json');

  await writeJsonFileSafe(tsconfigBuildPath, {
    extends: 'tsconfig.json',
    compilerOptions: {
      declaration: true,
      declarationDir: outDir,
      rootDir: sourceDirectory,
      outDir,
    },
    include,
  });

  stack.defer((): Promise<void> => rm(tsconfigBuildPath));

  await execCommandInherit(logger, 'tsc', ['-p', 'tsconfig.build.json'], { cwd });
}
