import { log } from './log.js';

export function logError(error) {
  log('error', error.message);
  console.log('\n----------------------------------\n');
  console.log(error);
}
