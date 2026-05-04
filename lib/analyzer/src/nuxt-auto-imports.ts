import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

export type AutoImportMap = Map<string, string>;

const parseImportsDeclaration = (content: string, nuxtDir: string): AutoImportMap => {
  const map: AutoImportMap = new Map();
  const importRegex = /const\s+(\w+):\s*typeof\s+import\(['"]([^'"]+)['"]\)/g;

  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const [, name, importPath] = match;
    const resolved = resolve(nuxtDir, 'types', importPath);

    if (!resolved.includes('node_modules')) {
      map.set(name, importPath);
    }
  }

  return map;
};

export const loadNuxtAutoImports = (projectRoot: string): AutoImportMap | null => {
  const nuxtConfig = resolve(projectRoot, 'nuxt.config.ts');
  if (!existsSync(nuxtConfig)) return null;

  const nuxtDir = resolve(projectRoot, '.nuxt');
  const importsFile = resolve(nuxtDir, 'types/imports.d.ts');
  if (!existsSync(importsFile)) return null;

  const content = readFileSync(importsFile, 'utf8');
  return parseImportsDeclaration(content, nuxtDir);
};

export const resolveAutoImportPath = (
  name: string,
  autoImports: AutoImportMap,
  nuxtTypesDir: string,
): string | null => {
  const importPath = autoImports.get(name);
  if (!importPath) return null;
  return resolve(nuxtTypesDir, importPath);
};
