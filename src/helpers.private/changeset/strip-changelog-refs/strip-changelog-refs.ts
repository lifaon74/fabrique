const CHANGELOG_REF_LINE: RegExp = /^ *(?:pr|pull|pull\s+request|commit|author|user):.*$/gim;

/**
 * Strips the changelog ref lines (`pr:`, `pull:`, `pull request:`, `commit:`, `author:`,
 * `user:` — case-insensitive, mirroring the changelog generator's own ref grammar) from a
 * changeset content: without a `GITHUB_TOKEN`, the changelog generator would try to resolve
 * them through the GitHub API and fail the whole changeset consumption. The stripped copies
 * produce a link-less changelog instead.
 */
export function stripChangelogRefs(content: string): string {
  return content.replace(CHANGELOG_REF_LINE, '');
}
