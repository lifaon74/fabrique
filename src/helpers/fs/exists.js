import { access, constants } from 'node:fs/promises';

export async function exists(path, mode = constants.R_OK) {
  try {
    await access(path, mode);
    return true;
  } catch {
    return false;
  }
}
