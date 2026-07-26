export interface Semver {
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
  readonly prerelease: string | undefined;
  readonly build: string | undefined;
}

export function parseSemver(input: string): Semver | null {
  // https://semver.org/#is-there-a-suggested-regular-expression-regex-to-check-a-semver-string
  const match: RegExpMatchArray | null = input.match(
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/,
  );

  if (match === null) {
    return null;
  }

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4],
    build: match[5],
  };
}

export function parseSemverStrict(input: string): Semver {
  const semver: Semver | null = parseSemver(input);

  if (semver === null) {
    throw new Error('Invalid semver');
  }

  return semver;
}
