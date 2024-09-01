import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT_PATH = join(dirname(fileURLToPath(import.meta.url)), '../..');
export const TEMPLATES_PATH = join(ROOT_PATH, 'templates');

/**
 * Returns the template path from its name.
 *
 * @param {string} name
 * @return {string}
 */
export function getTemplatePath(name) {
  return join(TEMPLATES_PATH, name);
}
