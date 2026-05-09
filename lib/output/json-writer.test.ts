import { describe, it, expect } from 'vitest';
import { resolve } from 'path';
import { buildOutput } from './json-writer.js';
import { buildGraph } from '../analyzer/src/graph-builder.js';
import { detectCycles } from '../analyzer/src/cycle-detector.js';
import { calculateMetrics } from '../analyzer/src/metrics-calculator.js';

const fixturesDir = resolve(__dirname, '../../tests/fixtures');

describe('buildOutput', () => {
  it('produces valid TesnelOutput for simple project', () => {
    const root = resolve(fixturesDir, 'simple');
    const entry = resolve(root, 'src/index.ts');
    const graph = buildGraph(entry, root);
    const cycles = detectCycles(graph);
    const output = buildOutput(graph, cycles, './src/index.ts');

    expect(output.meta.totalFiles).toBe(3);
    expect(output.meta.totalEdges).toBe(3);
    expect(output.meta.totalCycles).toBe(0);
    expect(output.meta.entry).toBe('./src/index.ts');
    expect(output.meta.version).toBeDefined();
    expect(output.meta.generatedAt).toBeDefined();
  });

  it('builds correct tree structure', () => {
    const root = resolve(fixturesDir, 'simple');
    const entry = resolve(root, 'src/index.ts');
    const graph = buildGraph(entry, root);
    const output = buildOutput(graph, [], './src/index.ts');

    expect(output.tree).toHaveLength(1);
    expect(output.tree[0].type).toBe('directory');
    expect(output.tree[0].name).toBe('src');
    if (output.tree[0].type === 'directory') {
      expect(output.tree[0].children).toHaveLength(3);
      const fileNames = output.tree[0].children.map(c => c.name).sort();
      expect(fileNames).toEqual(['helper.ts', 'index.ts', 'utils.ts']);
    }
  });

  it('builds nested tree for vue project', () => {
    const root = resolve(fixturesDir, 'vue-project');
    const entry = resolve(root, 'src/App.vue');
    const graph = buildGraph(entry, root);
    const output = buildOutput(graph, [], './src/App.vue');

    const src = output.tree[0];
    expect(src.type).toBe('directory');
    if (src.type === 'directory') {
      const composablesDir = src.children.find(c => c.name === 'composables');
      expect(composablesDir?.type).toBe('directory');
    }
  });

  it('includes cycles in output', () => {
    const root = resolve(fixturesDir, 'circular');
    const entry = resolve(root, 'src/a.ts');
    const graph = buildGraph(entry, root);
    const cycles = detectCycles(graph);
    const output = buildOutput(graph, cycles, './src/a.ts');

    expect(output.meta.totalCycles).toBe(1);
    expect(output.cycles).toHaveLength(1);
    expect(output.cycles[0]).toContain('src/a.ts');
    expect(output.cycles[0]).toContain('src/b.ts');
  });

  it('preserves edge types in output', () => {
    const root = resolve(fixturesDir, 'type-imports');
    const entry = resolve(root, 'src/index.ts');
    const graph = buildGraph(entry, root);
    const output = buildOutput(graph, [], './src/index.ts');

    const typeEdges = output.graph.edges.filter(e => e.type === 'type-import');
    const runtimeEdges = output.graph.edges.filter(e => e.type === 'static-import');
    expect(typeEdges.length).toBeGreaterThan(0);
    expect(runtimeEdges.length).toBeGreaterThan(0);
  });

  it('includes metrics when provided', () => {
    const root = resolve(fixturesDir, 'simple');
    const entry = resolve(root, 'src/index.ts');
    const graph = buildGraph(entry, root);
    const metrics = calculateMetrics(graph);
    const output = buildOutput(graph, [], './src/index.ts', { metrics });

    expect(output.metrics).toBeDefined();
    expect(output.metrics!.modules).toEqual(metrics.modules);
    expect(output.metrics!.summary).toEqual(metrics.summary);
  });

  it('omits metrics when not provided', () => {
    const root = resolve(fixturesDir, 'simple');
    const entry = resolve(root, 'src/index.ts');
    const graph = buildGraph(entry, root);
    const output = buildOutput(graph, [], './src/index.ts');

    expect(output.metrics).toBeUndefined();
  });
});
