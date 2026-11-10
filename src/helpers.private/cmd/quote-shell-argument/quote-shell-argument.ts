/**
 * Quotes a command argument so that it survives being passed through a shell (ex: Windows `cmd.exe`
 * when `spawn` is used with `shell: true`): without quotes, an argument containing spaces is split
 * into multiple arguments by the shell.
 *
 * Only spaces are handled: other shell metacharacters are left untouched.
 */
export function quoteShellArgument(argument: string): string {
  return argument.includes(' ') && !argument.startsWith('"') ? `"${argument}"` : argument;
}
