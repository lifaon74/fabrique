/**
 * Transform a git url into a valid one for a package.json.
 */
export function normalizeGitUrlForNpm(input: string): string {
  const gitUrl = new URL(input);

  if (!gitUrl.pathname.endsWith('.git')) {
    input = `${input}.git`;
  }

  if (!gitUrl.protocol.startsWith('git+')) {
    input = `git+${input}`;
  }

  return input;
}
