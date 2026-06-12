import { confirm, select } from '@inquirer/prompts';
import { glob, mkdir, readFile, rm } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { execCommandInherit } from '../../../helpers.private/cmd/exec-command.ts';
import type { FabriqueConfig } from '../../../helpers.private/fabrique/fabrique-config.ts';
import type { PackageJson } from '../../../helpers.private/file/package-json/package-json.ts';
import { readPackageJsonFile } from '../../../helpers.private/file/package-json/read-package-json-file.ts';
import { writeFileSafe } from '../../../helpers.private/file/write-file-safe.ts';
import { writeJsonFileSafe } from '../../../helpers.private/file/write-json-file-safe.ts';
import type { Logger } from '../../../helpers.private/log/logger.ts';
import { listAvailableTemplates } from '../../../helpers.private/misc/list-available-templates.ts';
import {
  ROOT_DIRECTORY,
  getTemplateDirectoryPath,
} from '../../../helpers.private/misc/paths.constant.ts';
import { removeTrailingSlash } from '../../../helpers.private/path/remove-traling-slash.ts';

export interface UpgradeProjectOptions {
  readonly force?: boolean;
  readonly logger: Logger;
}

/**
 * Upgrades an existing project.
 */
export function upgradeProject({ force = false, logger }: UpgradeProjectOptions): Promise<void> {
  return logger.asyncTask('upgrade', async (logger: Logger): Promise<void> => {
    const projectDirectory: string = process.cwd();

    const version: string = (await readPackageJsonFile(join(ROOT_DIRECTORY, 'package.json')))
      .version;
    const projectPackage: PackageJson = await readPackageJsonFile(
      join(projectDirectory, 'package.json'),
    );

    const templates: readonly string[] = await listAvailableTemplates();
    let type;

    if (Object.hasOwn(projectPackage, 'fabrique')) {
      const fabriqueConfig: FabriqueConfig = projectPackage.fabrique!;
      type = fabriqueConfig.type;

      if (!templates.includes(type)) {
        throw new Error(`type must be one of the following: ${templates.join(', ')}.`);
      }

      if (!force && fabriqueConfig.version === version) {
        logger.warn('Library already up-to-date.');
        if (
          !(await confirm({
            message: 'Force the update ?',
            default: false,
          }))
        ) {
          return;
        }
      }
    } else {
      if (!force) {
        logger.warn('Not a "fabrique" lib.');
        if (
          !(await confirm({
            message: 'Upgrade anyway ?',
            default: true,
          }))
        ) {
          return;
        }
      }
      type = await select({
        message: 'Select a type',
        choices: templates.map((template) => {
          return {
            value: template,
          };
        }),
        default: templates[0],
      });
    }

    await logger.asyncTask('upgrade', async (logger: Logger): Promise<void> => {
      const templateDirectory: string = getTemplateDirectoryPath(type);

      await Promise.all([
        upgradeProjectFiles({ templateDirectory, projectDirectory, logger }),
        upgradeProjectPackage({
          templateDirectory,
          projectDirectory,
          projectPackage,
          fabriqueConfig: {
            version,
            type,
          },
          logger,
        }),
      ]);

      // update dependencies
      await execCommandInherit(logger, 'yarn', [], {
        cwd: projectDirectory,
      });
    });

    logger.info(`Library ${JSON.stringify(projectPackage.name)} updated.`);
  });
}

/* INTERNAL */

interface UpgradeProjectFilesOptions {
  readonly templateDirectory: string;
  readonly projectDirectory: string;
  readonly logger: Logger;
}

async function upgradeProjectFiles({
  templateDirectory,
  projectDirectory,
  logger,
}: UpgradeProjectFilesOptions): Promise<void> {
  templateDirectory = removeTrailingSlash(templateDirectory);

  await rm(join(projectDirectory, 'fabrique'), {
    force: true,
    recursive: true,
  });

  // files to exclude
  const exclude: readonly RegExp[] = [
    /^src(?:[\\\/].*)?$/,
    /^README\.md$/,
    /^LICENSE$/,
    /^package\.json$/,
    /^yarn\.lock$/,
  ];

  for await (const entry of glob(`${templateDirectory}/**/*`, {
    withFileTypes: true,
  })) {
    const entryPath: string = join(entry.parentPath, entry.name);
    const entryRelativePath: string = relative(templateDirectory, entryPath);
    const entryDestinationPath: string = join(projectDirectory, entryRelativePath);

    if (exclude.every((exclude: RegExp): boolean => !exclude.test(entryRelativePath))) {
      if (entry.isFile()) {
        logger.info('override:', entryRelativePath);
        await writeFileSafe(entryDestinationPath, await readFile(entryPath, { encoding: 'utf8' }));
      } else if (entry.isDirectory()) {
        await mkdir(entryDestinationPath, { recursive: true });
      }
    }
  }
}

interface UpgradeProjectPackageOptions {
  readonly templateDirectory: string;
  readonly projectDirectory: string;
  readonly projectPackage: PackageJson;
  readonly fabriqueConfig: FabriqueConfig;
  readonly logger: Logger;
}

/**
 * Upgrades the destination `package.json`.
 */
async function upgradeProjectPackage({
  templateDirectory,
  projectDirectory,
  projectPackage,
  fabriqueConfig,
  logger,
}: UpgradeProjectPackageOptions): Promise<void> {
  const templatePackage: PackageJson = await readPackageJsonFile(
    join(templateDirectory, 'package.json'),
  );

  const newPackageJson: PackageJson = {
    ...templatePackage,
    ...projectPackage,
    scripts: {
      ...Object.fromEntries(
        Object.entries(projectPackage.scripts ?? {}).filter(([key]: [string, string]): boolean => {
          return !key.startsWith('fb:');
        }),
      ),
      ...templatePackage.scripts,
    },
    devDependencies: {
      ...projectPackage.devDependencies,
      ...templatePackage.devDependencies,
    },
    packageManager: templatePackage.packageManager,
    fabrique: fabriqueConfig,
  };

  logger.info('merge: package.json');

  await writeJsonFileSafe(join(projectDirectory, 'package.json'), newPackageJson);
}
