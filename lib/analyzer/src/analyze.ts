import { parseFile } from './parser';
import { resolveFilePath } from './resolver';

type AnalyzeProjectConfig = {
  entry: string;
};

export const analyzeProject = async (config: AnalyzeProjectConfig) => {
   const entryFile = resolveFilePath(process.cwd(), config.entry);

   if (!entryFile.path) {
    return;
   }

   const parsedFileData = await parseFile(entryFile.path);

   console.log(parsedFileData);
}