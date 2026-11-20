import { execSync } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Logger } from '../../log/logger.ts';
import { gitAddPaths } from './git-add-paths.ts';

describe('gitAddPaths', () => {
  const logger: Logger = Logger.never();

  let repositoryDirectory: string;

  beforeEach(async () => {
    repositoryDirectory = await mkdtemp(join(tmpdir(), 'fabrique-git-add-paths-'));
    execSync('git init', { cwd: repositoryDirectory });
    execSync('git config user.email test@test.test', { cwd: repositoryDirectory });
    execSync('git config user.name test', { cwd: repositoryDirectory });
  });

  afterEach(async () => {
    await rm(repositoryDirectory, { recursive: true, force: true });
  });

  it('should stage the existing paths and skip the missing ones', async () => {
    await writeFile(join(repositoryDirectory, 'a.txt'), 'content');

    await gitAddPaths({ paths: ['a.txt', 'missing.txt'], cwd: repositoryDirectory, logger });

    const status: string = execSync('git status --porcelain', {
      cwd: repositoryDirectory,
    }).toString();
    expect(status).toContain('A  a.txt');
    expect(status).not.toContain('missing.txt');
  });

  it('should stage the deletions inside a staged directory', async () => {
    await mkdir(join(repositoryDirectory, '.changeset'), { recursive: true });
    await writeFile(join(repositoryDirectory, '.changeset', 'x.md'), 'content');
    execSync('git add -A', { cwd: repositoryDirectory });
    execSync('git commit -m "initial"', { cwd: repositoryDirectory });

    await rm(join(repositoryDirectory, '.changeset', 'x.md'));

    await gitAddPaths({ paths: ['.changeset'], cwd: repositoryDirectory, logger });

    const status: string = execSync('git status --porcelain', {
      cwd: repositoryDirectory,
    }).toString();
    expect(status).toContain('D  .changeset/x.md');
  });

  it('should skip staging when no path exists', async () => {
    await gitAddPaths({ paths: ['missing.txt'], cwd: repositoryDirectory, logger });

    const status: string = execSync('git status --porcelain', {
      cwd: repositoryDirectory,
    }).toString();
    expect(status).toBe('');
  });
});
