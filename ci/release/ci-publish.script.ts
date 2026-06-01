import { loadOptionallyEnvFile } from '../../src/helpers.private/env/env-file/load-optionally-env-file.ts';
import { getEnvGithubCiConfig } from '../../src/helpers.private/github/github-ci-config/env/get-env-github-ci-config.ts';
import type { GithubCiConfig } from '../../src/helpers.private/github/github-ci-config/github-ci-config.ts';
import { DEFAULT_LOG_LEVEL } from '../../src/helpers.private/log/log-level/defaults/default-log-level.ts';
import { Logger } from '../../src/helpers.private/log/logger.ts';
import { ROOT_DIRECTORY } from '../../src/helpers.private/misc/paths.constant.ts';
import { getEnvCiReleaseDryRun } from '../../src/helpers.private/release/env/get-env-ci-release-dry-run.ts';
import { ciPublish } from './src/ci-publish.ts';
import {
  type CiPublishContext,
  inferCiPublishContext,
} from './src/context/infer-ci-publish-context.ts';

const logger = Logger.root({ logLevel: DEFAULT_LOG_LEVEL });

export function ciPublishScript(): Promise<void> {
  return logger.asyncTask('ci-publish.script', async (logger: Logger): Promise<void> => {
    loadOptionallyEnvFile(logger);

    const githubCiConfig: GithubCiConfig = getEnvGithubCiConfig();
    const ciPublishContext: CiPublishContext = inferCiPublishContext(githubCiConfig);
    const dryRun: boolean = getEnvCiReleaseDryRun();
    const jobUrl: string = `${githubCiConfig.server_url}/${githubCiConfig.repository}/actions/runs/${githubCiConfig.run_id}`;

    if (!ciPublishContext.shouldPublish) {
      logger.info(
        `SKIP: CI publish disabled for ${githubCiConfig.event_name}:${ciPublishContext.branchName} (missing required PR label "dev").`,
      );
      return;
    }

    await ciPublish({
      ...ciPublishContext,
      rootDirectory: ROOT_DIRECTORY,
      dryRun,
      jobUrl,
      logger,
    });
  });
}

try {
  await ciPublishScript();
} catch (error: unknown) {
  logger.fatal(error);
}
