import { describe, it, expect } from 'vitest';
import { resolve } from 'path';
import { writeFileSync, mkdirSync } from 'fs';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createServer } from '../../mcp/server.js';

const tmpDir = resolve(__dirname, '../../../.tmp-test-mcp-cmd');
const testDataPath = resolve(tmpDir, 'output.json');

describe('mcpCommand', () => {
  it('starts server that works with valid data path', async () => {
    mkdirSync(tmpDir, { recursive: true });
    writeFileSync(testDataPath, JSON.stringify({
      meta: { version: '0.1.0', entry: './index.ts', root: '/', generatedAt: '', totalFiles: 1, totalEdges: 0, totalCycles: 0 },
      tree: [], graph: { nodes: [{ id: 'index.ts', directory: '.' }], edges: [] }, cycles: [], errors: [],
    }));

    const server = createServer(testDataPath);
    const [ct, st] = InMemoryTransport.createLinkedPair();
    await server.connect(st);
    const client = new Client({ name: 'test', version: '1.0.0' });
    await client.connect(ct);

    const result = await client.callTool({ name: 'tesnel_get_stats', arguments: {} });
    const content = result.content as Array<{ type: string; text: string }>;
    const meta = JSON.parse(content[0].text);

    expect(meta.totalFiles).toBe(1);
    expect(meta.entry).toBe('./index.ts');
  });

  it('starts server even without data file', async () => {
    const server = createServer('/nonexistent/output.json');
    const [ct, st] = InMemoryTransport.createLinkedPair();
    await server.connect(st);
    const client = new Client({ name: 'test', version: '1.0.0' });
    await client.connect(ct);

    const result = await client.callTool({ name: 'tesnel_get_stats', arguments: {} });

    expect(result.isError).toBe(true);
    const content = result.content as Array<{ type: string; text: string }>;
    expect(content[0].text).toContain('tesnel analyze');
  });
});
