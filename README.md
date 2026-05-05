# tesnel

<div align="right"><a href="./README.ru.md">Русский</a></div>

> Built with [Claude Code](https://claude.ai/code)

[![npm version](https://img.shields.io/npm/v/tesnel)](https://www.npmjs.com/package/tesnel)
[![CI](https://github.com/gevvos/tesnel/actions/workflows/ci.yml/badge.svg)](https://github.com/gevvos/tesnel/actions/workflows/ci.yml)
[![License: ISC](https://img.shields.io/badge/license-ISC-blue.svg)](./LICENSE)

**Static source-level dependency graph analyzer and visualizer** for TypeScript, JavaScript, and Vue projects.

> **tesnel** (տեսնել, pronounced *tes-nel*) — "to see" in Armenian.

## Why

Understanding how files depend on each other in a large codebase is hard. IDE tools show imports for one file at a time, but they don't reveal the full picture — which modules are tightly coupled, where circular dependencies hide, or how a change in one file ripples through the project.

**tesnel** analyzes your source code **before any build step** — no bundler, no compilation, no dev server needed. It reads raw `.ts`, `.vue`, and `.js` files, resolves imports (including tsconfig aliases and Nuxt auto-imports), and produces an interactive graph you can explore in the browser.

It's fast: **290 files analyzed in ~400ms**, output is a single self-contained HTML.

Use it to:
- **Audit architecture** — see the real dependency structure, not what you think it is
- **Find circular dependencies** — before they cause subtle bugs or prevent tree-shaking
- **Onboard to a codebase** — understand module boundaries and key hub files at a glance
- **Review refactors** — verify that a restructuring actually reduced coupling
- **Filter noise** — hide test files, type-only imports, or unrelated modules to focus on what matters

### For AI coding agents

tesnel includes an MCP server that gives AI agents (Claude Code, etc.) structured access to the dependency graph. Without it, an agent has to read files one by one — hundreds of tool calls and tens of thousands of tokens just to understand project structure. With tesnel, one MCP call returns the full picture: what imports what, who depends on a given file, where the cycles are. It's the difference between walking through a city street by street and looking at a map.

## Features

- **Recursive dependency analysis** from entry point or directory
- **Interactive graph visualization** — nested directories, file nodes, dependency arrows
- **Cycle detection** — circular dependencies highlighted in red
- **Type-import distinction** — dashed lines for `import type`, toggleable
- **Depth control** — collapse/expand directory nesting
- **Filters** — isolate selected file, show cycles only, exclude by pattern
- **Vue SFC support** — parses `<script setup>` from `.vue` files
- **Nuxt support** — detects auto-imported composables and stores via `.nuxt/types/`
- **Nest.js support** — works out of the box with explicit imports
- **tsconfig paths** — resolves `@/`, `~/`, and custom aliases
- **Cycle linting** — `tesnel lint` with exit code 1 for CI pipelines
- **MCP server** — Claude Code integration for querying the dependency graph
- **Single HTML output** — self-contained, works offline via `file://`

## Install

```bash
npm install -g tesnel
# or
pnpm add -g tesnel
```

## Usage

### Analyze a project

```bash
# From entry file
tesnel analyze ./src/main.ts

# From directory (all .ts/.vue/.js files)
tesnel analyze ./src

# Custom output path
tesnel analyze ./src/main.ts -o deps.json

# Limit traversal depth
tesnel analyze ./src/main.ts --depth 3

# JSON only, no HTML
tesnel analyze ./src/main.ts --no-html
```

Output: `.tesnel/output.json` + `.tesnel/output.html`

### Open the visualization

Open `.tesnel/output.html` in any browser. No server needed.

**Controls:**
- **Zoom** — scroll or +/- buttons
- **Pan** — click and drag
- **Depth slider** — collapse directories
- **Click file** — show imports/importedBy in sidebar
- **Search** — find files by name
- **Hide unrelated** — isolate selected file's connections
- **Cycles only** — show only circular dependencies
- **Exclude** — hide files matching pattern (e.g. `__tests__, .spec`)
- **Type imports** — toggle type-only imports (dashed lines)

### Lint for circular dependencies

```bash
# Check from entry file
tesnel lint ./src/main.ts

# Check entire directory
tesnel lint ./src

# Limit traversal depth
tesnel lint ./src --depth 3
```

Exits with code 0 if no cycles found, code 1 otherwise. Useful in CI pipelines:

```yaml
- run: tesnel lint ./src
```

### MCP server (Claude Code)

```bash
# Start MCP server (reads .tesnel/output.json from CWD)
tesnel mcp

# Or specify data path
tesnel mcp --data ./deps.json
```

Add to `.mcp.json` or Claude Code settings:

```json
{
  "mcpServers": {
    "tesnel": {
      "command": "npx",
      "args": ["tesnel", "mcp"]
    }
  }
}
```

**Available tools:**

| Tool | Description |
|------|-------------|
| `tesnel_get_stats` | Project overview: files, edges, cycles |
| `tesnel_get_structure` | Directory tree (with depth limit) |
| `tesnel_get_file_info` | Imports and importedBy for a file |
| `tesnel_get_cycles` | All circular dependencies |

## Supported projects

| Framework | How it works |
|-----------|-------------|
| **React** | Explicit imports — works out of the box |
| **Vue** | `.vue` SFC parsed via `@vue/compiler-sfc` |
| **Nuxt** | Auto-imports detected from `.nuxt/types/imports.d.ts` |
| **Nest.js** | Explicit imports — works out of the box |
| **Angular** | Standard TS imports — works out of the box |
| **Any TS/JS** | Static imports and re-exports |

## Graph legend

| Visual | Meaning |
|--------|---------|
| Dashed border, gray accent | Directory |
| Solid border, green left bar | `.vue` file |
| Solid border, blue left bar | `.ts` / `.tsx` file |
| Solid border, yellow left bar | `.js` / `.jsx` file |
| Solid arrow | Runtime import |
| Dashed arrow | Type-only import |
| Red arrow | Circular dependency |
| Blue arrow | Selected file's connections |

## Development

```bash
pnpm install
pnpm test          # run tests
pnpm build         # build UI + CLI
pnpm dev analyze ./src/main.ts  # run CLI in dev mode
```

## Tech stack

- [oxc-parser](https://www.npmjs.com/package/oxc-parser) — fast AST parsing
- [oxc-resolver](https://github.com/oxc-project/oxc-resolver) — module resolution with tsconfig support
- [ELK.js](https://github.com/kieler/elkjs) — hierarchical graph layout
- [Vue 3](https://vuejs.org) + [D3.js](https://d3js.org) — interactive visualization
- [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/typescript-sdk) — MCP server
- [Vite](https://vite.dev) — build tooling
- [Vitest](https://vitest.dev) — testing

## License

ISC
