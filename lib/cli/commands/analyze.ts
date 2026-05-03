import { resolve, dirname } from 'path';
import { existsSync } from 'fs';
import { resolveFilePath } from '../../analyzer/src/resolver';
import { buildGraph } from '../../analyzer/src/graph-builder';
import { detectCycles } from '../../analyzer/src/cycle-detector';
import { buildOutput, writeOutput } from '../../output/json-writer';
import { generateHtml } from '../../output/html-generator';

const findProjectRoot = (startDir: string): string => {
  let dir = startDir;
  while (dir !== dirname(dir)) {
    if (existsSync(resolve(dir, 'package.json'))) return dir;
    dir = dirname(dir);
  }
  return startDir;
};

type AnalyzeOptions = {
  output?: string;
  depth?: string;
  html?: boolean;
};

export const analyzeCommand = (entry: string, options: AnalyzeOptions) => {
  const startTime = performance.now();

  const entryResolved = resolveFilePath(process.cwd(), entry);
  if (!entryResolved.path) {
    console.error(`Error: cannot resolve entry "${entry}"`);
    process.exit(1);
  }

  if (!existsSync(entryResolved.path)) {
    console.error(`Error: file not found "${entryResolved.path}"`);
    process.exit(1);
  }

  const root = findProjectRoot(dirname(entryResolved.path));
  const depth = options.depth ? parseInt(options.depth, 10) : undefined;

  const graph = buildGraph(entryResolved.path, root, { depth });
  const cycles = detectCycles(graph);
  const output = buildOutput(graph, cycles, entry);

  const outputPath = resolve(options.output || './tesnel-output.json');
  writeOutput(output, outputPath);

  let htmlPath: string | null = null;
  if (options.html !== false) {
    htmlPath = outputPath.replace(/\.json$/, '.html');
    try {
      generateHtml(output, htmlPath);
    } catch {
      htmlPath = null;
    }
  }

  const elapsed = (performance.now() - startTime).toFixed(0);

  console.log(`\n  tesnel analysis complete\n`);
  console.log(`  Files:  ${output.meta.totalFiles}`);
  console.log(`  Edges:  ${output.meta.totalEdges}`);
  console.log(`  Cycles: ${output.meta.totalCycles}`);
  console.log(`  Time:   ${elapsed}ms`);
  console.log(`\n  JSON: ${outputPath}`);
  if (htmlPath) {
    console.log(`  HTML: ${htmlPath}`);
  }

  if (cycles.length > 0) {
    console.log(`\n  Circular dependencies:`);
    for (const cycle of cycles) {
      console.log(`    ${cycle.join(' → ')}`);
    }
  }

  if (graph.errors.length > 0) {
    console.log(`\n  Parse errors (${graph.errors.length}):`);
    for (const err of graph.errors) {
      console.log(`    ${err.file}: ${err.message}`);
    }
  }

  console.log('');
};
