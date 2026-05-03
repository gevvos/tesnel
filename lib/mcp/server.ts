import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { z } from 'zod/v4';
import type { TesnelOutput } from '../types';

const loadData = (dataPath: string): TesnelOutput => {
  if (!existsSync(dataPath)) {
    throw new Error(`Tesnel data not found at ${dataPath}. Run 'tesnel analyze <entry>' first.`);
  }
  return JSON.parse(readFileSync(dataPath, 'utf8'));
};

export const createServer = (dataPath: string) => {
  const data = loadData(dataPath);

  const server = new McpServer({
    name: 'tesnel',
    version: '0.1.0',
  });

  server.tool(
    'tesnel_get_stats',
    'Get project analysis overview: file count, edge count, cycle count, entry point',
    {},
    async () => ({
      content: [{ type: 'text', text: JSON.stringify(data.meta, null, 2) }],
    }),
  );

  server.tool(
    'tesnel_get_structure',
    'Get the project directory tree structure. Use depth to limit nesting.',
    { depth: z.number().optional().describe('Max directory depth to return') },
    async ({ depth }) => {
      const truncate = (nodes: typeof data.tree, d: number, max: number): typeof data.tree => {
        if (d >= max) return [];
        return nodes.map(n => {
          if (n.type === 'file') return n;
          return { ...n, children: truncate(n.children, d + 1, max) };
        });
      };

      const tree = depth != null ? truncate(data.tree, 0, depth) : data.tree;
      return {
        content: [{ type: 'text', text: JSON.stringify(tree, null, 2) }],
      };
    },
  );

  server.tool(
    'tesnel_get_file_info',
    'Get dependency info for a specific file: what it imports and what imports it',
    { path: z.string().describe('Relative file path (e.g. "src/index.ts")') },
    async ({ path }) => {
      const node = data.graph.nodes.find(n => n.id === path);
      if (!node) {
        return {
          content: [{ type: 'text', text: `File "${path}" not found in the dependency graph.` }],
          isError: true,
        };
      }

      const imports = data.graph.edges.filter(e => e.from === path).map(e => ({ to: e.to, type: e.type }));
      const importedBy = data.graph.edges.filter(e => e.to === path).map(e => ({ from: e.from, type: e.type }));
      const inCycle = data.cycles.some(c => c.includes(path));

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ path, directory: node.directory, imports, importedBy, inCycle }, null, 2),
        }],
      };
    },
  );

  server.tool(
    'tesnel_get_cycles',
    'Get all circular dependencies found in the project',
    {},
    async () => ({
      content: [{
        type: 'text',
        text: data.cycles.length > 0
          ? JSON.stringify({ totalCycles: data.cycles.length, cycles: data.cycles }, null, 2)
          : 'No circular dependencies found.',
      }],
    }),
  );

  return server;
};

export const startServer = async (dataPath: string) => {
  const server = createServer(dataPath);
  const transport = new StdioServerTransport();
  await server.connect(transport);
};
