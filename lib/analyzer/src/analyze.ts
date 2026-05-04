import { parseFile } from './parser.js';
import { resolveFilePath } from './resolver.js';

type AnalyzeProjectConfig = {
  entry: string;
};

export const analyzeProject = async (config: AnalyzeProjectConfig) => {
  const entryFile = resolveFilePath(process.cwd(), config.entry);

  if (!entryFile.path) {
    return;
  }

  parseFile(entryFile.path);
};
