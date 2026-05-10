---
name: tesnel
description: "Analyze project dependencies, architecture metrics, and circular dependencies using tesnel. Use when the user asks about project structure, imports, coupling, cycles, or architecture quality."
when_to_use:
  - "analyze dependencies"
  - "show dependency graph"
  - "find circular dependencies"
  - "check architecture"
  - "what imports this file"
  - "what does this file depend on"
  - "project structure"
  - "coupling analysis"
  - "architecture metrics"
  - "instability"
  - "abstractness"
  - "zone of pain"
---

# tesnel — dependency graph analysis

You have access to tesnel MCP tools that provide structured information about the project's dependency graph. Use them instead of manually reading files to understand project architecture.

## Before using MCP tools

The MCP tools require analysis data. If a tool returns an error about missing data, tell the user to run:

```bash
npx @gevvos/tesnel analyze ./src/main.ts
```

Replace the entry point with the actual project entry. After analysis, the tools will work.

## Available MCP tools

Use these tools to answer questions about project architecture:

### `tesnel_get_stats`
Project overview. Call this first to understand the scale: file count, edge count, cycle count, entry point.

### `tesnel_get_structure`
Directory tree of the analyzed project. Use the `depth` parameter to limit nesting for large projects. Good for understanding module boundaries.

### `tesnel_get_file_info`
What a specific file imports and what imports it. Pass relative file path (e.g. `src/utils/helpers.ts`). Shows:
- Direct imports (dependencies)
- Reverse imports (dependents — who uses this file)
- Whether the file is part of a circular dependency

### `tesnel_get_cycles`
All circular dependencies in the project. Each cycle is a chain of files that form a loop. Use this to identify and fix import cycles.

### `tesnel_get_metrics`
Architecture metrics per directory based on Robert Martin's Clean Architecture:
- **Instability (I)** — how likely a module is to change (0 = stable, 1 = unstable)
- **Abstractness (A)** — ratio of type-only imports (0 = concrete, 1 = abstract)
- **Distance (D)** — distance from the ideal Main Sequence (lower is better)
- **Zone of Pain** — concrete + stable modules that are hard to change
- **Zone of Uselessness** — abstract + unstable modules that nobody uses

Use `sort_by` parameter: `distance`, `instability`, `abstractness`, `fanIn`, `fanOut`.

## How to respond

When analyzing architecture:
1. Start with `tesnel_get_stats` for the big picture
2. Use `tesnel_get_cycles` if cycles are a concern
3. Use `tesnel_get_metrics` to identify problematic modules
4. Drill into specific files with `tesnel_get_file_info`

When the user asks about a specific file:
1. Use `tesnel_get_file_info` with the file path
2. Explain imports and dependents in context

When the user asks about overall health:
1. Get stats, cycles, and metrics
2. Summarize: cycle count, modules in Zone of Pain, highest distance scores
3. Recommend specific actions (break cycles, reduce coupling)
