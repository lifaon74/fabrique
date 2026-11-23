import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import process from 'node:process';

const IGNORED_FILES: readonly string[] = ['AGENTS.md', 'CLAUDE.md', 'GEMINI.md'];

export interface ListPendingChangesetsOptions {
  readonly cwd?: string;
}

/**
 * Lists the pending changeset file names of the `.changeset` directory. Returns an empty
 * array when the directory does not exist.
 */
export async function listPendingChangesets({
  cwd = process.cwd(),
}: ListPendingChangesetsOptions): Promise<readonly string[]> {
  let entries: readonly string[];

  try {
    entries = await readdir(join(cwd, '.changeset'));
  } catch {
    return [];
  }

  return entries
    .filter(
      (entry: string): boolean =>
        entry.toLowerCase() !== 'readme.md' &&
        !IGNORED_FILES.includes(entry) &&
        entry.endsWith('.md'),
    )
    .sort();
}
