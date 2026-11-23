export function parseOwnerRepoFromGitUrl(input: string): string | undefined {
  const trimmedInput: string = input.trim();

  // scp-like syntax (git@github.com:owner/repo.git) is not parsable by the URL constructor:
  // only the owner/repo path matters, a placeholder host is enough
  const scpLikeMatch: RegExpMatchArray | null = trimmedInput.match(/^git@[^:]+:(.+)$/);
  const candidate: string =
    scpLikeMatch !== null
      ? `https://placeholder/${scpLikeMatch[1]}`
      : trimmedInput.includes('://')
        ? trimmedInput
        : `https://${trimmedInput}`;

  try {
    const url: URL = new URL(candidate);

    const [owner, repository]: readonly (string | undefined)[] = url.pathname
      .split('/')
      .filter((segment: string): boolean => segment.length > 0)
      .slice(0, 2);

    if (owner === undefined || repository === undefined) {
      return undefined;
    }

    return `${owner}/${repository.replace(/\.git$/, '')}`;
  } catch {
    return undefined;
  }
}
