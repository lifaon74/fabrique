import { type ChildProcess, spawn, type SpawnOptions } from 'node:child_process';
import process from 'node:process';
import { Readable } from 'node:stream';
import { Logger } from '../log/logger.ts';
import { quoteShellArgument } from './quote-shell-argument/quote-shell-argument.ts';

export interface ExecCommandErrorOptions extends ErrorOptions {
  readonly command: string;
  readonly stderr?: string;
  readonly exitCode: number; // -1 if aborted
  readonly message?: string;
}

export class ExecCommandError extends Error {
  readonly command: string;
  readonly stderr: string;
  readonly exitCode: number; // -1 if aborted

  constructor({
    command,
    stderr = '',
    exitCode,
    message = `Command [ ${command} ] failed:${stderr === '' ? ` ${exitCode === -1 ? 'aborted' : `exit with code ${exitCode}`}` : `\n${stderr}`}`,
    ...options
  }: ExecCommandErrorOptions) {
    super(message, options);
    this.command = command;
    this.stderr = stderr;
    this.exitCode = exitCode;
  }
}

export function execCommand(
  logger: Logger,
  command: string,
  args: string[] = [],
  options?: SpawnOptions,
): Promise<string> {
  return new Promise<string>(
    (resolve: (output: string) => void, reject: (reason?: unknown) => void): void => {
      const shell: boolean | string = options?.shell ?? process.platform === 'win32';

      // when a shell is used, the command and its arguments are joined into a single command line
      // and parsed by the shell: arguments containing spaces must be quoted
      const quotedArgs: readonly string[] = shell ? args.map(quoteShellArgument) : args;

      const fullCommand: string = `${command} ${quotedArgs.join(' ')}`;

      logger.log(fullCommand);

      const childProcess: ChildProcess = spawn(command, [...quotedArgs], {
        cwd: process.cwd(),
        shell,
        detached: false,
        stdio: 'pipe',
        ...options,
      });

      const getStreamOutput = (stream: Readable): Promise<string> => {
        return stream.toArray().then((lines: readonly any[]): string => {
          return lines
            .map((line: any): string => {
              return line.toString();
            })
            .join('\n');
        });
      };

      childProcess.on('exit', (exitCode: number | null): void => {
        if (exitCode === null) {
          exitCode = -1;
        }

        if (exitCode === 0) {
          if (childProcess.stdout === null) {
            resolve('');
          } else {
            getStreamOutput(childProcess.stdout).then(resolve, reject);
          }
        } else {
          if (childProcess.stderr === null) {
            reject(new ExecCommandError({ command, exitCode }));
          } else {
            getStreamOutput(childProcess.stderr).then(
              (stderr: string) => reject(new ExecCommandError({ command, exitCode, stderr })),
              reject,
            );
          }
        }
      });

      childProcess.on('error', (err: Error): void => {
        reject(err);
      });

      // process.on('SIGINT', () => {
      //   childProcess.kill('SIGINT');
      // });
      //
      // process.on('SIGTERM', () => {
      //   childProcess.kill('SIGTERM');
      // });
      //
      // process.on('SIGBREAK', () => {
      //   childProcess.kill('SIGBREAK');
      // });
    },
  );
}

export function execCommandInherit(
  logger: Logger,
  command: string,
  args: string[] = [],
  options?: SpawnOptions,
): Promise<string> {
  return execCommand(logger, command, args, {
    stdio: 'inherit',
    ...options,
  });
}
