export interface RawLogger {
  (name: string, args: readonly any[]): void;
}
