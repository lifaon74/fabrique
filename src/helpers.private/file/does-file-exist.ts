import { access, constants } from 'node:fs/promises';

export async function doesFileExist(path: string, mode = constants.R_OK) {
  try {
    await access(path, mode);
    return true;
  } catch {
    return false;
  }
}
