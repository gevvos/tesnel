import { dirname, extname, relative, resolve } from 'path';
import { readFileSync } from 'fs';
import { parseFile } from './parser.js';
import { parseVueFile } from './vue-parser.js';
import { resolveFilePath, initResolver } from './resolver.js';
import { loadNuxtAutoImports, type AutoImportMap } from './nuxt-auto-imports.js';

export type GraphNode = {
  id: string;
  absPath: string;
  directory: string;
};

export type GraphEdge = {
  from: string;
  to: string;
  type: 'static-import' | 'type-import' | 're-export' | 'auto-import';
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

export const buildGraph = (entryAbsPaths: string | string[], root: string, options: BuildGraphOptions = {}): DependencyGraph => {
  initResolver(root);
  const autoImports = loadNuxtAutoImports(root);
  const nuxtTypesDir = autoImports ? resolve(root, '.nuxt/types') : '';

  const entries = Array.isArray(entryAbsPaths) ? entryAbsPaths : [entryAbsPaths];
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

  for (const entry of entries) {
    if (!visited.has(entry)) {
      addNode(entry);
      queue.push({ absPath: entry, currentDepth: 0 });
    }
  }

  while (queue.length > 0) {
    const { absPath, currentDepth } = queue.shift()!;

    if (options.depth !== undefined && currentDepth >= options.depth) {
      continue;
    }

    let parsed;
    try {
      parsed = extname(absPath) === '.vue'
        ? parseVueFile(absPath)
        : parseFile(absPath);
    } catch (e: any) {
      errors.push({ file: toRelative(absPath), message: e.message || 'Failed to parse' });
      continue;
    }

    if (parsed.errors.length > 0) {
      errors.push({ file: toRelative(absPath), message: parsed.errors.join('; ') });
      continue;
    }

    const fromId = toRelative(absPath);
    const fileDir = dirname(absPath);

    const processSpecifier = (specifier: string, type: GraphEdge['type']) => {
      const cleanSpecifier = specifier.split('?')[0];
      const resolved = resolveFilePath(fileDir, cleanSpecifier);
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

    for (const specifier of parsed.typeImports) {
      processSpecifier(specifier, 'type-import');
    }

    for (const specifier of parsed.reExports) {
      processSpecifier(specifier, 're-export');
    }

    if (autoImports) {
      const sourceText = readFileSync(absPath, 'utf8');
      for (const [name, importPath] of autoImports) {
        if (sourceText.includes(name)) {
          const resolvedAutoPath = resolve(nuxtTypesDir, importPath);
          const ext = ['.ts', '.js', '.vue', '.mjs'];
          let resolvedFinal: string | null = null;

          for (const e of ext) {
            const candidate = resolvedAutoPath.endsWith(e) ? resolvedAutoPath : resolvedAutoPath + e;
            try {
              readFileSync(candidate);
              resolvedFinal = candidate;
              break;
            } catch {}
          }

          if (!resolvedFinal) {
            const resolved = resolveFilePath(dirname(resolvedAutoPath), './' + resolvedAutoPath.split('/').pop()!);
            if (resolved.path) resolvedFinal = resolved.path;
          }

          if (resolvedFinal && !isNodeModule(resolvedFinal) && resolvedFinal !== absPath) {
            const toId = toRelative(resolvedFinal);
            const alreadyHasEdge = edges.some(e => e.from === fromId && e.to === toId);
            if (!alreadyHasEdge) {
              edges.push({ from: fromId, to: toId, type: 'auto-import' });
              if (!visited.has(resolvedFinal)) {
                addNode(resolvedFinal);
                queue.push({ absPath: resolvedFinal, currentDepth: currentDepth + 1 });
              }
            }
          }
        }
      }
    }
  }

  return {
    nodes: Array.from(visited.values()),
    edges,
    root,
    errors,
  };
};
