#!/usr/bin/env node

import { program } from 'commander';
import pkg from '../../package.json' with { type: 'json' };
import { DEFAULT_LOG_LEVEL } from '../helpers/log/log-level/defaults/default-log-level.ts';
import { Logger } from '../helpers/log/logger.ts';
import { createProject } from './actions/create-project/create-project.ts';
import { refactor } from './actions/refactor/refactor.ts';
import { upgradeProject } from './actions/upgrade-project/upgrade-project.ts';

// tuto: https://medium.com/nmc-techblog/building-a-cli-with-node-js-in-2024-c278802a3ef5

const logger = Logger.root({ logLevel: DEFAULT_LOG_LEVEL });

program.name('fabrique').description('CLI to build typescript libraries.').version(pkg.version);

// CMD: create <type> <name>
program
  .command('create')
  .description('create a new library')
  .argument('<type>', 'type')
  .argument('<name>', 'name')
  .action((type: string, name: string): Promise<void> => {
    return createProject({
      type,
      name,
      logger,
    });
  });

// CMD: upgrade
program
  .command('upgrade')
  .description('upgrade an existing library')
  .option('--force', 'forces the update', false)
  .action((options: { force: boolean }): Promise<void> => {
    return upgradeProject({
      ...options,
      logger,
    });
  });

// CMD: refactor <from> <to>
program
  .command('refactor')
  .description('refactor recursively many files')
  .argument('<from>', 'from')
  .argument('<to>', 'to')
  .option('--dry', 'runs without modifying the files', false)
  .option('--cwd', 'common working directory', process.cwd)
  .action((from: string, to: string, options: { dry: boolean; cwd: string }): Promise<void> => {
    return refactor({
      from,
      to,
      ...options,
    });
  });

program.parse();
