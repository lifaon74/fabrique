import { ansiEscapeGraphicModeString } from '../ansi/ansi.ts';
import { type RawLogger } from './raw-logger.ts';

export function ansiRawLogger(...parameters: string[]): RawLogger {
  return (name: string, args: readonly any[]): void => {
    console.log(ansiEscapeGraphicModeString(`[${name}]`, ...parameters), ...args);
  };
}
