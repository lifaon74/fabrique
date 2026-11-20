import { describe, expect, it } from 'vitest';
import { TAG_RULES_RULESET_NAME } from '../github-ruleset.ts';
import { buildTagRulesetPayload } from './build-tag-ruleset-payload.ts';

describe('buildTagRulesetPayload', () => {
  it('should build a payload protecting the tags with deletion and force-push rules', () => {
    expect(buildTagRulesetPayload({ pattern: 'v*' })).toStrictEqual({
      name: TAG_RULES_RULESET_NAME,
      target: 'tag',
      enforcement: 'active',
      bypass_actors: [],
      conditions: {
        ref_name: {
          include: ['refs/tags/v*'],
          exclude: [],
        },
      },
      rules: [{ type: 'deletion' }, { type: 'non_fast_forward' }],
    });
  });

  it('should support any tag pattern', () => {
    const payload = buildTagRulesetPayload({ pattern: 'release-*' });

    expect(payload.conditions.ref_name.include).toStrictEqual(['refs/tags/release-*']);
  });
});
