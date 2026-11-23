const UNDATED_VERSION_HEADING: RegExp = /^## (\S+)$/gm;

/**
 * Adds the release date to every version heading of a generated changelog that has no
 * date yet (e.g. `## 2.1.0` becomes `## 2.1.0 (2026-11-23)`). Headings that already
 * carry a date are left untouched, so the transform is idempotent.
 */
export function addChangelogReleaseDates(content: string, date: string): string {
  return content.replace(UNDATED_VERSION_HEADING, `## $1 (${date})`);
}
