import chalk from 'chalk';

/**
 * @param {'none' | 'error' | 'warn' | 'success'} type
 * @param {string} message
 */
export function log(type, message) {
  if (type === 'none') {
    console.log(message);
  } else {
    let color;
    switch (type) {
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
