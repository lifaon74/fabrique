import { describe, expect, it } from 'vitest';
import { parseOwnerRepoFromGitUrl } from './parse-owner-repo-from-git-url.ts';

describe('parseOwnerRepoFromGitUrl', () => {
  it('should parse a normalized https git url', () => {
    expect(parseOwnerRepoFromGitUrl('git+https://github.com/lifaon74/fabrique.git')).toBe(
      'lifaon74/fabrique',
    );
  });

  it('should parse a bare https url without the .git suffix', () => {
    expect(parseOwnerRepoFromGitUrl('https://github.com/owner/repo')).toBe('owner/repo');
  });

  it('should parse an scp-like ssh url', () => {
    expect(parseOwnerRepoFromGitUrl('git@github.com:owner/repo.git')).toBe('owner/repo');
  });

  it('should parse a non-github https url', () => {
    expect(parseOwnerRepoFromGitUrl('https://gitlab.com/owner/repo.git')).toBe('owner/repo');
  });

  it('should return undefined when the url has no owner/repo', () => {
    expect(parseOwnerRepoFromGitUrl('https://github.com/owner')).toBeUndefined();
  });

  it('should return undefined for a non-url string', () => {
    expect(parseOwnerRepoFromGitUrl('not a url')).toBeUndefined();
  });

  it('should return undefined for an empty string', () => {
    expect(parseOwnerRepoFromGitUrl('')).toBeUndefined();
  });
});
