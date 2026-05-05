import { resolve, dirname } from 'path';
import { existsSync, statSync, readdirSync } from 'fs';
import { resolveFilePath } from '../analyzer/src/resolver.js';

const SUPPORTED_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.vue', '.mjs']);

export const findProjectRoot = (startDir: string): string => {
  let dir = startDir;
  while (dir !== dirname(dir)) {
    if (existsSync(resolve(dir, 'package.json'))) return dir;
    dir = dirname(dir);
  }
  return startDir;
};

export const collectFiles = (dir: string): string[] => {
  const files: string[] = [];
  const walk = (d: string) => {
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist') continue;
      const fullPath = resolve(d, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else {
        const ext = '.' + entry.name.split('.').pop();
        if (SUPPORTED_EXTENSIONS.has(ext)) {
          files.push(fullPath);
        }
      }
    }
  };
  walk(dir);
  return files;
};

export type ResolvedEntry = {
  files: string[];
  root: string;
};

export const resolveEntry = (entry: string): ResolvedEntry => {
  const entryPath = resolve(process.cwd(), entry);

  if (existsSync(entryPath) && statSync(entryPath).isDirectory()) {
    const root = findProjectRoot(entryPath);
    const files = collectFiles(entryPath);
    if (files.length === 0) {
      console.error(`Error: no source files found in "${entry}"`);
      process.exit(1);
    }
    return { files, root };
  }

  const entryResolved = resolveFilePath(process.cwd(), entry);
  if (!entryResolved.path) {
    console.error(`Error: cannot resolve entry "${entry}"`);
    process.exit(1);
  }
  if (!existsSync(entryResolved.path)) {
    console.error(`Error: file not found "${entryResolved.path}"`);
    process.exit(1);
  }

  return { files: [entryResolved.path], root: findProjectRoot(dirname(entryResolved.path)) };
};
