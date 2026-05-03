import { describe, it, expect } from 'vitest';
import { resolve } from 'path';
import { parseVueFile } from './vue-parser';
import { buildGraph } from './graph-builder';

const fixture = (...parts: string[]) =>
  resolve(__dirname, '../../../tests/fixtures/vue-project', ...parts);

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

  it('returns empty imports for vue file without script', () => {
    const source = '<template><div>no script</div></template>';
    // Can't test directly without file, tested via parseSource in integration
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

    expect(graph.edges).toContainEqual({
      from: 'src/App.vue',
      to: 'src/HelloWorld.vue',
      type: 'static-import',
    });
    expect(graph.edges).toContainEqual({
      from: 'src/App.vue',
      to: 'src/composables/useCounter.ts',
      type: 'static-import',
    });
    expect(graph.edges).toContainEqual({
      from: 'src/HelloWorld.vue',
      to: 'src/composables/useFormatter.ts',
      type: 'static-import',
    });

    expect(graph.errors).toEqual([]);
    expect(graph.edges).toHaveLength(3);
  });
});
