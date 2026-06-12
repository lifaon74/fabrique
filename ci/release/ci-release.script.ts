import { releaseProject } from '../../src/cli/actions.private/release-project/release-project.ts';
import { loadOptionallyEnvFile } from '../../src/helpers.private/env/env-file/load-optionally-env-file.ts';
import { getEnvGithubCiConfig } from '../../src/helpers.private/github/github-ci-config/env/get-env-github-ci-config.ts';
import type { GithubCiConfig } from '../../src/helpers.private/github/github-ci-config/github-ci-config.ts';
import { DEFAULT_LOG_LEVEL } from '../../src/helpers.private/log/log-level/defaults/default-log-level.ts';
import { Logger } from '../../src/helpers.private/log/logger.ts';
import { getEnvCiReleaseDryRun } from '../../src/helpers.private/release/env/get-env-ci-release-dry-run.ts';
import {
  type CiReleaseContext,
  inferCiReleaseContext,
} from './src/context/infer-ci-release-context.ts';

const logger = Logger.root({ logLevel: DEFAULT_LOG_LEVEL });

export function ciReleaseScript(): Promise<void> {
  return logger.asyncTask('ci-release.script', async (logger: Logger): Promise<void> => {
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
  });
}

try {
  await ciReleaseScript();
} catch (error: unknown) {
  logger.fatal(error);
}
