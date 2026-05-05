# CLAUDE.md

## Rules

- Never edit README.hy.md — Armenian text generation is unreliable. Only the user edits this file.
- All relative imports in `lib/` must use `.js` extensions (`import { foo } from './bar.js'`). Required by nodenext moduleResolution.
- No default exports. Named exports only.
- Arrow functions, not function declarations. Types via `type`, not `interface`.
- Conventional Commits: `feat:`, `fix:`, `docs:`, `test:`, `refactor:`.

## Commands

```bash
pnpm dev analyze ./path       # Run CLI without building
pnpm test                     # Run tests (98 tests, ~1s)
pnpm lint                     # oxlint (default rules, no config)
pnpm build                    # Full build: UI first, then lib
pnpm build:ui                 # Build UI only (needed before some tests)
```

Build order: `build:ui` must run before `test` (html-generator test needs UI template).

## Architecture

CLI (cac) → Analyzer (oxc-parser + oxc-resolver) → Output (JSON + HTML) → MCP Server (stdio)

```
lib/
  cli/            # CLI entry, commands: analyze, mcp
  analyzer/src/   # parser, resolver, graph-builder, cycle-detector, vue-parser, nuxt-auto-imports
  output/         # json-writer, html-generator
  mcp/            # MCP server (4 tools: stats, structure, file_info, cycles)
  types.ts        # Shared types: TesnelOutput, TreeNode
  index.ts        # Public API barrel
ui/               # Vue 3 + D3 + ELK.js visualization (separate Vite config, builds to single HTML)
tests/fixtures/   # simple, circular, re-exports, type-imports, vue-project
```

Two Vite configs: `/vite.config.js` (library) and `/ui/vite.config.ts` (UI).

## Code style

- Files: kebab-case. Functions: camelCase. Types: PascalCase.
- `zod` imported as `import { z } from 'zod/v4'`
- Node builtins without `node:` prefix: `import { resolve } from 'path'`
- Tests co-located as `*.test.ts` next to source. Import `describe`, `it`, `expect` from `vitest`.
- Fixture paths via: `const fixture = (...parts: string[]) => resolve(__dirname, '../../../tests/fixtures', ...parts)`
- Functions return error arrays, not throw. Empty catch blocks for non-critical file ops.

## CI

- Runs on push/PR to main. Matrix: Node 20 + 22.
- Pipeline: lint → build:ui → test → build.
- Releases via release-please + npm publish (Node 22, needs NPM_TOKEN).

## Stack

oxc-parser (AST), oxc-resolver (module resolution), @vue/compiler-sfc (Vue SFC), cac (CLI), @modelcontextprotocol/sdk (MCP), Vue 3 + D3 + ELK.js (UI), Vite (build), Vitest (test), oxlint (lint). pnpm 10.28.1, Node >=20, ESM.
