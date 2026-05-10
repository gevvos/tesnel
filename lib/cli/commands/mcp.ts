import { resolve } from 'path';
import { startServer } from '../../mcp/server.js';

type McpOptions = {
  data?: string;
};

export const mcpCommand = async (options: McpOptions) => {
  const dataPath = resolve(options.data || '.tesnel/output.json');
  await startServer(dataPath);
};
