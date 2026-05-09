import { resolve, dirname } from 'path';
import { mkdirSync } from 'fs';
import { buildGraph } from '../../analyzer/src/graph-builder.js';
import { detectCycles } from '../../analyzer/src/cycle-detector.js';
import { calculateMetrics } from '../../analyzer/src/metrics-calculator.js';
import { computeFileStats } from '../../analyzer/src/file-stats.js';
import { buildOutput, writeOutput } from '../../output/json-writer.js';
import { generateHtml } from '../../output/html-generator.js';
import { resolveEntry } from '../resolve-entry.js';

type AnalyzeOptions = {
  output?: string;
  depth?: string;
  html?: boolean;
};

export const analyzeCommand = (entry: string, options: AnalyzeOptions) => {
  const startTime = performance.now();

  const { files, root } = resolveEntry(entry);
  const depth = options.depth ? parseInt(options.depth, 10) : undefined;

  const graph = buildGraph(files, root, { depth });
  const cycles = detectCycles(graph);
  const metrics = calculateMetrics(graph);

  const fileStats: Record<string, ReturnType<typeof computeFileStats>> = {};
  for (const node of graph.nodes) {
    try { fileStats[node.id] = computeFileStats(node.absPath); } catch {}
  }

  const output = buildOutput(graph, cycles, entry, { metrics, fileStats });

  const outputPath = resolve(options.output || '.tesnel/output.json');
  mkdirSync(dirname(outputPath), { recursive: true });
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
