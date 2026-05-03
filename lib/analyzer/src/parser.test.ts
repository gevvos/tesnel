import { describe, it, expect } from 'vitest';
import { resolve } from 'path';
import { parseFile, parseSource } from './parser';

const fixture = (...parts: string[]) =>
  resolve(__dirname, '../../../tests/fixtures', ...parts);

describe('parseFile', () => {
  it('extracts import dependencies', () => {
    const result = parseFile(fixture('simple/src/index.ts'));

    expect(result.name).toBe('index.ts');
    expect(result.imports).toEqual(['./helper', './utils']);
    expect(result.reExports).toEqual([]);
    expect(result.errors).toEqual([]);
  });

  it('returns empty imports for leaf files', () => {
    const result = parseFile(fixture('simple/src/helper.ts'));

    expect(result.imports).toEqual([]);
    expect(result.reExports).toEqual([]);
  });

  it('handles files with single import', () => {
    const result = parseFile(fixture('simple/src/utils.ts'));

    expect(result.imports).toEqual(['./helper']);
  });
});

describe('parseSource', () => {
  it('extracts re-exports', () => {
    const result = parseSource('index.ts', `
      export { foo } from './foo';
      export * from './bar';
    `);

    expect(result.imports).toEqual([]);
    expect(result.reExports).toEqual(['./foo', './bar']);
  });

  it('handles mixed imports and re-exports', () => {
    const result = parseSource('index.ts', `
      import { a } from './a';
      export { b } from './b';
    `);

    expect(result.imports).toEqual(['./a']);
    expect(result.reExports).toEqual(['./b']);
  });

  it('returns errors for invalid syntax without throwing', () => {
    const result = parseSource('bad.ts', 'const x = {{{');

    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.imports).toEqual([]);
    expect(result.reExports).toEqual([]);
  });

  it('separates type-only imports from runtime imports', () => {
    const result = parseSource('index.ts', `
      import type { Foo } from './foo';
      import { bar } from './bar';
      import { type Baz, qux } from './baz';
    `);

    expect(result.typeImports).toEqual(['./foo']);
    expect(result.imports).toEqual(['./bar', './baz']);
  });
});
