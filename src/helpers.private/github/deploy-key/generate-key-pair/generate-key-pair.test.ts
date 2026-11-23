import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Logger } from '../../../log/logger.ts';
import { generateKeyPair, type KeyPair } from './generate-key-pair.ts';

describe('generateKeyPair', () => {
  let directory: string;

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'fabrique-generate-key-pair-'));
  });

  afterEach(async () => {
    await rm(directory, { recursive: true, force: true });
  });

  it('should generate an ed25519 key pair with a single-line public key and an OpenSSH private key', async () => {
    const logger: Logger = Logger.never();

    const keyPair: KeyPair = await generateKeyPair({
      directory,
      name: 'id_ed25519',
      comment: 'fabrique-release',
      logger,
    });

    expect(keyPair.privateKeyPath).toBe(join(directory, 'id_ed25519'));
    expect(keyPair.publicKey).toMatch(/^ssh-ed25519 [A-Za-z0-9+/]+=* fabrique-release$/);
    expect(await readFile(keyPair.privateKeyPath, 'utf8')).toMatch(
      /^-----BEGIN OPENSSH PRIVATE KEY-----/,
    );
  });
});
