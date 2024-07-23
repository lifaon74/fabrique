/**
 * Replaces some patterns (`{{name}}`) into content.
 *
 * @param {string} content
 * @param {Record<string, string>} values
 * @return {string}
 */
export function replacePattern(content, values) {
  return content.replace(/\{\{(\w+)\}\}/g, (_, pattern) => {
    if (Object.hasOwn(values, pattern)) {
      return values[pattern];
    } else {
      throw new Error(`Unknown pattern ${JSON.stringify(pattern)}.`);
    }
  });
}
