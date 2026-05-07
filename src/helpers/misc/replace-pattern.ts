/**
 * Replaces some patterns (`{{name}}`) into content.
 */
export function replacePattern(content: string, values: Record<string, string>): string {
  return content.replace(/\{\{(\w+)\}\}/g, (_: string, pattern: string): string => {
    if (Object.hasOwn(values, pattern)) {
      return values[pattern];
    } else {
      throw new Error(`Unknown pattern ${JSON.stringify(pattern)}.`);
    }
  });
}
