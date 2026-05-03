import { parseSync } from 'oxc-parser';
import { readFileSync } from 'fs';

export type TesnelFileParseResult = {
  name: string;
  imports: string[];
  reExports: string[];
  errors: string[];
};

const getFileNameFromPath = (path: string) => {
  const parts = path.split('/');
  return parts[parts.length - 1];
};

export const parseFile = (path: string): TesnelFileParseResult => {
  const fileName = getFileNameFromPath(path);
  const sourceText = readFileSync(path, 'utf8');

  const ast = parseSync(fileName, sourceText);

  if (ast.errors.length > 0) {
    return {
      name: fileName,
      imports: [],
      reExports: [],
      errors: ast.errors.map(e => e.message),
    };
  }

  const imports = ast.module.staticImports.map(i => i.moduleRequest.value);

  const reExports: string[] = [];
  for (const exp of ast.module.staticExports) {
    for (const entry of exp.entries) {
      if (entry.moduleRequest) {
        reExports.push(entry.moduleRequest.value);
        break;
      }
    }
  }

  return { name: fileName, imports, reExports, errors: [] };
};

export const parseSource = (fileName: string, source: string): TesnelFileParseResult => {
  const ast = parseSync(fileName, source);

  if (ast.errors.length > 0) {
    return {
      name: fileName,
      imports: [],
      reExports: [],
      errors: ast.errors.map(e => e.message),
    };
  }

  const imports = ast.module.staticImports.map(i => i.moduleRequest.value);

  const reExports: string[] = [];
  for (const exp of ast.module.staticExports) {
    for (const entry of exp.entries) {
      if (entry.moduleRequest) {
        reExports.push(entry.moduleRequest.value);
        break;
      }
    }
  }

  return { name: fileName, imports, reExports, errors: [] };
};
