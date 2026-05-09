import { describe, it, expect, afterAll } from 'vitest';
import { resolve } from 'path';
import { writeFileSync, unlinkSync } from 'fs';
import { parseVueFile } from './vue-parser.js';
import { buildGraph } from './graph-builder.js';

const fixture = (...parts: string[]) =>
  resolve(__dirname, '../../../tests/fixtures/vue-project', ...parts);

const tmpFiles: string[] = [];
const writeTmpVue = (name: string, content: string): string => {
  const path = fixture(`src/${name}`);
  writeFileSync(path, content);
  tmpFiles.push(path);
  return path;
};
afterAll(() => { tmpFiles.forEach(f => { try { unlinkSync(f); } catch {} }); });

describe('parseVueFile', () => {
  it('extracts imports from <script setup lang="ts">', () => {
    const result = parseVueFile(fixture('src/App.vue'));

    expect(result.name).toBe('App.vue');
    expect(result.imports).toContain('./HelloWorld.vue');
    expect(result.imports).toContain('./composables/useCounter');
    expect(result.errors).toEqual([]);
  });

  it('extracts imports from nested vue component', () => {
    const result = parseVueFile(fixture('src/HelloWorld.vue'));

    expect(result.imports).toContain('./composables/useFormatter');
  });

  it('returns empty result with typeImports for vue file without script', () => {
    const path = writeTmpVue('__no_script.vue', '<template><div>no script</div></template>');
    const result = parseVueFile(path);

    expect(result.imports).toEqual([]);
    expect(result.typeImports).toEqual([]);
    expect(result.reExports).toEqual([]);
    expect(result.errors).toEqual([]);
  });

  it('always includes typeImports field', () => {
    const result = parseVueFile(fixture('src/App.vue'));

    expect(result.typeImports).toBeDefined();
    expect(Array.isArray(result.typeImports)).toBe(true);
  });

  it('returns errors for malformed vue template', () => {
    const path = writeTmpVue('__malformed.vue', '<template><div></template>');
    const result = parseVueFile(path);

    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.imports).toEqual([]);
  });

  it('handles script without setup', () => {
    const path = writeTmpVue('__options.vue', `
<template><div>options api</div></template>
<script lang="ts">
import { ref } from 'vue';
import { helper } from './composables/useCounter';
export default { setup() { return { count: ref(0) }; } };
</script>`);
    const result = parseVueFile(path);

    expect(result.imports).toContain('./composables/useCounter');
  });

  it('extracts type imports from vue files', () => {
    const path = writeTmpVue('__typed.vue', `
<template><div>typed</div></template>
<script setup lang="ts">
import type { Ref } from 'vue';
import { ref } from 'vue';
import type { User } from './composables/useCounter';
</script>`);
    const result = parseVueFile(path);

    expect(result.typeImports).toContain('./composables/useCounter');
  });

  it('extracts re-exports from script', () => {
    const path = writeTmpVue('__reexport.vue', `
<template><div>re-export</div></template>
<script setup lang="ts">
export { helper } from './composables/useCounter';
</script>`);
    const result = parseVueFile(path);

    expect(result.reExports).toContain('./composables/useCounter');
  });
});

describe('buildGraph with .vue files', () => {
  it('traverses vue project correctly', () => {
    const entry = fixture('src/App.vue');
    const root = resolve(__dirname, '../../../tests/fixtures/vue-project');
    const graph = buildGraph(entry, root);

    const nodeIds = graph.nodes.map(n => n.id).sort();
    expect(nodeIds).toEqual([
      'src/App.vue',
      'src/HelloWorld.vue',
      'src/composables/useCounter.ts',
      'src/composables/useFormatter.ts',
    ]);

    expect(graph.edges).toContainEqual(expect.objectContaining({
      from: 'src/App.vue',
      to: 'src/HelloWorld.vue',
      type: 'static-import',
    }));
    expect(graph.edges).toContainEqual(expect.objectContaining({
      from: 'src/App.vue',
      to: 'src/composables/useCounter.ts',
      type: 'static-import',
    }));
    expect(graph.edges).toContainEqual(expect.objectContaining({
      from: 'src/HelloWorld.vue',
      to: 'src/composables/useFormatter.ts',
      type: 'static-import',
    }));

    expect(graph.errors).toEqual([]);
    expect(graph.edges).toHaveLength(3);
  });
});
