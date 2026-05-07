import { log } from './log.ts';

export function logError(error: unknown): void {
  log('error', Error.isError(error) ? error.message : String(error));
  console.log('\n----------------------------------\n');
  console.log(error);
}
