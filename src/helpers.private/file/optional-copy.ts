import { cp } from 'node:fs/promises';

export async function optionalCopy(...args: Parameters<typeof cp>): Promise<boolean> {
  try {
    await cp(...args);
    return true;
  } catch {
    return false;
  }
}
