import { describe, expect, expectTypeOf, it } from 'vitest';
import { removeUndefinedProperties } from './remove-undefined-properties.ts';

describe('removeUndefinedProperties', () => {
  it('should remove properties with an undefined value', () => {
    expect(removeUndefinedProperties({ a: 1, b: undefined, c: 'c' })).toStrictEqual({
      a: 1,
      c: 'c',
    });
  });

  it('should keep falsy values which are not undefined', () => {
    expect(removeUndefinedProperties({ a: null, b: 0, c: '', d: false })).toStrictEqual({
      a: null,
      b: 0,
      c: '',
      d: false,
    });
  });

  it('should not mutate the input object', () => {
    const input: { a: number; b?: number } = { a: 1, b: undefined };
    const result = removeUndefinedProperties(input);
    expect(result).not.toBe(input);
    expect('b' in input).toBe(true);
    expect(input.b).toBeUndefined();
  });

  it('should not remove undefined properties from nested objects', () => {
    expect(removeUndefinedProperties({ a: { b: undefined, c: 1 } })).toStrictEqual({
      a: { b: undefined, c: 1 },
    });
  });

  it('should remove properties typed as undefined from the resulting type', () => {
    const result = removeUndefinedProperties({ a: 'a', b: undefined, c: 2 as number | undefined });
    expectTypeOf(result).toEqualTypeOf<{ a: string; c: number | undefined }>();
  });
});
