import { describe, expect, it } from 'vitest';
import { addChangelogReleaseDates } from './add-changelog-release-dates.ts';

describe('addChangelogReleaseDates', () => {
  it('should date the version headings that have no date yet, leaving the others untouched', () => {
    const before: string = [
      '# fabrique',
      '',
      '## 2.1.0',
      '',
      '### Minor changes',
      '',
      '- Automated the release flow with Changesets.',
      '',
      '## 2.0.38 (2026-11-01)',
      '',
      '### Patch Changes',
      '',
      '- Fixed a crash.',
    ].join('\n');

    expect(addChangelogReleaseDates(before, '2026-11-23')).toBe(
      [
        '# fabrique',
        '',
        '## 2.1.0 (2026-11-23)',
        '',
        '### Minor changes',
        '',
        '- Automated the release flow with Changesets.',
        '',
        '## 2.0.38 (2026-11-01)',
        '',
        '### Patch Changes',
        '',
        '- Fixed a crash.',
      ].join('\n'),
    );
  });
});
