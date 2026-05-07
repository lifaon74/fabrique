import { confirm, input } from '@inquirer/prompts';
import { cp, glob, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { execCommandInherit } from '../../../helpers/cmd/exec-command.ts';
import type { FabriqueConfig } from '../../../helpers/fabrique/fabrique-config.ts';
import { doesFileExist } from '../../../helpers/file/does-file-exist.ts';
import type { PackageJson } from '../../../helpers/file/package-json/package-json.ts';
import { readPackageJsonFile } from '../../../helpers/file/package-json/read-package-json-file.ts';
import { writeFileSafe } from '../../../helpers/file/write-file-safe.ts';
import { writeJsonFileSafe } from '../../../helpers/file/write-json-file-safe.ts';
import type { Logger } from '../../../helpers/log/logger.ts';
import { getTemplateDirectoryPath, ROOT_PATH } from '../../../helpers/misc/paths.constant.ts';
import { replacePattern } from '../../../helpers/misc/replace-pattern.ts';
import { normalizeGitUrlForNpm } from '../../../helpers/npm/normalize-git-url-for-npm.ts';
import { removeTrailingSlash } from '../../../helpers/path/remove-traling-slash.ts';

export interface CreateProjectOptions {
  readonly type: 'lib' | string;
  readonly name: string;
  readonly logger: Logger;
}

/**
 * Creates a new project.
 */
export function createProject({ type, name, logger }: CreateProjectOptions): Promise<void> {
  return logger.asyncTask('create-project', async (logger: Logger): Promise<void> => {
    const templates: readonly string[] = ['lib'];

    if (!templates.includes(type)) {
      throw new Error(`type must be one of the following: ${templates.join(', ')}.`);
    }

    const templateDirectory: string = getTemplateDirectoryPath(type);
    const projectDirectory: string = join(process.cwd(), name);

    if (await doesFileExist(projectDirectory)) {
      logger.warn('A file or directory with the same name already exists.');
      if (
        await confirm({
          message: 'Remove it ?',
        })
      ) {
        await rm(projectDirectory, { recursive: true });
        logger.info('Removed');
      } else {
        return;
      }
    }

    const values = {
      libname: await input({ message: 'Library name', default: name, required: true }),
      description: await input({ message: 'Description' }),
      author: await input({ message: 'Author' }),
      giturl: normalizeGitUrlForNpm(await input({ message: 'Git url' })),
    };

    await logger.asyncTask('initialize', async (logger: Logger): Promise<void> => {
      await cp(templateDirectory, projectDirectory, { recursive: true });

      await replacePatterns({ projectDirectory: projectDirectory, values });

      const version: string = (await readPackageJsonFile(join(ROOT_PATH, 'package.json'))).version;

      await updatePackageWithFabriqueConfig({
        packageDirectory: projectDirectory,
        fabriqueConfig: {
          version,
          type,
        },
      });

      await execCommandInherit(logger, 'yarn', [], {
        cwd: projectDirectory,
      });
    });

    logger.info(`Library ${JSON.stringify(name)} created with success.`);
    logger.info(`You may access your project with: cd ./${name}`);
  });
}

/* INTERNAL */

/**
 * Replaces the patterns `{{name}}` from all the files found inside `cwd`.
 */
function p_ext(ext: string): RegExp {
  return new RegExp(`^.*\.${ext}$`, 'i');
}

function p_name(name: string): RegExp {
  return new RegExp(`^${name}$`, 'i');
}

const DEFAULT_REPLACE_PATTERNS: readonly RegExp[] = [
  p_ext('md'),
  p_name('LICENSE'),
  p_name('package.json'),
];

interface ReplacePatternsOptions {
  readonly projectDirectory: string;
  readonly values: Record<string, string>;
  readonly patterns?: readonly RegExp[];
}

/**
 * Replaces the patterns `{{name}}` from all the files found inside `cwd`.
 */
async function replacePatterns({
  projectDirectory,
  values,
  patterns = DEFAULT_REPLACE_PATTERNS,
}: ReplacePatternsOptions): Promise<void> {
  projectDirectory = removeTrailingSlash(projectDirectory);
  for await (const entry of glob(`${projectDirectory}/**/*`, { withFileTypes: true })) {
    if (entry.isFile()) {
      const entryPath: string = join(entry.parentPath, entry.name);

      if (patterns.some((pattern: RegExp): boolean => pattern.test(entry.name))) {
        await writeFileSafe(
          entryPath,
          replacePattern(await readFile(entryPath, { encoding: 'utf8' }), values),
        );
      }
    }
  }
}

interface UpdatePackageWithFabriqueConfigOptions {
  readonly packageDirectory: string;
  readonly fabriqueConfig: FabriqueConfig;
}

/**
 * Updates the destination `package.json` with the fabrique config.
 */
async function updatePackageWithFabriqueConfig({
  packageDirectory,
  fabriqueConfig,
}: UpdatePackageWithFabriqueConfigOptions): Promise<void> {
  const packageJsonPath: string = join(packageDirectory, 'package.json');
  const packageJson: PackageJson = await readPackageJsonFile(packageJsonPath);
  const newPackageJson = {
    ...packageJson,
    fabrique: fabriqueConfig,
  };
  await writeJsonFileSafe(packageJsonPath, newPackageJson);
}
