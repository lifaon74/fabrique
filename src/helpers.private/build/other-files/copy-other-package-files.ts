import { join } from 'node:path';
import process from 'node:process';
import { optionalCopy } from '../../file/optional-copy.ts';
import type { Logger } from '../../log/logger.ts';
import { toAbsolutePath } from '../../path/to-absolute-path.ts';

export interface CopyOtherPackageFilesOptions {
  readonly cwd?: string;
  readonly outputDirectory?: string;
  readonly logger: Logger;
}

export async function copyOtherPackageFiles({
  cwd = process.cwd(),
  outputDirectory = 'dist',
  logger,
}: CopyOtherPackageFilesOptions): Promise<void> {
  outputDirectory = toAbsolutePath(outputDirectory, cwd);

  await Promise.all(
    ['README.md', 'CONTRIBUTING.md', 'LICENSE'].map(async (entry: string): Promise<void> => {
      if (await optionalCopy(join(cwd, entry), join(outputDirectory, entry))) {
        logger.info(`Copied: ${entry}`);
      } else {
        logger.warn(`Missing (skipped): ${entry}`);
      }
    }),
  );

  if (
    await optionalCopy(join(cwd, 'static'), join(outputDirectory, 'static'), {
      recursive: true,
    })
  ) {
    logger.info(`Copied: static directory`);
  } else {
    logger.warn(`Missing (skipped): static directory`);
  }
}
