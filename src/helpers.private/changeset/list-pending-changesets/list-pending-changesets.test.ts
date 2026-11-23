import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { listPendingChangesets } from './list-pending-changesets.ts';

describe('listPendingChangesets', () => {
  let directory: string;

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'fabrique-list-pending-changesets-'));
  });

  afterEach(async () => {
    await rm(directory, { recursive: true, force: true });
  });

  it('should return an empty array when the .changeset directory does not exist', async () => {
    expect(await listPendingChangesets({ cwd: directory })).toStrictEqual([]);
  });

  it('should list the pending changesets, sorted, excluding non-changeset files', async () => {
    await mkdir(join(directory, '.changeset'), { recursive: true });
    await writeFile(join(directory, '.changeset', 'config.json'), '');
    await writeFile(join(directory, '.changeset', 'README.md'), '');
    await writeFile(join(directory, '.changeset', 'readme.md'), '');
    await writeFile(join(directory, '.changeset', 'AGENTS.md'), '');
    await writeFile(join(directory, '.changeset', 'CLAUDE.md'), '');
    await writeFile(join(directory, '.changeset', 'GEMINI.md'), '');
    await writeFile(join(directory, '.changeset', 'notes.txt'), '');
    await writeFile(join(directory, '.changeset', 'fix-crash.md'), '');
    await writeFile(join(directory, '.changeset', 'add-dark-mode.md'), '');

    expect(await listPendingChangesets({ cwd: directory })).toStrictEqual([
      'add-dark-mode.md',
      'fix-crash.md',
    ]);
  });
});
