import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT_PATH = join(dirname(fileURLToPath(import.meta.url)), '../../..');
export const TEMPLATES_PATH = join(ROOT_PATH, 'templates');

/**
 * Returns the template path from its name.
 */
export function getTemplateDirectoryPath(name: string): string {
  return join(TEMPLATES_PATH, name);
}
