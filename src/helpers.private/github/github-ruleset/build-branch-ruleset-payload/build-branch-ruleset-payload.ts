import {
  BRANCH_RULES_RULESET_NAME,
  GITHUB_ACTIONS_APP_ID,
  type GithubRulesetPayload,
} from '../github-ruleset.ts';

export interface BuildBranchRulesetPayloadOptions {
  readonly branches: readonly string[];
  readonly requiredChecks: readonly string[];
  readonly approvals: number;
}

/**
 * Builds the payload of a ruleset protecting the release branches:
 * no direct push (a pull request is required), no force-push, no deletion,
 * and the required CI checks must pass with an up-to-date branch.
 */
export function buildBranchRulesetPayload({
  branches,
  requiredChecks,
  approvals,
}: BuildBranchRulesetPayloadOptions): GithubRulesetPayload {
  return {
    name: BRANCH_RULES_RULESET_NAME,
    target: 'branch',
    enforcement: 'active',
    bypass_actors: [],
    conditions: {
      ref_name: {
        include: branches.map((branch: string): string => `refs/heads/${branch}`),
        exclude: [],
      },
    },
    rules: [
      { type: 'deletion' },
      { type: 'non_fast_forward' },
      {
        type: 'pull_request',
        parameters: {
          required_approving_review_count: approvals,
          dismiss_stale_reviews_on_push: approvals > 0,
          require_code_owner_review: false,
          require_last_push_approval: approvals > 0,
          required_review_thread_resolution: false,
        },
      },
      {
        type: 'required_status_checks',
        parameters: {
          strict_required_status_checks_policy: true,
          required_status_checks: requiredChecks.map(
            (checkName: string): { readonly context: string; readonly integration_id: number } => ({
              context: checkName,
              integration_id: GITHUB_ACTIONS_APP_ID,
            }),
          ),
        },
      },
    ],
  };
}
