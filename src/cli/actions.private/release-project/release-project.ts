import { join } from 'node:path';
import process from 'node:process';
import { execCommandInherit } from '../../../helpers.private/cmd/exec-command.ts';
import type { PackageJson } from '../../../helpers.private/file/package-json/package-json.ts';
import { readPackageJsonFile } from '../../../helpers.private/file/package-json/read-package-json-file.ts';
import { gitTagAndPush } from '../../../helpers.private/git/git-tag-and-push.ts';
import type { Logger } from '../../../helpers.private/log/logger.ts';
import { isNpmPackagePublished } from '../../../helpers.private/npm/is-npm-version-published/is-npm-package-published.ts';
import { removeTrailingSlash } from '../../../helpers.private/path/remove-traling-slash.ts';
import { releaseModeToNpmTag } from '../../../helpers.private/release/release-mode/release-mode-to-npm-tag.ts';
import type { ReleaseMode } from '../../../helpers.private/release/release-mode/release-mode.ts';

export interface ReleaseProjectOptions {
  readonly mode?: ReleaseMode;
  readonly dry?: boolean;
  readonly cwd?: string;
  readonly output?: string;
  readonly logger: Logger;
}

/**
 * Releases a npm package.
 */
export function releaseProject({
  mode = 'prod',
  dry = false,
  cwd = process.cwd(),
  output = join(cwd, 'dist'),
  logger,
}: ReleaseProjectOptions): Promise<void> {
  return logger.asyncTask('release', async (logger: Logger): Promise<void> => {
    cwd = removeTrailingSlash(cwd);

    // TODO add build tsc cli script
    await execCommandInherit(
      logger,
      'yarn',
      ['run', 'fb:build', '--mode', mode, '--output', output],
      {
        env: process.env,
        cwd,
      },
    );

    const outputPackageJson: PackageJson = await readPackageJsonFile(join(output, 'package.json'));

    if (
      await isNpmPackagePublished({
        name: outputPackageJson.name,
        version: outputPackageJson.version,
      })
    ) {
      throw new Error(
        `Package ${outputPackageJson.name}@${outputPackageJson.version} already exists on npm.`,
      );
    }

    {
      const tag: string = releaseModeToNpmTag(mode);

      const args: string[] = ['publish', '--access', 'public'];

      if (tag !== undefined) {
        args.push('--tag', tag);
      }

      if (dry) {
        logger.debug(`(dry) npm publish ${args.join(' ')}`);
      } else {
        await execCommandInherit(logger, 'npm', args, {
          shell: true,
          env: process.env,
          cwd: output,
        });
      }
    }

    {
      const tag: string = `v${(await readPackageJsonFile(join(output, 'package.json'))).version}`;

      if (dry) {
        logger.debug(`(dry) git tag -a ${tag}`);
        logger.debug('(dry) git push --tags');
      } else {
        await gitTagAndPush({
          tag,
          message: `release ${tag}`,
          cwd,
          logger,
        });
      }
    }
  });
}
