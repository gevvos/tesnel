import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { readFileSync, existsSync } from 'fs';
import { z } from 'zod/v4';
import type { TesnelOutput } from '../types.js';

const READ_ONLY_ANNOTATIONS = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const;

const NO_DATA_MESSAGE = 'No analysis data found. Run "tesnel analyze <entry>" (e.g. "npx @gevvos/tesnel analyze ./src/main.ts") to generate it.';

const noDataError = () => ({
  content: [{ type: 'text' as const, text: NO_DATA_MESSAGE }],
  isError: true as const,
});

const loadData = (dataPath: string): TesnelOutput | null => {
  if (!existsSync(dataPath)) return null;
  return JSON.parse(readFileSync(dataPath, 'utf8'));
};

export const createServer = (dataPath: string) => {
  const data = loadData(dataPath);

  const server = new McpServer({
    name: 'tesnel',
    version: '0.1.0',
  });

  server.registerTool('tesnel_get_stats', {
    title: 'Project Stats',
    description: 'Get project analysis overview: file count, edge count, cycle count, entry point',
    annotations: READ_ONLY_ANNOTATIONS,
  }, async () => {
    if (!data) return noDataError();
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(data.meta, null, 2) }],
    };
  });

  server.registerTool('tesnel_get_structure', {
    title: 'Directory Tree',
    description: 'Get the project directory tree structure. Use depth to limit nesting.',
    inputSchema: {
      depth: z.number().optional().describe('Max directory depth to return'),
    },
    annotations: READ_ONLY_ANNOTATIONS,
  }, async ({ depth }) => {
    if (!data) return noDataError();

    const truncate = (nodes: typeof data.tree, d: number, max: number): typeof data.tree => {
      if (d >= max) return [];
      return nodes.map(n => {
        if (n.type === 'file') return n;
        return { ...n, children: truncate(n.children, d + 1, max) };
      });
    };

    const tree = depth != null ? truncate(data.tree, 0, depth) : data.tree;
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(tree, null, 2) }],
    };
  });

  server.registerTool('tesnel_get_file_info', {
    title: 'File Info',
    description: 'Get dependency info for a specific file: what it imports and what imports it',
    inputSchema: {
      path: z.string().describe('Relative file path (e.g. "src/index.ts")'),
    },
    annotations: READ_ONLY_ANNOTATIONS,
  }, async ({ path }) => {
    if (!data) return noDataError();

    const node = data.graph.nodes.find(n => n.id === path);
    if (!node) {
      return {
        content: [{ type: 'text' as const, text: `File "${path}" not found in the dependency graph.` }],
        isError: true,
      };
    }

    const imports = data.graph.edges.filter(e => e.from === path).map(e => ({ to: e.to, type: e.type }));
    const importedBy = data.graph.edges.filter(e => e.to === path).map(e => ({ from: e.from, type: e.type }));
    const inCycle = data.cycles.some(c => c.includes(path));

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({ path, directory: node.directory, imports, importedBy, inCycle }, null, 2),
      }],
    };
  });

  server.registerTool('tesnel_get_cycles', {
    title: 'Circular Dependencies',
    description: 'Get all circular dependencies found in the project',
    annotations: READ_ONLY_ANNOTATIONS,
  }, async () => {
    if (!data) return noDataError();
    return {
      content: [{
        type: 'text' as const,
        text: data.cycles.length > 0
          ? JSON.stringify({ totalCycles: data.cycles.length, cycles: data.cycles }, null, 2)
          : 'No circular dependencies found.',
      }],
    };
  });

  server.registerTool('tesnel_get_metrics', {
    title: 'Architecture Metrics',
    description: 'Get architecture metrics (Instability, Abstractness, Distance) per directory. Based on Robert Martin\'s Clean Architecture. Identifies Zone of Pain (concrete+stable) and Zone of Uselessness (abstract+unstable).',
    inputSchema: {
      sort_by: z.enum(['distance', 'instability', 'abstractness', 'fanIn', 'fanOut']).optional().describe('Sort modules by this field (default: distance)'),
    },
    annotations: READ_ONLY_ANNOTATIONS,
  }, async ({ sort_by }) => {
    if (!data) return noDataError();

    if (!data.metrics) {
      return {
        content: [{ type: 'text' as const, text: 'No metrics available. Re-run tesnel analyze to generate metrics.' }],
        isError: true,
      };
    }

    const modules = [...data.metrics.modules];
    if (sort_by && sort_by !== 'distance') {
      modules.sort((a, b) => (b[sort_by] as number) - (a[sort_by] as number));
    }

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({ summary: data.metrics.summary, modules }, null, 2),
      }],
    };
  });

  return server;
};

export const startServer = async (dataPath: string) => {
  const server = createServer(dataPath);
  const transport = new StdioServerTransport();
  await server.connect(transport);
};
