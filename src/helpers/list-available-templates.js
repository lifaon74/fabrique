import { readdir } from 'node:fs/promises';
import { TEMPLATES_PATH } from './paths.constant.js';

/**
 * List the available templates.
 *
 * @return {Promise<string[]>}
 */
export function listAvailableTemplates() {
  return readdir(TEMPLATES_PATH);
}
