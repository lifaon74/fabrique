import { type GithubRulesetPayload, TAG_RULES_RULESET_NAME } from '../github-ruleset.ts';

export interface BuildTagRulesetPayloadOptions {
  readonly pattern: string;
}

/**
 * Builds the payload of a ruleset protecting the release tags: no deletion, no force-push.
 */
export function buildTagRulesetPayload({
  pattern,
}: BuildTagRulesetPayloadOptions): GithubRulesetPayload {
  return {
    name: TAG_RULES_RULESET_NAME,
    target: 'tag',
    enforcement: 'active',
    bypass_actors: [],
    conditions: {
      ref_name: {
        include: [`refs/tags/${pattern}`],
        exclude: [],
      },
    },
    rules: [{ type: 'deletion' }, { type: 'non_fast_forward' }],
  };
}
