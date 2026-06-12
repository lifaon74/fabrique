import type { ReleaseMode } from './release-mode.ts';

export function releaseModeToNpmTag(mode: ReleaseMode): string {
  switch (mode) {
    case 'dev':
      return 'dev';
    case 'rc':
      return 'rc';
    case 'prod':
      return 'latest';
    default:
      throw new Error(`Invalid mode: ${mode}`);
  }
}
