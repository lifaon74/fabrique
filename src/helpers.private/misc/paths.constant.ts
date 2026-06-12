import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT_DIRECTORY: string = join(dirname(fileURLToPath(import.meta.url)), '../../..');

export const TEMPLATES_DIRECTORY: string = join(ROOT_DIRECTORY, 'static/templates');

/**
 * Returns the template path from its name.
 */
export function getTemplateDirectoryPath(name: string): string {
  return join(TEMPLATES_DIRECTORY, name);
}
