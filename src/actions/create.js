import { confirm, input } from '@inquirer/prompts';
import chalk from 'chalk';
import { cp, readFile, rm, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { cmd } from '../helpers/cmd.js';
import { exists } from '../helpers/fs/exists.js';
import { explore } from '../helpers/fs/explore.js';
import { readJsonFile } from '../helpers/fs/read-json-file.js';
import { writeJsonFile } from '../helpers/fs/write-json-file.js';
import { log } from '../helpers/log/log.js';
import { ROOT_PATH } from '../helpers/paths.constant.js';
import { replacePattern } from '../helpers/replace-pattern.js';

/**
 * Creates a new lib.
 *
 * @param {string} type
 * @param {string} name
 * @return {Promise<void>}
 */
export async function create(type, name) {
  const templates = ['lib'];

  if (!templates.includes(type)) {
    throw new Error(`type must be one of the following: ${templates.join(', ')}.`);
  }

  const templatePath = join(ROOT_PATH, `./templates/${type}`);
  const destinationPath = `./${name}`;

  if (await exists(destinationPath)) {
    log('warn', 'A file or directory with the same name already exists.');
    if (
      await confirm({
        message: 'Remove it ?',
      })
    ) {
      await rm(destinationPath, { recursive: true });
      log('success', 'Removed');
    } else {
      return;
    }
  }

  const values = {
    libname: await input({ message: 'Library name', default: name, required: true }),
    description: await input({ message: 'Description' }),
    author: await input({ message: 'Author' }),
    giturl: await input({ message: 'Git url' }),
  };

  console.log(chalk.magentaBright('Initializing the library...'));

  await cp(templatePath, destinationPath, { recursive: true });

  await replacePatterns(destinationPath, values);

  const version = (await readJsonFile(join(ROOT_PATH, 'package.json'))).version;
  await upgradePackage(destinationPath, {
    version,
    type,
  });

  await cmd('yarn', [], {
    cwd: destinationPath,
  });

  log('success', `Library ${JSON.stringify(name)} created.`);
  console.log(chalk.magentaBright('Go to your project with:'), `cd ${destinationPath}`);
}

/*---*/
/**
 * Replaces the patterns `{{name}}` from all the files found inside `cwd`.
 *
 * @param {string} ext
 * @return {RegExp}
 */
function p_ext(ext) {
  return new RegExp(`^.*\.${ext}$`, 'i');
}

function p_name(name) {
  return new RegExp(`^${name}$`, 'i');
}

const DEFAULT_REPLACE_PATTERNS = [p_ext('md'), p_name('LICENSE'), p_name('package.json')];

/**
 * Replaces the patterns `{{name}}` from all the files found inside `cwd`.
 *
 * @param {string} cwd
 * @param {Record<string, string>} values
 * @param {readonly RegExp[]=} patterns
 * @return {Promise<void>}
 */
async function replacePatterns(cwd, values, patterns = DEFAULT_REPLACE_PATTERNS) {
  for await (const [path, stats] of explore(cwd)) {
    if (stats.isFile()) {
      const name = basename(path);
      if (patterns.some((pattern) => pattern.test(name))) {
        await writeFile(path, replacePattern(await readFile(path, { encoding: 'utf8' }), values));
      }
    }
  }
}

/**
 * Upgrades the destination `package.json`.
 *
 * @param {string} destinationPath
 * @param {{version: string; type: string;}} fabriqueConfig
 * @return {Promise<void>}
 */
async function upgradePackage(destinationPath, fabriqueConfig) {
  const packageJsonPath = join(destinationPath, 'package.json');
  const packageJson = await readJsonFile(packageJsonPath);
  const newPackageJson = {
    ...packageJson,
    fabrique: fabriqueConfig,
  };
  await writeJsonFile(packageJsonPath, newPackageJson);
}
