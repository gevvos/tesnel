import { parseSync } from 'oxc-parser';
import { readFileSync } from 'fs';
import { parse as parseSFC } from '@vue/compiler-sfc';

export type ExportEntry = {
  name: string;
  isType: boolean;
};

export type FileStats = {
  loc: number;
  complexity: number;
  functions: number;
  maxNesting: number;
  exports: ExportEntry[];
};

const BRANCH_TYPES = new Set([
  'IfStatement',
  'ForStatement',
  'ForInStatement',
  'ForOfStatement',
  'WhileStatement',
  'DoWhileStatement',
  'CatchClause',
]);

const FUNCTION_TYPES = new Set([
  'FunctionDeclaration',
  'FunctionExpression',
  'ArrowFunctionExpression',
]);

const walkAst = (node: any, depth: number, stats: { complexity: number; functions: number; maxNesting: number }) => {
  if (!node || typeof node !== 'object') return;
  if (!node.type) {
    for (const val of Object.values(node)) {
      if (Array.isArray(val)) val.forEach(v => walkAst(v, depth, stats));
      else if (val && typeof val === 'object') walkAst(val, depth, stats);
    }
    return;
  }

  if (FUNCTION_TYPES.has(node.type)) stats.functions++;

  if (BRANCH_TYPES.has(node.type)) {
    stats.complexity++;
    depth++;
    if (depth > stats.maxNesting) stats.maxNesting = depth;
  }

  if (node.type === 'SwitchCase' && node.test !== null) stats.complexity++;
  if (node.type === 'ConditionalExpression') stats.complexity++;
  if (node.type === 'LogicalExpression') stats.complexity++;

  for (const [key, val] of Object.entries(node)) {
    if (key === 'type' || key === 'start' || key === 'end') continue;
    if (Array.isArray(val)) val.forEach(v => walkAst(v, depth, stats));
    else if (val && typeof val === 'object' && (val as any).type) walkAst(val, depth, stats);
  }
};

const extractExports = (ast: any): ExportEntry[] => {
  const exports: ExportEntry[] = [];
  for (const exp of ast.module.staticExports) {
    for (const entry of exp.entries) {
      const name = entry.exportName?.name ?? (entry.exportName?.kind === 'Default' ? 'default' : null);
      if (name) exports.push({ name, isType: entry.isType });
    }
  }
  return exports;
};

const computeFromSource = (fileName: string, source: string): FileStats => {
  const loc = source.split('\n').length;
  const ast = parseSync(fileName, source);

  if (ast.errors.length > 0) {
    return { loc, complexity: 0, functions: 0, maxNesting: 0, exports: [] };
  }

  const stats = { complexity: 0, functions: 0, maxNesting: 0 };
  walkAst(ast.program, 0, stats);

  return { loc, ...stats, exports: extractExports(ast) };
};

export const computeFileStats = (absPath: string): FileStats => {
  const source = readFileSync(absPath, 'utf8');

  if (absPath.endsWith('.vue')) {
    const { descriptor, errors } = parseSFC(source, { filename: absPath });
    if (errors.length > 0) return { loc: source.split('\n').length, complexity: 0, functions: 0, maxNesting: 0, exports: [] };

    const script = descriptor.scriptSetup || descriptor.script;
    if (!script) return { loc: source.split('\n').length, complexity: 0, functions: 0, maxNesting: 0, exports: [] };

    const lang = script.lang || 'js';
    const result = computeFromSource(`file.${lang}`, script.content);
    result.loc = source.split('\n').length;
    return result;
  }

  const fileName = absPath.split('/').pop()!;
  return computeFromSource(fileName, source);
};
