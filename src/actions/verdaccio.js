import { cmd } from '../helpers/cmd.js';

/**
 * Lanches verdaccio
 */
export async function verdaccio() {
  /*
    import { dirname } from 'node:path';
    import { fileURLToPath } from 'node:url';
    const cwd = dirname(fileURLToPath(import.meta.url));
   */
  // lsof -i tcp:4873 | awk '/4873/{print $2}' | xargs kill

  try {
    await cmd('verdaccio', ['--listen', '0.0.0.0:4873']);
  } catch {
    await cmd('npm', ['install', '--global', 'verdaccio']);
    await cmd('verdaccio', ['--listen', '0.0.0.0:4873']);
  }
}
