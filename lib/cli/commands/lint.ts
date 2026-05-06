import { buildGraph } from '../../analyzer/src/graph-builder.js';
import { detectCycles } from '../../analyzer/src/cycle-detector.js';
import { resolveEntry } from '../resolve-entry.js';

type LintOptions = {
  depth?: string;
};

export const lintCommand = (entry: string, options: LintOptions) => {
  const startTime = performance.now();

  const { files, root } = resolveEntry(entry);
  const depth = options.depth ? parseInt(options.depth, 10) : undefined;

  const graph = buildGraph(files, root, { depth });
  const cycles = detectCycles(graph);
  const elapsed = (performance.now() - startTime).toFixed(0);

  if (cycles.length === 0) {
    console.log(`\n  No circular dependencies found (${graph.nodes.length} files, ${elapsed}ms)\n`);
    return;
  }

  console.error(`\n  Found ${cycles.length} circular ${cycles.length === 1 ? 'dependency' : 'dependencies'} (${graph.nodes.length} files, ${elapsed}ms)\n`);
  for (const cycle of cycles) {
    console.error(`    ${cycle.join(' → ')}`);
  }
  console.error('');

  process.exit(1);
};
