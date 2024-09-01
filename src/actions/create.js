import { confirm, input } from '@inquirer/prompts';
import chalk from 'chalk';
import { cp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { cmd } from '../helpers/cmd.js';
import { exists } from '../helpers/fs/exists.js';
import { explore } from '../helpers/fs/explore.js';
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
 * @param {string} cwd
 * @param {Record<string, string>} values
 * @return {Promise<void>}
 */
async function replacePatterns(cwd, values) {
  for await (const [path, stats] of explore(cwd)) {
    if (stats.isFile()) {
      await writeFile(path, replacePattern(await readFile(path, { encoding: 'utf8' }), values));
    }
  }
}
