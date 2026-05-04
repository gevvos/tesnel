import { describe, it, expect } from 'vitest';
import { resolve } from 'path';
import { buildGraph } from './analyzer/src/graph-builder.js';
import { detectCycles } from './analyzer/src/cycle-detector.js';
import { buildOutput } from './output/json-writer.js';
import { generateHtml } from './output/html-generator.js';
import { existsSync, unlinkSync, readFileSync } from 'fs';

const fixturesDir = resolve(__dirname, '../tests/fixtures');

describe('full pipeline: analyze → json → html', () => {
  it('produces valid output for simple project', () => {
    const root = resolve(fixturesDir, 'simple');
    const entry = resolve(root, 'src/index.ts');

    const graph = buildGraph(entry, root);
    const cycles = detectCycles(graph);
    const output = buildOutput(graph, cycles, './src/index.ts');

    expect(output.meta.totalFiles).toBe(3);
    expect(output.meta.totalEdges).toBe(3);
    expect(output.meta.totalCycles).toBe(0);
    expect(output.tree).toHaveLength(1);
    expect(output.graph.nodes).toHaveLength(3);
    expect(output.graph.edges).toHaveLength(3);
    expect(output.cycles).toEqual([]);
    expect(output.errors).toEqual([]);
  });

  it('produces valid output for circular project', () => {
    const root = resolve(fixturesDir, 'circular');
    const entry = resolve(root, 'src/a.ts');

    const graph = buildGraph(entry, root);
    const cycles = detectCycles(graph);
    const output = buildOutput(graph, cycles, './src/a.ts');

    expect(output.meta.totalCycles).toBe(1);
    expect(output.cycles).toHaveLength(1);
  });

  it('produces valid output for vue project', () => {
    const root = resolve(fixturesDir, 'vue-project');
    const entry = resolve(root, 'src/App.vue');

    const graph = buildGraph(entry, root);
    const cycles = detectCycles(graph);
    const output = buildOutput(graph, cycles, './src/App.vue');

    expect(output.meta.totalFiles).toBe(4);
    expect(output.graph.edges.every(e => e.type === 'static-import')).toBe(true);
  });

  it('produces valid output for type-imports project', () => {
    const root = resolve(fixturesDir, 'type-imports');
    const entry = resolve(root, 'src/index.ts');

    const graph = buildGraph(entry, root);
    const cycles = detectCycles(graph);
    const output = buildOutput(graph, cycles, './src/index.ts');

    expect(output.meta.totalFiles).toBe(3);
    const edgeTypes = new Set(output.graph.edges.map(e => e.type));
    expect(edgeTypes.has('static-import')).toBe(true);
    expect(edgeTypes.has('type-import')).toBe(true);
  });

  it('generates HTML with embedded data', () => {
    const root = resolve(fixturesDir, 'simple');
    const entry = resolve(root, 'src/index.ts');
    const htmlPath = resolve(__dirname, '../.tmp-test-output.html');

    const graph = buildGraph(entry, root);
    const output = buildOutput(graph, [], './src/index.ts');

    try {
      generateHtml(output, htmlPath);
      expect(existsSync(htmlPath)).toBe(true);

      const html = readFileSync(htmlPath, 'utf8');
      expect(html).toContain('"totalFiles":3');
      expect(html).toContain('src/index.ts');
    } finally {
      try { unlinkSync(htmlPath); } catch {}
    }
  });

  it('handles directory entry with multiple files', () => {
    const root = resolve(fixturesDir, 'simple');
    const entries = [
      resolve(root, 'src/index.ts'),
      resolve(root, 'src/helper.ts'),
      resolve(root, 'src/utils.ts'),
    ];

    const graph = buildGraph(entries, root);
    expect(graph.nodes).toHaveLength(3);
    expect(graph.edges).toHaveLength(3);
  });
});
