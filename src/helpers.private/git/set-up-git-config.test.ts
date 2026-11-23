import { execSync } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Logger } from '../log/logger.ts';
import { setUpGitConfig } from './set-up-git-config.ts';

describe('setUpGitConfig', () => {
  const logger: Logger = Logger.never();

  let repositoryDirectory: string;

  beforeEach(async () => {
    repositoryDirectory = await mkdtemp(join(tmpdir(), 'fabrique-set-up-git-config-'));
    execSync('git init', { cwd: repositoryDirectory });
  });

  afterEach(async () => {
    await rm(repositoryDirectory, { recursive: true, force: true });
  });

  it('should default to the github-actions[bot] identity', async () => {
    await setUpGitConfig({ cwd: repositoryDirectory, logger });

    const userName: string = execSync('git config user.name', { cwd: repositoryDirectory })
      .toString()
      .trim();
    const userEmail: string = execSync('git config user.email', { cwd: repositoryDirectory })
      .toString()
      .trim();

    expect(userName).toBe('github-actions[bot]');
    expect(userEmail).toBe('41898282+github-actions[bot]@users.noreply.github.com');
  });
});
