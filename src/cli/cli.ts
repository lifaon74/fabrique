#!/usr/bin/env node

import { program } from 'commander';
import pkg from '../../package.json' with { type: 'json' };
import { buildModeSchema } from '../helpers.private/build/build-mode/build-mode.schema.ts';
import type { BuildMode } from '../helpers.private/build/build-mode/build-mode.ts';
import { DEFAULT_LOG_LEVEL } from '../helpers.private/log/log-level/defaults/default-log-level.ts';
import { Logger } from '../helpers.private/log/logger.ts';
import { releaseModeSchema } from '../helpers.private/release/release-mode/release-mode.schema.ts';
import type { ReleaseMode } from '../helpers.private/release/release-mode/release-mode.ts';
import { buildProject } from './actions.private/build-project/build-project.ts';
import { ciRelease } from './actions.private/ci-release/ci-release.ts';
import { createProject } from './actions.private/create-project/create-project.ts';
import { refactor } from './actions.private/refactor/refactor.ts';
import { releaseProject } from './actions.private/release-project/release-project.ts';
import { upgradeProject } from './actions.private/upgrade-project/upgrade-project.ts';

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

// CMD: build
program
  .command('build')
  .description('builds a npm package')
  .option('--mode <mode>', 'build mode: dev, rc, prod', 'prod')
  .option('--cwd <cwd>', 'common working directory', process.cwd)
  .option('--output <output>', 'output directory', undefined)
  .action((options: { mode: BuildMode; cwd: string; output: string }): Promise<void> => {
    buildModeSchema.parse(options.mode);
    return buildProject({
      ...options,
      logger,
    });
  });

// CMD: release
program
  .command('release')
  .description('releases a npm package')
  .option('--mode <mode>', 'release mode: dev, rc, prod', 'prod')
  .option('--dry', 'runs without releasing the package', false)
  .option('--cwd <cwd>', 'common working directory', process.cwd)
  .option('--output <output>', 'output directory', undefined)
  .action(
    (options: { mode: ReleaseMode; dry: boolean; cwd: string; output: string }): Promise<void> => {
      releaseModeSchema.parse(options.mode);
      return releaseProject({
        ...options,
        logger,
      });
    },
  );

// CMD: ci:release
program
  .command('ci:release')
  .description('releases a package from the CI (e.g. GitHub Actions).')
  .action((): Promise<void> => {
    return ciRelease({
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
  .option('--cwd <cwd>', 'common working directory', process.cwd)
  .action((from: string, to: string, options: { dry: boolean; cwd: string }): Promise<void> => {
    return refactor({
      from,
      to,
      ...options,
    });
  });

program.parse();
