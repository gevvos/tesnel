import { resolve } from 'path';
import { existsSync } from 'fs';
import { startServer } from '../../mcp/server';

type McpOptions = {
  data?: string;
};

export const mcpCommand = async (options: McpOptions) => {
  const dataPath = resolve(options.data || './tesnel-output.json');

  if (!existsSync(dataPath)) {
    console.error(`Error: tesnel data not found at "${dataPath}"`);
    console.error('Run "tesnel analyze <entry>" first to generate the data.');
    process.exit(1);
  }

  await startServer(dataPath);
};
