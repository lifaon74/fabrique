import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { execCommand } from '../../../cmd/exec-command.ts';
import type { Logger } from '../../../log/logger.ts';

export interface GenerateKeyPairOptions {
  /** The directory where the key pair is written. It must already exist. */
  readonly directory: string;
  /** The key file basename, e.g. `id_ed25519`. */
  readonly name: string;
  readonly comment: string;
  readonly logger: Logger;
}

export interface KeyPair {
  readonly privateKeyPath: string;
  /** The single-line OpenSSH public key, with the trailing newline trimmed. */
  readonly publicKey: string;
}

/**
 * Generates an ed25519 SSH key pair with an empty passphrase, using `ssh-keygen`.
 * Nothing sensitive is logged: the passphrase is empty and the private key is written
 * to the file, not to the command output.
 */
export async function generateKeyPair({
  directory,
  name,
  comment,
  logger,
}: GenerateKeyPairOptions): Promise<KeyPair> {
  const privateKeyPath: string = join(directory, name);

  await execCommand(logger, 'ssh-keygen', [
    '-t',
    'ed25519',
    '-N',
    '',
    '-C',
    comment,
    '-f',
    privateKeyPath,
    '-q',
  ]);

  return {
    privateKeyPath,
    publicKey: (await readFile(`${privateKeyPath}.pub`, 'utf8')).trimEnd(),
  };
}
