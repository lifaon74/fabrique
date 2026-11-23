import { describe, expect, it } from 'vitest';
import { stripChangelogRefs } from './strip-changelog-refs.ts';

describe('stripChangelogRefs', () => {
  it('should strip the pr, commit and author ref lines while keeping everything else', () => {
    const content: string = [
      '---',
      "'fabrique': minor",
      '---',
      '',
      'pr: #20',
      '',
      'Automated the release flow with Changesets.',
      '',
      'commit: c9bf0a2',
      'author: lifaon74',
      'Some details mentioning pr: in prose should stay.',
    ].join('\n');

    expect(stripChangelogRefs(content)).toBe(
      [
        '---',
        "'fabrique': minor",
        '---',
        '',
        '',
        '',
        'Automated the release flow with Changesets.',
        '',
        '',
        '',
        'Some details mentioning pr: in prose should stay.',
      ].join('\n'),
    );
  });
});
