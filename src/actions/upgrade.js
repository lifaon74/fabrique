import { confirm, select } from '@inquirer/prompts';
import chalk from 'chalk';
import { mkdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { cmd } from '../helpers/cmd.js';
import { explore } from '../helpers/fs/explore.js';
import { readJsonFile } from '../helpers/fs/read-json-file.js';
import { writeFileSafe } from '../helpers/fs/write-file-safe.js';
import { writeJsonFile } from '../helpers/fs/write-json-file.js';
import { listAvailableTemplates } from '../helpers/list-available-templates.js';
import { log } from '../helpers/log/log.js';
import { ROOT_PATH, getTemplatePath } from '../helpers/paths.constant.js';

/**
 * Upgrades an existing library.
 *
 * @return {Promise<void>}
 */
export async function upgrade({ force = false } = {}) {
  const destinationPath = '.';

  const version = (await readJsonFile(join(ROOT_PATH, 'package.json'))).version;
  const destinationPackage = await readJsonFile(join(destinationPath, 'package.json'));

  const templates = await listAvailableTemplates();
  let type;

  if (Object.hasOwn(destinationPackage, 'fabrique')) {
    type = destinationPackage.fabrique.type;

    if (!templates.includes(type)) {
      throw new Error(`type must be one of the following: ${templates.join(', ')}.`);
    }

    if (!force && destinationPackage.fabrique.version === version) {
      log('warn', 'Library already up-to-date.');
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
      log('warn', 'Not a "fabrique" lib.');
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

  console.log(chalk.magentaBright('Upgrading the library...'));

  const templatePath = getTemplatePath(type);

  await Promise.all([
    upgradeFiles(templatePath, destinationPath),
    upgradePackage({
      templatePath,
      destinationPath,
      destinationPackage,
      fabriqueConfig: {
        version,
        type,
      },
    }),
  ]);

  // update dependencies
  await cmd('yarn', [], {
    cwd: destinationPath,
  });

  log('success', `Library ${JSON.stringify(destinationPackage.name)} updated.`);
}

async function upgradeFiles(templatePath, destinationPath) {
  // files to exclude
  const exclude = [
    /^src(?:[\\\/].*)?$/,
    /^README\.md$/,
    /^LICENSE$/,
    /^package\.json$/,
    /^yarn\.lock$/,
  ];

  for await (const [path, stats] of explore(templatePath)) {
    const entryRelativePath = relative(templatePath, path);
    const entryDestinationPath = join(destinationPath, entryRelativePath);

    if (exclude.every((exclude) => !exclude.test(entryRelativePath))) {
      if (stats.isFile()) {
        console.log(chalk.yellowBright('override:'), entryRelativePath);
        await writeFileSafe(entryDestinationPath, await readFile(path, { encoding: 'utf8' }));
      } else if (stats.isDirectory()) {
        await mkdir(entryDestinationPath, { recursive: true });
      }
    }
  }
}

/**
 * Upgrades the destination `package.json`.
 *
 * @param {string} templatePath
 * @param {string} destinationPath
 * @param {any} destinationPackage
 * @param {{version: string; type: string;}} fabriqueConfig
 * @return {Promise<void>}
 */
async function upgradePackage({
  templatePath,
  destinationPath,
  destinationPackage,
  fabriqueConfig,
}) {
  const templatePackage = await readJsonFile(join(templatePath, 'package.json'));

  const newPackageJson = {
    ...templatePackage,
    ...destinationPackage,
    scripts: {
      ...Object.fromEntries(
        Object.entries(destinationPackage.scripts ?? {}).filter(([key, value]) => {
          return !key.startsWith('fb:');
        }),
      ),
      ...templatePackage.scripts,
    },
    devDependencies: {
      ...destinationPackage.devDependencies,
      ...templatePackage.devDependencies,
    },
    packageManager: templatePackage.packageManager,
    fabrique: fabriqueConfig,
  };

  console.log(chalk.yellowBright('merge:'), 'package.json');
  await writeJsonFile(join(destinationPath, 'package.json'), newPackageJson);
}
