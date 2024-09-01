import { writeFileSafe } from './write-file-safe.js';

/**
 * Write a json file.
 *
 * @param {string} path
 * @param {json} any
 * @return {Promise<void>}
 */
export function writeJsonFile(path, json) {
  return writeFileSafe(path, JSON.stringify(json, null, 2));
}
