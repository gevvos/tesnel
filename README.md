# tesnel

Static dependency graph analyzer and visualizer for TypeScript, JavaScript, and Vue projects.

> **tesnel** (տեսնել) — "to see" in Armenian.

[Русский](./README.ru.md)

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

Output: `tesnel-output.json` + `tesnel-output.html`

### Open the visualization

Open `tesnel-output.html` in any browser. No server needed.

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

### MCP server (Claude Code)

```bash
# Start MCP server (reads tesnel-output.json from CWD)
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
