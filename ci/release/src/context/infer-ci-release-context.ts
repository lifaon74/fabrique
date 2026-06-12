import type {
  GithubCiConfig,
  GithubCiLabel,
} from '../../../../src/helpers.private/github/github-ci-config/github-ci-config.ts';
import type { ReleaseMode } from '../../../../src/helpers.private/release/release-mode/release-mode.ts';

export interface CiReleaseContext {
  readonly branchName: string;
  readonly baseSha: string;
  readonly headSha: string;
  readonly mode: ReleaseMode;
  readonly shouldRelease: boolean;
}

export function inferCiReleaseContext(githubCiConfig: GithubCiConfig): CiReleaseContext {
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

/* INTERNAL */

function verifyBranchTargetsMainOrDevelop(branchName: string): string {
  if (branchName !== 'main' && branchName !== 'develop') {
    throw new Error('`main` or `develop` expected as target branch.');
  }

  return branchName;
}
