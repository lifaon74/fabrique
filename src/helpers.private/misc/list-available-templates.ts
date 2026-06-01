import { readdir } from 'node:fs/promises';
import { TEMPLATES_DIRECTORY } from './paths.constant.ts';

/**
 * List the available templates.
 */
export function listAvailableTemplates(): Promise<readonly string[]> {
  return readdir(TEMPLATES_DIRECTORY);
}
