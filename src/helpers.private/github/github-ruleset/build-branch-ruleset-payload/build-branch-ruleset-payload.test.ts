import { describe, expect, it } from 'vitest';
import { BRANCH_RULES_RULESET_NAME, GITHUB_ACTIONS_APP_ID } from '../github-ruleset.ts';
import { buildBranchRulesetPayload } from './build-branch-ruleset-payload.ts';

describe('buildBranchRulesetPayload', () => {
  it('should build a payload protecting the branches with pull request, CI checks, deletion and force-push rules', () => {
    expect(
      buildBranchRulesetPayload({
        branches: ['main', 'develop'],
        requiredChecks: ['Check'],
        approvals: 0,
      }),
    ).toStrictEqual({
      name: BRANCH_RULES_RULESET_NAME,
      target: 'branch',
      enforcement: 'active',
      bypass_actors: [],
      conditions: {
        ref_name: {
          include: ['refs/heads/main', 'refs/heads/develop'],
          exclude: [],
        },
      },
      rules: [
        { type: 'deletion' },
        { type: 'non_fast_forward' },
        {
          type: 'pull_request',
          parameters: {
            required_approving_review_count: 0,
            dismiss_stale_reviews_on_push: false,
            require_code_owner_review: false,
            require_last_push_approval: false,
            required_review_thread_resolution: false,
          },
        },
        {
          type: 'required_status_checks',
          parameters: {
            strict_required_status_checks_policy: true,
            required_status_checks: [{ context: 'Check', integration_id: GITHUB_ACTIONS_APP_ID }],
          },
        },
      ],
    });
  });

  it('should support multiple required checks', () => {
    expect(
      buildBranchRulesetPayload({
        branches: ['main'],
        requiredChecks: ['Check', 'Release'],
        approvals: 0,
      }).rules[3],
    ).toStrictEqual({
      type: 'required_status_checks',
      parameters: {
        strict_required_status_checks_policy: true,
        required_status_checks: [
          { context: 'Check', integration_id: GITHUB_ACTIONS_APP_ID },
          { context: 'Release', integration_id: GITHUB_ACTIONS_APP_ID },
        ],
      },
    });
  });

  it('should require reviews and re-review on push when approvals are expected', () => {
    expect(
      buildBranchRulesetPayload({ branches: ['main'], requiredChecks: ['Check'], approvals: 1 })
        .rules[2],
    ).toStrictEqual({
      type: 'pull_request',
      parameters: {
        required_approving_review_count: 1,
        dismiss_stale_reviews_on_push: true,
        require_code_owner_review: false,
        require_last_push_approval: true,
        required_review_thread_resolution: false,
      },
    });
  });
});
