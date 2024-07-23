import chalk from 'chalk';
import { readFile, rename, writeFile } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { explore } from '../helpers/fs/explore.js';

/**
 * Refactor recursively many files
 *
 * @param {string} cwd
 * @param {string} from
 * @param {string} to
 * @param {{dry?: boolean, cwd?: string }} options
 * @return {Promise<void>}
 */
export async function refactor(from, to, { dry = false, cwd = process.cwd() }) {
  const refactor = createRefactorFunction(from, to);

  for await (const [path, stats] of explore(cwd)) {
    if (stats.isFile()) {
      await refactorFileContent(path, refactor, dry);
      await refactorFileName(path, refactor, dry);
    } else if (stats.isDirectory()) {
      await refactorFileName(path, refactor, dry);
    }
  }
}

/*----------*/

/**
 * @param {string} input
 * @return {string}
 */
function dashCaseToCamelCase(input) {
  return input.replace(/-([a-z])/g, (_, firstLetter) => {
    return firstLetter.toUpperCase();
  });
}

/**
 * @param {string} input
 * @return {string}
 */
function dashCaseToPascalCase(input) {
  const output = dashCaseToCamelCase(input);
  return `${output.slice(0, 1).toUpperCase()}${output.slice(1)}`;
}

/**
 * @param {string} input
 * @return {string}
 */
function dashCaseToUpperCase(input) {
  return input.replace(/-/g, '_').toUpperCase();
}

/**
 * @param {string} from
 * @param {string} to
 * @return {(input: string) => string}
 */
function createRefactorFunction(from, to) {
  if (!from.includes('-') && to.includes('-')) {
    throw new Error("'from' must be dash-case");
  }

  /* DASH CASE */
  const REPLACE_DASH_CASE_REGEXP = new RegExp(from, 'g');

  const replaceDashCase = (input) => {
    return input.replace(REPLACE_DASH_CASE_REGEXP, to);
  };

  /* CAMEL CASE */
  const fromAsCamelCase = dashCaseToCamelCase(from);
  const toAsCamelCase = dashCaseToCamelCase(to);
  const REPLACE_CAMEL_CASE_REGEXP = new RegExp(fromAsCamelCase, 'g');

  const replaceCamelCase = (input) => {
    return input.replace(REPLACE_CAMEL_CASE_REGEXP, toAsCamelCase);
  };

  const replaceDashAndCamelCase = from.includes('-')
    ? (input) => {
        return replaceCamelCase(replaceDashCase(input));
      }
    : replaceDashCase;

  /* PASCAL CASE */
  const fromAsPascalCase = dashCaseToPascalCase(from);
  const toAsPascalCase = dashCaseToPascalCase(to);
  const REPLACE_PASCAL_CASE_REGEXP = new RegExp(fromAsPascalCase, 'g');

  const replacePascalCase = (input) => {
    return input.replace(REPLACE_PASCAL_CASE_REGEXP, toAsPascalCase);
  };

  /* UPPER CASE */

  const fromAsUpperCase = dashCaseToUpperCase(from);
  const toAsUpperCase = dashCaseToUpperCase(to);
  const REPLACE_UPPER_CASE_REGEXP = new RegExp(fromAsUpperCase, 'g');

  const replaceUpperCase = (input) => {
    return input.replace(REPLACE_UPPER_CASE_REGEXP, toAsUpperCase);
  };

  /* JOIN */

  /**
   * @param {string} input
   * @return {string}
   */
  return (input) => {
    return replaceUpperCase(replacePascalCase(replaceDashAndCamelCase(input)));
  };
}

/*---*/

/**
 * @param {string} entryPath
 * @param {(input: string) => string} refactor
 * @param {boolean} dry
 * @return {Promise<string>}
 */
async function refactorFileName(entryPath, refactor, dry = false) {
  const newPath = join(dirname(entryPath), refactor(basename(entryPath)));
  if (entryPath !== newPath) {
    if (dry) {
      console.log(
        chalk.blueBright('rename:'),
        chalk.greenBright(basename(entryPath)),
        chalk.blueBright('=>'),
        chalk.yellowBright(basename(newPath)),
      );
      return entryPath;
    } else {
      await rename(entryPath, newPath);
    }
  }
  return newPath;
}

/**
 * @param {string} entryPath
 * @param {(input: string) => string} refactor
 * @param {boolean} dry
 * @return {Promise<string>}
 */
async function refactorFileContent(entryPath, refactor, dry = false) {
  const content = await readFile(entryPath, { encoding: 'utf8' });
  const newContent = refactor(content);

  if (newContent !== content) {
    if (dry) {
      console.log(
        chalk.blueBright('refactoring content of:'),
        chalk.greenBright(basename(entryPath)),
      );
      // console.log(colorize('yellow', newContent));
    } else {
      await writeFile(entryPath, newContent, { encoding: 'utf8' });
    }
  }
}
