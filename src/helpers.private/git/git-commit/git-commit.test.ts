import { execSync } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Logger } from '../../log/logger.ts';
import { gitCommit } from './git-commit.ts';

describe('gitCommit', () => {
  const logger: Logger = Logger.never();

  let repositoryDirectory: string;

  beforeEach(async () => {
    repositoryDirectory = await mkdtemp(join(tmpdir(), 'fabrique-git-commit-'));
    execSync('git init', { cwd: repositoryDirectory });
    execSync('git config user.email test@test.test', { cwd: repositoryDirectory });
    execSync('git config user.name test', { cwd: repositoryDirectory });
    execSync('git commit -m "initial" --allow-empty', { cwd: repositoryDirectory });
  });

  afterEach(async () => {
    await rm(repositoryDirectory, { recursive: true, force: true });
  });

  it('should return false when there is nothing to commit', async () => {
    const committed: boolean = await gitCommit({
      message: 'test: nothing to commit',
      cwd: repositoryDirectory,
      logger,
    });

    expect(committed).toBe(false);
  });

  it('should create a commit and return true', async () => {
    await writeFile(join(repositoryDirectory, 'a.txt'), 'content');
    execSync('git add -A', { cwd: repositoryDirectory });

    const committed: boolean = await gitCommit({
      message: 'test: commit',
      cwd: repositoryDirectory,
      logger,
    });

    const subject: string = execSync('git log -1 --format=%s', {
      cwd: repositoryDirectory,
    })
      .toString()
      .trim();

    expect(committed).toBe(true);
    expect(subject).toBe('test: commit');
  });
});
