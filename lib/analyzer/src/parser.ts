import { parseSync, type ParseResult } from 'oxc-parser';
import { readFileSync } from 'fs';

export type TesnelFileParseResult = {
  name: string;
  imports: string[];
  typeImports: string[];
  reExports: string[];
  importSymbols: Record<string, string[]>;
  errors: string[];
};

const getFileNameFromPath = (path: string) => {
  const parts = path.split('/');
  return parts[parts.length - 1];
};

const extractImports = (ast: ParseResult): { imports: string[]; typeImports: string[]; importSymbols: Record<string, string[]> } => {
  const imports: string[] = [];
  const typeImports: string[] = [];
  const importSymbols: Record<string, string[]> = {};

  for (const imp of ast.module.staticImports) {
    const specifier = imp.moduleRequest.value;
    const allType = imp.entries.every((e) => e.isType);
    if (allType) {
      typeImports.push(specifier);
    } else {
      imports.push(specifier);
    }

    const names = imp.entries
      .map((e: any) => e.importName?.name ?? (e.importName?.kind === 'Default' ? 'default' : null))
      .filter(Boolean) as string[];
    if (names.length > 0) importSymbols[specifier] = names;
  }

  return { imports, typeImports, importSymbols };
};

const extractReExports = (ast: ParseResult, importSymbols: Record<string, string[]>): string[] => {
  const reExports: string[] = [];
  const seen = new Set<string>();
  for (const exp of ast.module.staticExports) {
    for (const entry of exp.entries) {
      if (entry.moduleRequest) {
        const specifier = entry.moduleRequest.value;
        if (!seen.has(specifier)) {
          reExports.push(specifier);
          seen.add(specifier);
        }
        const name = entry.exportName?.name ?? (entry.exportName?.kind === 'Default' ? 'default' : null);
        if (name) {
          if (!importSymbols[specifier]) importSymbols[specifier] = [];
          if (!importSymbols[specifier].includes(name)) importSymbols[specifier].push(name);
        }
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
    return { name: fileName, imports: [], typeImports: [], reExports: [], importSymbols: {}, errors: ast.errors.map(e => e.message) };
  }

  const { imports, typeImports, importSymbols } = extractImports(ast);
  return { name: fileName, imports, typeImports, reExports: extractReExports(ast, importSymbols), importSymbols, errors: [] };
};

export const parseSource = (fileName: string, source: string): TesnelFileParseResult => {
  const ast = parseSync(fileName, source);

  if (ast.errors.length > 0) {
    return { name: fileName, imports: [], typeImports: [], reExports: [], importSymbols: {}, errors: ast.errors.map(e => e.message) };
  }

  const { imports, typeImports, importSymbols } = extractImports(ast);
  return { name: fileName, imports, typeImports, reExports: extractReExports(ast, importSymbols), importSymbols, errors: [] };
};
