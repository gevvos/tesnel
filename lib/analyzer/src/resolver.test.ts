import { describe, it, expect } from 'vitest';
import { resolve } from 'path';
import { resolveFilePath } from './resolver.js';

const fixtureDir = resolve(__dirname, '../../../tests/fixtures/simple/src');

describe('resolveFilePath', () => {
  it('resolves relative TypeScript imports', () => {
    const result = resolveFilePath(fixtureDir, './helper');

    expect(result.path).toBe(resolve(fixtureDir, 'helper.ts'));
  });

  it('resolves with explicit extension', () => {
    const result = resolveFilePath(fixtureDir, './helper.ts');

    expect(result.path).toBe(resolve(fixtureDir, 'helper.ts'));
  });

  it('returns undefined path for non-existent files', () => {
    const result = resolveFilePath(fixtureDir, './nonexistent');

    expect(result.path).toBeUndefined();
  });
});
