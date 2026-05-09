import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { resolve } from 'path';
import { existsSync, rmSync, readFileSync } from 'fs';
import { analyzeCommand } from './analyze.js';

const fixturesDir = resolve(__dirname, '../../../tests/fixtures');
const tmpDir = resolve(__dirname, '../../../.tmp-test-cli');

beforeEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
  vi.restoreAllMocks();
});

describe('analyzeCommand', () => {
  it('writes output to .tesnel/output.json by default', () => {
    const cwd = process.cwd();
    const outputDir = resolve(cwd, '.tesnel');
    const outputJson = resolve(outputDir, 'output.json');
    const outputHtml = resolve(outputDir, 'output.html');

    try {
      analyzeCommand(resolve(fixturesDir, 'simple/src/index.ts'), { html: false });

      expect(existsSync(outputJson)).toBe(true);
      const data = JSON.parse(readFileSync(outputJson, 'utf8'));
      expect(data.meta.totalFiles).toBe(3);
    } finally {
      rmSync(outputDir, { recursive: true, force: true });
    }
  });

  it('creates nested directories for custom output path', () => {
    const outputPath = resolve(tmpDir, 'nested/deep/result.json');

    analyzeCommand(resolve(fixturesDir, 'simple/src/index.ts'), {
      output: outputPath,
      html: false,
    });

    expect(existsSync(outputPath)).toBe(true);
    const data = JSON.parse(readFileSync(outputPath, 'utf8'));
    expect(data.meta.totalFiles).toBe(3);
  });

  it('generates HTML alongside JSON by default', () => {
    const outputPath = resolve(tmpDir, 'out.json');
    const htmlPath = resolve(tmpDir, 'out.html');

    analyzeCommand(resolve(fixturesDir, 'simple/src/index.ts'), {
      output: outputPath,
    });

    expect(existsSync(outputPath)).toBe(true);
    expect(existsSync(htmlPath)).toBe(true);
  });

  it('skips HTML when --no-html is set', () => {
    const outputPath = resolve(tmpDir, 'out.json');
    const htmlPath = resolve(tmpDir, 'out.html');

    analyzeCommand(resolve(fixturesDir, 'simple/src/index.ts'), {
      output: outputPath,
      html: false,
    });

    expect(existsSync(outputPath)).toBe(true);
    expect(existsSync(htmlPath)).toBe(false);
  });

  it('handles directory entry', () => {
    const outputPath = resolve(tmpDir, 'out.json');

    analyzeCommand(resolve(fixturesDir, 'simple/src'), {
      output: outputPath,
      html: false,
    });

    expect(existsSync(outputPath)).toBe(true);
    const data = JSON.parse(readFileSync(outputPath, 'utf8'));
    expect(data.meta.totalFiles).toBe(3);
  });

  it('respects depth option', () => {
    const outputPath = resolve(tmpDir, 'out.json');

    analyzeCommand(resolve(fixturesDir, 'simple/src/index.ts'), {
      output: outputPath,
      depth: '1',
      html: false,
    });

    expect(existsSync(outputPath)).toBe(true);
    const data = JSON.parse(readFileSync(outputPath, 'utf8'));
    expect(data.meta.totalFiles).toBeLessThanOrEqual(3);
  });

  it('exits with error for non-existent entry', () => {
    const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit');
    });

    expect(() => {
      analyzeCommand('/nonexistent/path/file.ts', {
        output: resolve(tmpDir, 'out.json'),
        html: false,
      });
    }).toThrow('process.exit');

    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('detects cycles in circular project', () => {
    const outputPath = resolve(tmpDir, 'out.json');

    analyzeCommand(resolve(fixturesDir, 'circular/src/a.ts'), {
      output: outputPath,
      html: false,
    });

    const data = JSON.parse(readFileSync(outputPath, 'utf8'));
    expect(data.meta.totalCycles).toBe(1);
    expect(data.cycles).toHaveLength(1);
  });

  it('includes metrics in output', () => {
    const outputPath = resolve(tmpDir, 'out.json');

    analyzeCommand(resolve(fixturesDir, 'simple/src/index.ts'), {
      output: outputPath,
      html: false,
    });

    const data = JSON.parse(readFileSync(outputPath, 'utf8'));
    expect(data.metrics).toBeDefined();
    expect(data.metrics.modules).toBeInstanceOf(Array);
    expect(data.metrics.summary).toBeDefined();
    expect(typeof data.metrics.summary.avgDistance).toBe('number');
  });

  it('excludes isolated directories from metrics', () => {
    const outputPath = resolve(tmpDir, 'out.json');

    analyzeCommand(resolve(fixturesDir, 'simple/src/index.ts'), {
      output: outputPath,
      html: false,
    });

    const data = JSON.parse(readFileSync(outputPath, 'utf8'));
    const isolated = data.metrics.modules.filter(
      (m: { fanIn: number; fanOut: number }) => m.fanIn === 0 && m.fanOut === 0,
    );
    expect(isolated).toHaveLength(0);
  });
});
