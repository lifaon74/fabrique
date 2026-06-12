import { loadOptionallyEnvFile } from '../../../helpers.private/env/env-file/load-optionally-env-file.ts';
import { getEnvGithubCiConfig } from '../../../helpers.private/github/github-ci-config/env/get-env-github-ci-config.ts';
import type {
  GithubCiConfig,
  GithubCiLabel,
} from '../../../helpers.private/github/github-ci-config/github-ci-config.ts';
import type { Logger } from '../../../helpers.private/log/logger.ts';
import { getEnvCiReleaseDryRun } from '../../../helpers.private/release/env/get-env-ci-release-dry-run.ts';
import type { ReleaseMode } from '../../../helpers.private/release/release-mode/release-mode.ts';
import { releaseProject } from '../release-project/release-project.ts';

export interface CiReleaseOptions {
  readonly logger: Logger;
}

/**
 * Releases a package from the CI.
 */
export async function ciRelease({ logger }: CiReleaseOptions): Promise<void> {
  logger.debug('ci:release');

  loadOptionallyEnvFile(logger);

  const githubCiConfig: GithubCiConfig = getEnvGithubCiConfig();
  const ciReleaseContext: CiReleaseContext = inferCiReleaseContext(githubCiConfig);
  const dryRun: boolean = getEnvCiReleaseDryRun();
  // const jobUrl: string = `${githubCiConfig.server_url}/${githubCiConfig.repository}/actions/runs/${githubCiConfig.run_id}`;

  if (!ciReleaseContext.shouldRelease) {
    logger.info(
      `SKIP: CI release disabled for ${githubCiConfig.event_name}:${ciReleaseContext.branchName} (missing required PR label "dev").`,
    );
    return;
  }

  await releaseProject({
    mode: ciReleaseContext.mode,
    dry: dryRun,
    logger,
  });
}

/* INTERNAL */

interface CiReleaseContext {
  readonly branchName: string;
  readonly baseSha: string;
  readonly headSha: string;
  readonly mode: ReleaseMode;
  readonly shouldRelease: boolean;
}

function inferCiReleaseContext(githubCiConfig: GithubCiConfig): CiReleaseContext {
  let branchName: string;
  let baseSha: string;
  let headSha: string;
  let mode: ReleaseMode;
  let shouldRelease: boolean;

  if (githubCiConfig.event_name === 'pull_request') {
    branchName = verifyBranchTargetsMainOrDevelop(githubCiConfig.base_ref);
    baseSha = githubCiConfig.event.pull_request.base.sha;
    headSha = githubCiConfig.event.pull_request.head.sha;
    mode = 'dev';
    shouldRelease = githubCiConfig.event.pull_request.labels.some(
      (label: GithubCiLabel): boolean => {
        return label.name === 'dev';
      },
    );
  } else if (githubCiConfig.event_name === 'push') {
    branchName = verifyBranchTargetsMainOrDevelop(githubCiConfig.ref_name);
    baseSha = githubCiConfig.event.before;
    headSha = githubCiConfig.sha;
    mode = branchName === 'develop' ? 'rc' : 'prod';
    shouldRelease = true;
  } else {
    throw new Error(
      `Unsupported event "${githubCiConfig.event_name}". Expected "push" or "pull_request".`,
    );
  }

  return {
    branchName,
    baseSha,
    headSha,
    mode,
    shouldRelease,
  };
}

function verifyBranchTargetsMainOrDevelop(branchName: string): string {
  if (branchName !== 'main' && branchName !== 'develop') {
    throw new Error('`main` or `develop` expected as target branch.');
  }

  return branchName;
}
