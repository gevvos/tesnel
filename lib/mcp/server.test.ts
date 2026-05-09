import { describe, it, expect, beforeAll } from 'vitest';
import { resolve } from 'path';
import { writeFileSync, mkdirSync } from 'fs';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createServer } from './server.js';
import type { TesnelOutput } from '../types.js';

const testData: TesnelOutput = {
  meta: {
    version: '0.1.0',
    entry: './src/index.ts',
    root: '/project',
    generatedAt: '2026-01-01T00:00:00Z',
    totalFiles: 3,
    totalEdges: 3,
    totalCycles: 1,
  },
  tree: [
    {
      type: 'directory',
      name: 'src',
      children: [
        { type: 'file', id: 'src/index.ts', name: 'index.ts' },
        { type: 'file', id: 'src/a.ts', name: 'a.ts' },
        { type: 'file', id: 'src/b.ts', name: 'b.ts' },
      ],
    },
  ],
  graph: {
    nodes: [
      { id: 'src/index.ts', directory: 'src' },
      { id: 'src/a.ts', directory: 'src' },
      { id: 'src/b.ts', directory: 'src' },
    ],
    edges: [
      { from: 'src/index.ts', to: 'src/a.ts', type: 'static-import' },
      { from: 'src/a.ts', to: 'src/b.ts', type: 'static-import' },
      { from: 'src/b.ts', to: 'src/a.ts', type: 'static-import' },
    ],
  },
  cycles: [['src/a.ts', 'src/b.ts', 'src/a.ts']],
  errors: [],
  metrics: {
    modules: [
      { path: 'lib', files: 1, fanIn: 5, fanOut: 0, instability: 0, abstractness: 0, distance: 1 },
      { path: 'app', files: 2, fanIn: 0, fanOut: 3, instability: 1, abstractness: 0, distance: 0 },
    ],
    summary: {
      avgDistance: 0.5,
      maxDistance: 1,
      modulesInPainZone: 1,
      modulesInUselessnessZone: 0,
    },
  },
};

const tmpDir = resolve(__dirname, '../../.tmp-test');
const testDataPath = resolve(tmpDir, 'test-data.json');

let client: Client;

beforeAll(async () => {
  mkdirSync(tmpDir, { recursive: true });
  writeFileSync(testDataPath, JSON.stringify(testData));

  const server = createServer(testDataPath);
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);

  client = new Client({ name: 'test', version: '1.0.0' });
  await client.connect(clientTransport);
});

describe('MCP Server', () => {
  it('tesnel_get_stats returns meta info', async () => {
    const result = await client.callTool({ name: 'tesnel_get_stats', arguments: {} });
    const content = result.content as Array<{ type: string; text: string }>;
    const meta = JSON.parse(content[0].text);

    expect(meta.totalFiles).toBe(3);
    expect(meta.totalEdges).toBe(3);
    expect(meta.totalCycles).toBe(1);
    expect(meta.entry).toBe('./src/index.ts');
  });

  it('tesnel_get_structure returns full tree', async () => {
    const result = await client.callTool({ name: 'tesnel_get_structure', arguments: {} });
    const content = result.content as Array<{ type: string; text: string }>;
    const tree = JSON.parse(content[0].text);

    expect(tree).toHaveLength(1);
    expect(tree[0].name).toBe('src');
    expect(tree[0].children).toHaveLength(3);
  });

  it('tesnel_get_structure respects depth limit', async () => {
    const result = await client.callTool({ name: 'tesnel_get_structure', arguments: { depth: 1 } });
    const content = result.content as Array<{ type: string; text: string }>;
    const tree = JSON.parse(content[0].text);

    expect(tree[0].children).toEqual([]);
  });

  it('tesnel_get_file_info returns imports and importedBy', async () => {
    const result = await client.callTool({ name: 'tesnel_get_file_info', arguments: { path: 'src/a.ts' } });
    const content = result.content as Array<{ type: string; text: string }>;
    const info = JSON.parse(content[0].text);

    expect(info.path).toBe('src/a.ts');
    expect(info.imports).toEqual([{ to: 'src/b.ts', type: 'static-import' }]);
    expect(info.importedBy).toHaveLength(2);
    expect(info.inCycle).toBe(true);
  });

  it('tesnel_get_file_info returns error for unknown file', async () => {
    const result = await client.callTool({ name: 'tesnel_get_file_info', arguments: { path: 'src/unknown.ts' } });

    expect(result.isError).toBe(true);
  });

  it('tesnel_get_cycles returns cycle list', async () => {
    const result = await client.callTool({ name: 'tesnel_get_cycles', arguments: {} });
    const content = result.content as Array<{ type: string; text: string }>;
    const data = JSON.parse(content[0].text);

    expect(data.totalCycles).toBe(1);
    expect(data.cycles[0]).toEqual(['src/a.ts', 'src/b.ts', 'src/a.ts']);
  });

  it('tesnel_get_metrics returns summary and modules', async () => {
    const result = await client.callTool({ name: 'tesnel_get_metrics', arguments: {} });
    const content = result.content as Array<{ type: string; text: string }>;
    const data = JSON.parse(content[0].text);

    expect(data.summary.maxDistance).toBe(1);
    expect(data.summary.modulesInPainZone).toBe(1);
    expect(data.modules).toHaveLength(2);
    expect(data.modules[0].path).toBe('lib');
  });

  it('tesnel_get_metrics supports sort_by parameter', async () => {
    const result = await client.callTool({ name: 'tesnel_get_metrics', arguments: { sort_by: 'fanIn' } });
    const content = result.content as Array<{ type: string; text: string }>;
    const data = JSON.parse(content[0].text);

    expect(data.modules[0].fanIn).toBeGreaterThanOrEqual(data.modules[1].fanIn);
  });
});
