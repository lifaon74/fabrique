import process from 'node:process';
import { execCommand } from '../../../cmd/exec-command.ts';
import type { Logger } from '../../../log/logger.ts';

export interface FindDeployKeysByTitleOptions {
  /** The repository, as `owner/name`. */
  readonly repository: string;
  readonly title: string;
  readonly cwd?: string;
  readonly logger: Logger;
}

interface GithubDeployKey {
  readonly id: number;
  readonly title: string;
}

/**
 * Returns the ids of EVERY deploy key of the repository carrying this title, including
 * the ones left over by failed runs.
 */
export async function findDeployKeysByTitle({
  repository,
  title,
  cwd = process.cwd(),
  logger,
}: FindDeployKeysByTitleOptions): Promise<readonly number[]> {
  const output: string = await execCommand(
    logger,
    'gh',
    ['api', `repos/${repository}/keys?per_page=100`],
    { cwd },
  );

  const keys: readonly GithubDeployKey[] = JSON.parse(output);

  return keys
    .filter((key: GithubDeployKey): boolean => key.title === title)
    .map((key: GithubDeployKey): number => key.id);
}
