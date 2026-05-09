import { writeFileSync } from 'fs';
import type { DependencyGraph } from '../analyzer/src/graph-builder.js';
import type { Cycle } from '../analyzer/src/cycle-detector.js';
import type { ArchitectureMetrics } from '../analyzer/src/metrics-calculator.js';
import type { TesnelOutput, TreeNode } from '../types.js';

type DirNode = { type: 'directory'; name: string; children: Map<string, DirNode | FileNode> };
type FileNode = { type: 'file'; id: string; name: string };

const buildTree = (graph: DependencyGraph): TreeNode[] => {
  const root = new Map<string, DirNode | FileNode>();

  for (const node of graph.nodes) {
    const parts = node.id.split('/');
    let current = root;

    for (let i = 0; i < parts.length - 1; i++) {
      const dirName = parts[i];
      if (!current.has(dirName)) {
        current.set(dirName, { type: 'directory', name: dirName, children: new Map() });
      }
      const dir = current.get(dirName)!;
      if (dir.type === 'directory') {
        current = dir.children;
      }
    }

    const fileName = parts[parts.length - 1];
    current.set(fileName, { type: 'file', id: node.id, name: fileName });
  }

  return mapToTree(root);
};

const mapToTree = (map: Map<string, DirNode | FileNode>): TreeNode[] => {
  const result: TreeNode[] = [];
  for (const node of map.values()) {
    if (node.type === 'file') {
      result.push({ type: 'file', id: node.id, name: node.name });
    } else {
      result.push({ type: 'directory', name: node.name, children: mapToTree(node.children) });
    }
  }
  return result;
};

export const buildOutput = (
  graph: DependencyGraph,
  cycles: Cycle[],
  entry: string,
  metrics?: ArchitectureMetrics,
): TesnelOutput => {
  const output: TesnelOutput = {
    meta: {
      version: '0.1.0',
      entry,
      root: graph.root,
      generatedAt: new Date().toISOString(),
      totalFiles: graph.nodes.length,
      totalEdges: graph.edges.length,
      totalCycles: cycles.length,
    },
    tree: buildTree(graph),
    graph: {
      nodes: graph.nodes.map(n => ({ id: n.id, directory: n.directory })),
      edges: graph.edges.map(e => ({ from: e.from, to: e.to, type: e.type })),
    },
    cycles,
    errors: graph.errors,
  };

  if (metrics) {
    output.metrics = metrics;
  }

  return output;
};

export const writeOutput = (output: TesnelOutput, outputPath: string): void => {
  writeFileSync(outputPath, JSON.stringify(output, null, 2));
};
