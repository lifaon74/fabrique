import { join } from 'node:path';
import process from 'node:process';
import { execCommandInherit } from '../../../helpers.private/cmd/exec-command.ts';
import type { PackageJson } from '../../../helpers.private/file/package-json/package-json.ts';
import { readPackageJsonFile } from '../../../helpers.private/file/package-json/read-package-json-file.ts';
import { gitTagAndPush } from '../../../helpers.private/git/git-tag-and-push.ts';
import type { Logger } from '../../../helpers.private/log/logger.ts';
import { isNpmPackagePublished } from '../../../helpers.private/npm/is-npm-version-published/is-npm-package-published.ts';
import { toAbsolutePath } from '../../../helpers.private/path/to-absolute-path.ts';
import { releaseModeToNpmTag } from '../../../helpers.private/release/release-mode/release-mode-to-npm-tag.ts';
import type { ReleaseMode } from '../../../helpers.private/release/release-mode/release-mode.ts';
import { buildProject } from '../build-project/build-project.ts';

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
  output = 'dist',
  logger,
}: ReleaseProjectOptions): Promise<void> {
  return logger.asyncTask('release', async (logger: Logger): Promise<void> => {
    const inputPackageJson: PackageJson = await readPackageJsonFile(join(cwd, 'package.json'));

    if (
      inputPackageJson.scripts !== undefined &&
      (inputPackageJson.scripts['fb:build'] !== undefined ||
        inputPackageJson.scripts['build'] !== undefined)
    ) {
      const command: string =
        inputPackageJson.scripts['fb:build'] !== undefined ? 'fb:build' : 'build';

      await execCommandInherit(
        logger,
        'yarn',
        ['run', command, '--mode', mode, '--output', output],
        {
          env: process.env,
          cwd,
        },
      );
    } else {
      await buildProject({
        mode,
        cwd,
        output,
        logger,
      });
    }

    const outputPackageJson: PackageJson = await readPackageJsonFile(
      toAbsolutePath(join(output, 'package.json'), cwd),
    );

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
          cwd: toAbsolutePath(output, cwd),
        });
      }
    }

    {
      const tag: string = `v${outputPackageJson.version}`;

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
