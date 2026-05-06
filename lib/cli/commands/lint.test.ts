import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { resolve } from 'path';
import { lintCommand } from './lint.js';

const fixturesDir = resolve(__dirname, '../../../tests/fixtures');

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('lintCommand', () => {
  it('exits cleanly when no cycles found', () => {
    lintCommand(resolve(fixturesDir, 'simple/src/index.ts'), {});

    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('No circular dependencies found'),
    );
  });

  it('exits with code 1 when cycles found', () => {
    const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit');
    });

    expect(() => {
      lintCommand(resolve(fixturesDir, 'circular/src/a.ts'), {});
    }).toThrow('process.exit');

    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('prints cycle details to stderr', () => {
    vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit');
    });

    try {
      lintCommand(resolve(fixturesDir, 'circular/src/a.ts'), {});
    } catch {}

    const errorOutput = (console.error as ReturnType<typeof vi.fn>).mock.calls
      .map(c => c[0])
      .join('\n');
    expect(errorOutput).toContain('→');
    expect(errorOutput).toContain('1 circular dependency');
  });

  it('works with directory entry', () => {
    lintCommand(resolve(fixturesDir, 'simple/src'), {});

    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('No circular dependencies found'),
    );
  });

  it('shows file count in output', () => {
    lintCommand(resolve(fixturesDir, 'simple/src/index.ts'), {});

    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('3 files'),
    );
  });

  it('respects depth option', () => {
    lintCommand(resolve(fixturesDir, 'simple/src/index.ts'), { depth: '1' });

    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('No circular dependencies found'),
    );
  });

  it('exits with error for non-existent entry', () => {
    const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit');
    });

    expect(() => {
      lintCommand('/nonexistent/path.ts', {});
    }).toThrow('process.exit');

    expect(mockExit).toHaveBeenCalledWith(1);
  });
});
