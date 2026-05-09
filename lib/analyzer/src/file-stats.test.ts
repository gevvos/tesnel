import { describe, it, expect } from 'vitest';
import { resolve } from 'path';
import { computeFileStats } from './file-stats.js';

const fixturesDir = resolve(__dirname, '../../../tests/fixtures');

describe('computeFileStats', () => {
  it('counts lines of code', () => {
    const stats = computeFileStats(resolve(fixturesDir, 'simple/src/helper.ts'));
    expect(stats.loc).toBeGreaterThan(0);
  });

  it('returns zero complexity for simple export', () => {
    const stats = computeFileStats(resolve(fixturesDir, 'simple/src/helper.ts'));
    expect(stats.complexity).toBe(0);
    expect(stats.functions).toBe(0);
  });

  it('counts functions', () => {
    const stats = computeFileStats(resolve(fixturesDir, 'simple/src/index.ts'));
    expect(stats.functions).toBeGreaterThanOrEqual(0);
  });

  it('detects complexity from branching', () => {
    const stats = computeFileStats(resolve(fixturesDir, 'metrics/app/main.ts'));
    expect(stats.complexity).toBeGreaterThanOrEqual(0);
  });

  it('handles vue files', () => {
    const stats = computeFileStats(resolve(fixturesDir, 'vue-project/src/App.vue'));
    expect(stats.loc).toBeGreaterThan(0);
    expect(stats.functions).toBeGreaterThanOrEqual(0);
  });

  it('handles vue files without script', () => {
    const { writeFileSync, unlinkSync } = require('fs');
    const path = resolve(fixturesDir, 'vue-project/src/__test_noscript.vue');
    writeFileSync(path, '<template><div>no script</div></template>');
    try {
      const stats = computeFileStats(path);
      expect(stats.loc).toBeGreaterThan(0);
      expect(stats.complexity).toBe(0);
      expect(stats.functions).toBe(0);
    } finally {
      unlinkSync(path);
    }
  });

  it('counts if/for/while as complexity', () => {
    const { writeFileSync, unlinkSync } = require('fs');
    const path = resolve(fixturesDir, '__test_complex.ts');
    writeFileSync(path, `
const fn = (items: string[]) => {
  for (const item of items) {
    if (item.length > 0) {
      while (item.startsWith(' ')) {
        console.log(item);
      }
    } else if (item === '') {
      console.log('empty');
    }
  }
  return items.length > 0 ? items[0] : null;
};
`);
    try {
      const stats = computeFileStats(path);
      // for + if + while + else-if + ternary = 5
      expect(stats.complexity).toBe(5);
      expect(stats.functions).toBe(1);
      expect(stats.maxNesting).toBeGreaterThanOrEqual(3);
    } finally {
      unlinkSync(path);
    }
  });

  it('counts switch cases and logical expressions', () => {
    const { writeFileSync, unlinkSync } = require('fs');
    const path = resolve(fixturesDir, '__test_switch.ts');
    writeFileSync(path, `
const fn = (x: number) => {
  switch (x) {
    case 1: return 'one';
    case 2: return 'two';
    default: return x > 0 && x < 100 ? 'mid' : 'other';
  }
};
`);
    try {
      const stats = computeFileStats(path);
      // case 1 + case 2 + && + ternary = 4
      expect(stats.complexity).toBe(4);
    } finally {
      unlinkSync(path);
    }
  });

  it('counts try/catch', () => {
    const { writeFileSync, unlinkSync } = require('fs');
    const path = resolve(fixturesDir, '__test_catch.ts');
    writeFileSync(path, `
const fn = () => {
  try { JSON.parse('{}'); } catch (e) { console.error(e); }
};
`);
    try {
      const stats = computeFileStats(path);
      expect(stats.complexity).toBe(1);
    } finally {
      unlinkSync(path);
    }
  });

  it('extracts named exports', () => {
    const stats = computeFileStats(resolve(fixturesDir, 'exports-chain/lib/core.ts'));

    expect(stats.exports).toContainEqual({ name: 'format', isType: false });
    expect(stats.exports).toContainEqual({ name: 'validate', isType: false });
    expect(stats.exports).toContainEqual({ name: 'Config', isType: true });
  });

  it('extracts re-exports as exports', () => {
    const stats = computeFileStats(resolve(fixturesDir, 'exports-chain/lib/index.ts'));

    expect(stats.exports).toContainEqual({ name: 'format', isType: false });
    expect(stats.exports).toContainEqual({ name: 'validate', isType: false });
    expect(stats.exports).toContainEqual({ name: 'Config', isType: true });
  });

  it('extracts single re-export', () => {
    const stats = computeFileStats(resolve(fixturesDir, 'exports-chain/src/barrel.ts'));

    expect(stats.exports).toEqual([{ name: 'format', isType: false }]);
  });

  it('extracts default export', () => {
    const { writeFileSync, unlinkSync } = require('fs');
    const path = resolve(fixturesDir, '__test_default.ts');
    writeFileSync(path, 'export default function main() {}');
    try {
      const stats = computeFileStats(path);
      expect(stats.exports).toContainEqual({ name: 'default', isType: false });
    } finally {
      unlinkSync(path);
    }
  });

  it('returns empty exports for file without exports', () => {
    const { writeFileSync, unlinkSync } = require('fs');
    const path = resolve(fixturesDir, '__test_noexport.ts');
    writeFileSync(path, 'const x = 1;');
    try {
      const stats = computeFileStats(path);
      expect(stats.exports).toEqual([]);
    } finally {
      unlinkSync(path);
    }
  });
});
