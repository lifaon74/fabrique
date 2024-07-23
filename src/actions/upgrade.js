import chalk from 'chalk';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { cmd } from '../helpers/cmd.js';
import { explore } from '../helpers/fs/explore.js';
import { writeFileSafe } from '../helpers/fs/write-file-safe.js';
import { log } from '../helpers/log/log.js';
import { replacePattern } from '../helpers/replace-pattern.js';
import { ROOT } from '../helpers/root.constant.js';

/**
 * Upgrade an existing library
 *
 * @return {Promise<void>}
 */
export async function upgrade() {
  const destinationPath = '.';
  const packageJsonFileName = 'package.json';

  const destinationPackageJsonPath = join(destinationPath, packageJsonFileName);
  const pkg = JSON.parse(await readFile(destinationPackageJsonPath, { encoding: 'utf8' }));

  if (!Object.hasOwn(pkg, 'fabrique')) {
    throw new Error('Not a "fabrique" lib.');
  }

  const templatePath = join(ROOT, `./templates/${pkg.fabrique.type}`);

  console.log(chalk.magentaBright('Upgrading the library...'));

  // files to override
  const exclude = [/^src(?:\/.*)?$/, /^README\.md$/, /^package\.json$/, /^yarn\.lock$/];

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

  // update package.json
  const templatePackageJsonPath = join(templatePath, packageJsonFileName);
  const templatePackageJson = JSON.parse(
    await readFile(templatePackageJsonPath, { encoding: 'utf8' }),
  );
  const newPkg = {
    ...templatePackageJson,
    ...pkg,
    devDependencies: {
      ...pkg.devDependencies,
      ...templatePackageJson.devDependencies,
    },
    fabrique: templatePackageJson.fabrique,
  };
  await writeFileSafe(destinationPackageJsonPath, JSON.stringify(newPkg, null, 2));

  // update dependencies
  await cmd('yarn', [], {
    cwd: destinationPath,
  });

  log('success', `Library ${JSON.stringify(pkg.name)} updated.`);
}
