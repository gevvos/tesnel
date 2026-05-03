import { dirname, extname, relative, resolve } from 'path';
import { parseFile } from './parser';
import { parseVueFile } from './vue-parser';
import { resolveFilePath, initResolver } from './resolver';

export type GraphNode = {
  id: string;
  absPath: string;
  directory: string;
};

export type GraphEdge = {
  from: string;
  to: string;
  type: 'static-import' | 're-export';
};

export type BuildGraphOptions = {
  depth?: number;
};

export type DependencyGraph = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  root: string;
  errors: Array<{ file: string; message: string }>;
};

const isNodeModule = (resolvedPath: string): boolean => {
  return resolvedPath.includes('/node_modules/');
};

export const buildGraph = (entryAbsPath: string, root: string, options: BuildGraphOptions = {}): DependencyGraph => {
  initResolver(root);
  const visited = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];
  const errors: Array<{ file: string; message: string }> = [];
  const queue: Array<{ absPath: string; currentDepth: number }> = [];

  const toRelative = (absPath: string) => relative(root, absPath);

  const addNode = (absPath: string): GraphNode => {
    const id = toRelative(absPath);
    const node: GraphNode = {
      id,
      absPath,
      directory: dirname(id),
    };
    visited.set(absPath, node);
    return node;
  };

  addNode(entryAbsPath);
  queue.push({ absPath: entryAbsPath, currentDepth: 0 });

  while (queue.length > 0) {
    const { absPath, currentDepth } = queue.shift()!;

    if (options.depth !== undefined && currentDepth >= options.depth) {
      continue;
    }

    const parsed = extname(absPath) === '.vue'
      ? parseVueFile(absPath)
      : parseFile(absPath);

    if (parsed.errors.length > 0) {
      errors.push({ file: toRelative(absPath), message: parsed.errors.join('; ') });
      continue;
    }

    const fromId = toRelative(absPath);
    const fileDir = dirname(absPath);

    const processSpecifier = (specifier: string, type: GraphEdge['type']) => {
      const resolved = resolveFilePath(fileDir, specifier);
      if (!resolved.path) return;
      if (isNodeModule(resolved.path)) return;

      const toId = toRelative(resolved.path);
      edges.push({ from: fromId, to: toId, type });

      if (!visited.has(resolved.path)) {
        addNode(resolved.path);
        queue.push({ absPath: resolved.path, currentDepth: currentDepth + 1 });
      }
    };

    for (const specifier of parsed.imports) {
      processSpecifier(specifier, 'static-import');
    }

    for (const specifier of parsed.reExports) {
      processSpecifier(specifier, 're-export');
    }
  }

  return {
    nodes: Array.from(visited.values()),
    edges,
    root,
    errors,
  };
};
