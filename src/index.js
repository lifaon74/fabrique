#!/usr/bin/env node

import { program } from 'commander';
import { create } from './actions/create.js';
import { refactor } from './actions/refactor.js';
import { upgrade } from './actions/upgrade.js';
import { verdaccio } from './actions/verdaccio.js';
import { handleError } from './helpers/handle-error.js';

// tuto: https://medium.com/nmc-techblog/building-a-cli-with-node-js-in-2024-c278802a3ef5

program.name('fabrique').description('CLI to build typescript libraries.').version('0.0.1');

// CMD: create <type> <name>
program
  .command('create')
  .description('create a new library')
  .argument('<type>', 'type')
  .argument('<name>', 'name')
  .action(handleError(create));

// CMD: upgrade
program
  .command('upgrade')
  .description('upgrade an existing library')
  .option('--force', 'forces the update', false)
  .action(handleError(upgrade));

// CMD: refactor <from> <to>
program
  .command('refactor')
  .description('refactor recursively many files')
  .argument('<from>', 'from')
  .argument('<to>', 'to')
  .option('--dry', 'runs without modifying the files', false)
  .option('--cwd', 'common working directory', process.cwd)
  .action(handleError(refactor));

// CMD: verdaccio
program.command('verdaccio').description('lanches verdaccio').action(handleError(verdaccio));

program.parse();
