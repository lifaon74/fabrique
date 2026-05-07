import chalk from 'chalk';

export type LogType = 'none' | 'info' | 'debug' | 'warn' | 'error' | 'success';

/**
 * Logs a message.
 * @deprecated
 */
export function log(type: LogType, message: string) {
  if (type === 'none') {
    console.log(message);
  } else {
    let color;
    switch (type) {
      case 'info':
        color = chalk.cyanBright;
        break;
      case 'debug':
        color = chalk.magentaBright;
        break;
      case 'warn':
        color = chalk.yellowBright;
        break;
      case 'error':
        color = chalk.redBright;
        break;
      case 'success':
        color = chalk.greenBright;
        break;
      default:
        throw new Error('Invalid type');
    }

    console.log(color(`${chalk.bold(`[${type.toUpperCase()}]:`)} ${message}`));
  }
}
