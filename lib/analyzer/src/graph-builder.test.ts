import { describe, it, expect } from 'vitest';
import { resolve } from 'path';
import { buildGraph } from './graph-builder';

const fixturesDir = resolve(__dirname, '../../../tests/fixtures');

const fixture = (name: string) => ({
  entry: resolve(fixturesDir, name, 'src/index.ts'),
  root: resolve(fixturesDir, name),
});

describe('buildGraph', () => {
  it('builds graph for simple project', () => {
    const { entry, root } = fixture('simple');
    const graph = buildGraph(entry, root);

    expect(graph.nodes).toHaveLength(3);
    expect(graph.edges).toHaveLength(3);

    const nodeIds = graph.nodes.map(n => n.id).sort();
    expect(nodeIds).toEqual(['src/helper.ts', 'src/index.ts', 'src/utils.ts']);

    expect(graph.edges).toContainEqual({
      from: 'src/index.ts',
      to: 'src/helper.ts',
      type: 'static-import',
    });
    expect(graph.edges).toContainEqual({
      from: 'src/index.ts',
      to: 'src/utils.ts',
      type: 'static-import',
    });
    expect(graph.edges).toContainEqual({
      from: 'src/utils.ts',
      to: 'src/helper.ts',
      type: 'static-import',
    });
  });

  it('handles re-exports', () => {
    const { entry, root } = fixture('re-exports');
    const graph = buildGraph(entry, root);

    expect(graph.nodes).toHaveLength(3);

    const reExportEdges = graph.edges.filter(e => e.type === 're-export');
    expect(reExportEdges).toHaveLength(2);
    expect(reExportEdges).toContainEqual({
      from: 'src/index.ts',
      to: 'src/helper.ts',
      type: 're-export',
    });
    expect(reExportEdges).toContainEqual({
      from: 'src/index.ts',
      to: 'src/utils.ts',
      type: 're-export',
    });
  });

  it('handles circular dependencies without infinite loop', () => {
    const entry = resolve(fixturesDir, 'circular/src/a.ts');
    const root = resolve(fixturesDir, 'circular');
    const graph = buildGraph(entry, root);

    expect(graph.nodes).toHaveLength(2);
    expect(graph.edges).toHaveLength(2);

    expect(graph.edges).toContainEqual({
      from: 'src/a.ts',
      to: 'src/b.ts',
      type: 'static-import',
    });
    expect(graph.edges).toContainEqual({
      from: 'src/b.ts',
      to: 'src/a.ts',
      type: 'static-import',
    });
  });

  it('respects depth limit', () => {
    const { entry, root } = fixture('simple');
    const graph = buildGraph(entry, root, { depth: 1 });

    const nodeIds = graph.nodes.map(n => n.id).sort();
    expect(nodeIds).toEqual(['src/helper.ts', 'src/index.ts', 'src/utils.ts']);

    // depth=1: parses entry (depth 0), finds helper and utils
    // but does NOT parse helper/utils (they're at depth 1, limit reached)
    // so utils→helper edge should NOT exist
    expect(graph.edges).not.toContainEqual({
      from: 'src/utils.ts',
      to: 'src/helper.ts',
      type: 'static-import',
    });
  });

  it('ignores bare specifiers', () => {
    const { entry, root } = fixture('simple');
    const graph = buildGraph(entry, root);

    const nodeIds = graph.nodes.map(n => n.id);
    // No node_modules packages in graph
    expect(nodeIds.every(id => !id.includes('node_modules'))).toBe(true);
  });

  it('parses each file only once', () => {
    const { entry, root } = fixture('simple');
    const graph = buildGraph(entry, root);

    // helper.ts is imported by both index.ts and utils.ts
    // but should appear only once in nodes
    const helperNodes = graph.nodes.filter(n => n.id === 'src/helper.ts');
    expect(helperNodes).toHaveLength(1);
  });

  it('sets directory correctly', () => {
    const { entry, root } = fixture('simple');
    const graph = buildGraph(entry, root);

    const indexNode = graph.nodes.find(n => n.id === 'src/index.ts');
    expect(indexNode?.directory).toBe('src');
  });
});
