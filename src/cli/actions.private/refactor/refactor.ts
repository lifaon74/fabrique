import chalk from 'chalk';
import { glob, readFile, rename, writeFile } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { removeTrailingSlash } from '../../../helpers.private/path/remove-traling-slash.ts';

export interface RefactorOptions {
  readonly from: string;
  readonly to: string;
  readonly dry?: boolean;
  readonly cwd?: string;
}

/**
 * Refactor recursively many files
 */
export async function refactor({
  from,
  to,
  dry = false,
  cwd = process.cwd(),
}: RefactorOptions): Promise<void> {
  cwd = removeTrailingSlash(cwd);
  const refactorFunction: RefactorFunction = createRefactorFunction(from, to);

  for await (const entry of glob(`${cwd}/**/*`, {
    withFileTypes: true,
  })) {
    const entryPath: string = join(entry.parentPath, entry.name);

    if (entry.isFile()) {
      await refactorFileContent({ entryPath, refactorFunction, dry });
      await refactorFileName({ entryPath, refactorFunction, dry });
    } else if (entry.isDirectory()) {
      await refactorFileName({ entryPath, refactorFunction, dry });
    }
  }
}

/*----------*/

function dashCaseToCamelCase(input: string): string {
  return input.replace(/-([a-z])/g, (_: string, letter: string): string => {
    return letter.toUpperCase();
  });
}

function dashCaseToPascalCase(input: string): string {
  const output: string = dashCaseToCamelCase(input);
  return `${output.slice(0, 1).toUpperCase()}${output.slice(1)}`;
}

function dashCaseToUpperSnakeCase(input: string): string {
  return input.replace(/-/g, '_').toUpperCase();
}

interface RefactorFunction {
  (input: string): string;
}

function createRefactorFunction(from: string, to: string): RefactorFunction {
  if (!from.includes('-') && to.includes('-')) {
    throw new Error("'from' must be dash-case");
  }

  /* DASH CASE */
  const REPLACE_DASH_CASE_REGEXP: RegExp = new RegExp(from, 'g');

  const replaceDashCase = (input: string): string => {
    return input.replace(REPLACE_DASH_CASE_REGEXP, to);
  };

  /* CAMEL CASE */
  const fromAsCamelCase: string = dashCaseToCamelCase(from);
  const toAsCamelCase: string = dashCaseToCamelCase(to);
  const REPLACE_CAMEL_CASE_REGEXP: RegExp = new RegExp(fromAsCamelCase, 'g');

  const replaceCamelCase: RefactorFunction = (input: string): string => {
    return input.replace(REPLACE_CAMEL_CASE_REGEXP, toAsCamelCase);
  };

  const replaceDashAndCamelCase: RefactorFunction = from.includes('-')
    ? (input: string): string => {
        return replaceCamelCase(replaceDashCase(input));
      }
    : replaceDashCase;

  /* PASCAL CASE */
  const fromAsPascalCase: string = dashCaseToPascalCase(from);
  const toAsPascalCase: string = dashCaseToPascalCase(to);
  const REPLACE_PASCAL_CASE_REGEXP: RegExp = new RegExp(fromAsPascalCase, 'g');

  const replacePascalCase: RefactorFunction = (input: string): string => {
    return input.replace(REPLACE_PASCAL_CASE_REGEXP, toAsPascalCase);
  };

  /* UPPER CASE */

  const fromAsUpperCase: string = dashCaseToUpperSnakeCase(from);
  const toAsUpperCase: string = dashCaseToUpperSnakeCase(to);
  const REPLACE_UPPER_CASE_REGEXP: RegExp = new RegExp(fromAsUpperCase, 'g');

  const replaceUpperCase: RefactorFunction = (input: string): string => {
    return input.replace(REPLACE_UPPER_CASE_REGEXP, toAsUpperCase);
  };

  /* JOIN */

  return (input: string): string => {
    return replaceUpperCase(replacePascalCase(replaceDashAndCamelCase(input)));
  };
}

/*---*/

interface RefactorFileNameOptions {
  readonly entryPath: string;
  readonly refactorFunction: RefactorFunction;
  readonly dry: boolean;
}

async function refactorFileName({
  entryPath,
  refactorFunction,
  dry = false,
}: RefactorFileNameOptions): Promise<string> {
  const newPath = join(dirname(entryPath), refactorFunction(basename(entryPath)));
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

interface RefactorFileNContentOptions {
  readonly entryPath: string;
  readonly refactorFunction: RefactorFunction;
  readonly dry: boolean;
}

async function refactorFileContent({
  entryPath,
  refactorFunction,
  dry = false,
}: RefactorFileNContentOptions): Promise<void> {
  const content: string = await readFile(entryPath, { encoding: 'utf8' });
  const newContent: string = refactorFunction(content);

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
