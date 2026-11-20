import { describe, expect, it } from 'vitest';
import { quoteShellArgument } from './quote-shell-argument.ts';

describe('quoteShellArgument', () => {
  it('should quote arguments containing spaces', () => {
    expect(quoteShellArgument('C:\\Users\\John Doe\\Temp\\payload.json')).toBe(
      '"C:\\Users\\John Doe\\Temp\\payload.json"',
    );
  });

  it('should not quote arguments without spaces', () => {
    expect(quoteShellArgument('--input')).toBe('--input');
  });

  it('should not double-quote already quoted arguments', () => {
    expect(quoteShellArgument('"already quoted"')).toBe('"already quoted"');
  });
});
