import { describe, it, expect } from 'vitest';
import { detectCycles } from './cycle-detector.js';
import type { DependencyGraph } from './graph-builder.js';

const makeGraph = (nodeIds: string[], edges: Array<[string, string]>): DependencyGraph => ({
  nodes: nodeIds.map(id => ({ id, absPath: `/${id}`, directory: '.' })),
  edges: edges.map(([from, to]) => ({ from, to, type: 'static-import' as const })),
  root: '/',
  errors: [],
});

describe('detectCycles', () => {
  it('returns empty array for acyclic graph', () => {
    const graph = makeGraph(['a', 'b', 'c'], [
      ['a', 'b'],
      ['a', 'c'],
    ]);

    expect(detectCycles(graph)).toEqual([]);
  });

  it('detects simple A→B→A cycle', () => {
    const graph = makeGraph(['a', 'b'], [
      ['a', 'b'],
      ['b', 'a'],
    ]);

    const cycles = detectCycles(graph);
    expect(cycles).toHaveLength(1);
    expect(cycles[0]).toContain('a');
    expect(cycles[0]).toContain('b');
    expect(cycles[0][0]).toBe(cycles[0][cycles[0].length - 1]);
  });

  it('detects triangular cycle A→B→C→A', () => {
    const graph = makeGraph(['a', 'b', 'c'], [
      ['a', 'b'],
      ['b', 'c'],
      ['c', 'a'],
    ]);

    const cycles = detectCycles(graph);
    expect(cycles).toHaveLength(1);
    expect(cycles[0]).toHaveLength(4); // [a, b, c, a]
  });

  it('detects multiple independent cycles', () => {
    const graph = makeGraph(['a', 'b', 'c', 'd'], [
      ['a', 'b'],
      ['b', 'a'],
      ['c', 'd'],
      ['d', 'c'],
    ]);

    const cycles = detectCycles(graph);
    expect(cycles).toHaveLength(2);
  });

  it('does not report diamond dependencies as cycles', () => {
    // A→B, A→C, B→D, C→D (diamond, no cycle)
    const graph = makeGraph(['a', 'b', 'c', 'd'], [
      ['a', 'b'],
      ['a', 'c'],
      ['b', 'd'],
      ['c', 'd'],
    ]);

    expect(detectCycles(graph)).toEqual([]);
  });

  it('does not duplicate same cycle from different starting points', () => {
    const graph = makeGraph(['a', 'b'], [
      ['a', 'b'],
      ['b', 'a'],
    ]);

    const cycles = detectCycles(graph);
    // A→B→A and B→A→B are the same cycle
    expect(cycles).toHaveLength(1);
  });

  it('handles self-import', () => {
    const graph = makeGraph(['a'], [
      ['a', 'a'],
    ]);

    const cycles = detectCycles(graph);
    expect(cycles).toHaveLength(1);
    expect(cycles[0]).toEqual(['a', 'a']);
  });
});
