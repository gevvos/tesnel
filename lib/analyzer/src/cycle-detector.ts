import type { DependencyGraph } from './graph-builder.js';

export type Cycle = string[];

export const detectCycles = (graph: DependencyGraph): Cycle[] => {
  const adjacency = new Map<string, string[]>();

  for (const node of graph.nodes) {
    adjacency.set(node.id, []);
  }
  for (const edge of graph.edges) {
    adjacency.get(edge.from)?.push(edge.to);
  }

  const WHITE = 0;
  const GRAY = 1;
  const BLACK = 2;

  const color = new Map<string, number>();
  for (const node of graph.nodes) {
    color.set(node.id, WHITE);
  }

  const cycles: Cycle[] = [];
  const path: string[] = [];
  const pathSet = new Set<string>();

  const dfs = (nodeId: string) => {
    color.set(nodeId, GRAY);
    path.push(nodeId);
    pathSet.add(nodeId);

    for (const neighbor of adjacency.get(nodeId) || []) {
      if (color.get(neighbor) === GRAY && pathSet.has(neighbor)) {
        const cycleStart = path.indexOf(neighbor);
        const cycle = [...path.slice(cycleStart), neighbor];
        cycles.push(cycle);
      } else if (color.get(neighbor) === WHITE) {
        dfs(neighbor);
      }
    }

    path.pop();
    pathSet.delete(nodeId);
    color.set(nodeId, BLACK);
  };

  for (const node of graph.nodes) {
    if (color.get(node.id) === WHITE) {
      dfs(node.id);
    }
  }

  return deduplicateCycles(cycles);
};

const deduplicateCycles = (cycles: Cycle[]): Cycle[] => {
  const seen = new Set<string>();
  const result: Cycle[] = [];

  for (const cycle of cycles) {
    const normalized = normalizeCycle(cycle);
    const key = normalized.join(' -> ');
    if (!seen.has(key)) {
      seen.add(key);
      result.push(cycle);
    }
  }

  return result;
};

const normalizeCycle = (cycle: Cycle): Cycle => {
  const inner = cycle.slice(0, -1);
  const minIdx = inner.indexOf(inner.reduce((a, b) => (a < b ? a : b)));
  const rotated = [...inner.slice(minIdx), ...inner.slice(0, minIdx), inner[minIdx]];
  return rotated;
};
