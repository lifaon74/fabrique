const CHANGELOG_REF_LINE: RegExp = /^ *(?:pr|commit|author):.*$/gm;

/**
 * Strips the changelog ref lines (`pr:`, `commit:`, `author:`) from a changeset content:
 * without a `GITHUB_TOKEN`, the changelog generator would try to resolve them through the
 * GitHub API and fail the whole changeset consumption. The stripped copies produce a
 * link-less changelog instead.
 */
export function stripChangelogRefs(content: string): string {
  return content.replace(CHANGELOG_REF_LINE, '');
}
