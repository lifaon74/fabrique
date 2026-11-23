/**
 * The GitHub app id of GitHub Actions: required to declare a required check as a GitHub Actions check.
 */
export const GITHUB_ACTIONS_APP_ID = 15368;

export type GithubRulesetBypassActorType =
  'RepositoryRole' | 'Team' | 'Integration' | 'OrganizationAdmin' | 'DeployKey' | 'User';

export interface GithubRulesetBypassActor {
  /** The id of the actor, when the actor type has one (`null` for `DeployKey` and `OrganizationAdmin`). */
  readonly actor_id: number | null;
  readonly actor_type: GithubRulesetBypassActorType;
  readonly bypass_mode: 'always' | 'pull_request' | 'exempt';
}

/**
 * The name of the ruleset protecting the release branches (`main` and `develop`).
 * The name is used to identify the ruleset on updates: it must remain stable.
 */
export const BRANCH_RULES_RULESET_NAME = 'Fabrique: branch rules';

/**
 * The name of the ruleset protecting the release tags (`v*`).
 * The name is used to identify the ruleset on updates: it must remain stable.
 */
export const TAG_RULES_RULESET_NAME = 'Fabrique: tag rules';

export type GithubRulesetTarget = 'branch' | 'push' | 'tag';

export type GithubRulesetEnforcement = 'active' | 'evaluate' | 'disabled';

export type GithubRulesetRule =
  | { readonly type: 'deletion' }
  | { readonly type: 'non_fast_forward' }
  | {
      readonly type: 'pull_request';
      readonly parameters: {
        readonly required_approving_review_count: number;
        readonly dismiss_stale_reviews_on_push: boolean;
        readonly require_code_owner_review: boolean;
        readonly require_last_push_approval: boolean;
        readonly required_review_thread_resolution: boolean;
      };
    }
  | {
      readonly type: 'required_status_checks';
      readonly parameters: {
        readonly strict_required_status_checks_policy: boolean;
        readonly required_status_checks: readonly {
          readonly context: string;
          readonly integration_id: number;
        }[];
      };
    };

export interface GithubRulesetPayload {
  readonly name: string;
  readonly target: GithubRulesetTarget;
  readonly enforcement: GithubRulesetEnforcement;
  /**
   * The actors allowed to bypass the rules: a write deploy key, so the release workflow
   * can push the version bump commit to the protected release branches.
   */
  readonly bypass_actors: readonly GithubRulesetBypassActor[];
  readonly conditions: {
    readonly ref_name: {
      readonly include: readonly string[];
      readonly exclude: readonly string[];
    };
  };
  readonly rules: readonly GithubRulesetRule[];
}

export interface GithubRulesetSummary {
  readonly id: number;
  readonly name: string;
}
