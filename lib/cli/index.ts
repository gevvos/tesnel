#!/usr/bin/env node
import cac from 'cac';
import { analyzeCommand } from './commands/analyze.js';
import { lintCommand } from './commands/lint.js';
import { mcpCommand } from './commands/mcp.js';

const cli = cac('tesnel');

cli
  .command('analyze <entry>', 'Analyze project dependencies')
  .option('-o, --output <path>', 'Output JSON path (default: .tesnel/output.json)')
  .option('-d, --depth <depth>', 'Limit traversal depth')
  .option('--no-html', 'Skip HTML generation')
  .action(analyzeCommand);

cli
  .command('lint <entry>', 'Check for circular dependencies (exit code 1 if found)')
  .option('-d, --depth <depth>', 'Limit traversal depth')
  .action(lintCommand);

cli
  .command('mcp', 'Start MCP server for Claude Code integration')
  .option('--data <path>', 'Path to tesnel JSON (default: .tesnel/output.json)')
  .action(mcpCommand);

cli.help();
cli.version('0.1.0');

cli.parse();
