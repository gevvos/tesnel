import { resolve, dirname } from 'path';
import { existsSync, statSync, readdirSync } from 'fs';
import { resolveFilePath } from '../../analyzer/src/resolver.js';
import { buildGraph } from '../../analyzer/src/graph-builder.js';
import { detectCycles } from '../../analyzer/src/cycle-detector.js';
import { buildOutput, writeOutput } from '../../output/json-writer.js';
import { generateHtml } from '../../output/html-generator.js';

const findProjectRoot = (startDir: string): string => {
  let dir = startDir;
  while (dir !== dirname(dir)) {
    if (existsSync(resolve(dir, 'package.json'))) return dir;
    dir = dirname(dir);
  }
  return startDir;
};

const SUPPORTED_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.vue', '.mjs']);

const collectFiles = (dir: string): string[] => {
  const files: string[] = [];
  const walk = (d: string) => {
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist') continue;
      const fullPath = resolve(d, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else {
        const ext = '.' + entry.name.split('.').pop();
        if (SUPPORTED_EXTENSIONS.has(ext)) {
          files.push(fullPath);
        }
      }
    }
  };
  walk(dir);
  return files;
};

type AnalyzeOptions = {
  output?: string;
  depth?: string;
  html?: boolean;
};

export const analyzeCommand = (entry: string, options: AnalyzeOptions) => {
  const startTime = performance.now();

  const entryPath = resolve(process.cwd(), entry);

  let entryFiles: string[];
  let root: string;

  if (existsSync(entryPath) && statSync(entryPath).isDirectory()) {
    root = findProjectRoot(entryPath);
    entryFiles = collectFiles(entryPath);
    if (entryFiles.length === 0) {
      console.error(`Error: no source files found in "${entry}"`);
      process.exit(1);
    }
  } else {
    const entryResolved = resolveFilePath(process.cwd(), entry);
    if (!entryResolved.path) {
      console.error(`Error: cannot resolve entry "${entry}"`);
      process.exit(1);
    }
    if (!existsSync(entryResolved.path)) {
      console.error(`Error: file not found "${entryResolved.path}"`);
      process.exit(1);
    }
    entryFiles = [entryResolved.path];
    root = findProjectRoot(dirname(entryResolved.path));
  }

  const depth = options.depth ? parseInt(options.depth, 10) : undefined;

  const graph = buildGraph(entryFiles, root, { depth });
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
