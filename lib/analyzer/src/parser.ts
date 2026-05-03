import { parseSync } from 'oxc-parser';
import { readFileSync } from 'fs';

export type TesnelFileParseResult = {
  name: string;
  imports: string[];
  typeImports: string[];
  reExports: string[];
  errors: string[];
};

const getFileNameFromPath = (path: string) => {
  const parts = path.split('/');
  return parts[parts.length - 1];
};

const extractImports = (ast: any): { imports: string[]; typeImports: string[] } => {
  const imports: string[] = [];
  const typeImports: string[] = [];

  for (const imp of ast.module.staticImports) {
    const specifier = imp.moduleRequest.value;
    const allType = imp.entries.every((e: any) => e.isType);
    if (allType) {
      typeImports.push(specifier);
    } else {
      imports.push(specifier);
    }
  }

  return { imports, typeImports };
};

const extractReExports = (ast: any): string[] => {
  const reExports: string[] = [];
  for (const exp of ast.module.staticExports) {
    for (const entry of exp.entries) {
      if (entry.moduleRequest) {
        reExports.push(entry.moduleRequest.value);
        break;
      }
    }
  }
  return reExports;
};

export const parseFile = (path: string): TesnelFileParseResult => {
  const fileName = getFileNameFromPath(path);
  const sourceText = readFileSync(path, 'utf8');
  const ast = parseSync(fileName, sourceText);

  if (ast.errors.length > 0) {
    return { name: fileName, imports: [], typeImports: [], reExports: [], errors: ast.errors.map(e => e.message) };
  }

  const { imports, typeImports } = extractImports(ast);
  return { name: fileName, imports, typeImports, reExports: extractReExports(ast), errors: [] };
};

export const parseSource = (fileName: string, source: string): TesnelFileParseResult => {
  const ast = parseSync(fileName, source);

  if (ast.errors.length > 0) {
    return { name: fileName, imports: [], typeImports: [], reExports: [], errors: ast.errors.map(e => e.message) };
  }

  const { imports, typeImports } = extractImports(ast);
  return { name: fileName, imports, typeImports, reExports: extractReExports(ast), errors: [] };
};
