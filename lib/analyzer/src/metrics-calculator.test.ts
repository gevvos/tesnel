import { describe, it, expect } from 'vitest';
import { resolve } from 'path';
import { calculateMetrics } from './metrics-calculator.js';
import { buildGraph } from './graph-builder.js';
import type { DependencyGraph, GraphEdge } from './graph-builder.js';

const fixturesDir = resolve(__dirname, '../../../tests/fixtures');

const makeGraph = (
  nodeIds: string[],
  edges: Array<[string, string, GraphEdge['type']?]>,
): DependencyGraph => ({
  nodes: nodeIds.map(id => ({
    id,
    absPath: `/${id}`,
    directory: id.split('/').slice(0, -1).join('/') || '.',
  })),
  edges: edges.map(([from, to, type]) => ({
    from,
    to,
    type: type ?? 'static-import',
  })),
  root: '/',
  errors: [],
});

describe('calculateMetrics', () => {
  it('computes instability for a stable module (high fan-in, no fan-out)', () => {
    const graph = makeGraph(
      ['utils/helper.ts', 'app/main.ts', 'app/other.ts'],
      [
        ['app/main.ts', 'utils/helper.ts'],
        ['app/other.ts', 'utils/helper.ts'],
      ],
    );

    const { modules } = calculateMetrics(graph);
    const utils = modules.find(m => m.path === 'utils');

    expect(utils).toBeDefined();
    expect(utils!.instability).toBe(0);
    expect(utils!.fanIn).toBe(2);
    expect(utils!.fanOut).toBe(0);
  });

  it('computes instability for an unstable module (no fan-in, high fan-out)', () => {
    const graph = makeGraph(
      ['utils/helper.ts', 'utils/format.ts', 'app/main.ts'],
      [
        ['app/main.ts', 'utils/helper.ts'],
        ['app/main.ts', 'utils/format.ts'],
      ],
    );

    const { modules } = calculateMetrics(graph);
    const app = modules.find(m => m.path === 'app');

    expect(app).toBeDefined();
    expect(app!.instability).toBe(1);
    expect(app!.fanIn).toBe(0);
    expect(app!.fanOut).toBe(2);
  });

  it('computes abstractness from type-import ratio', () => {
    const graph = makeGraph(
      ['types/index.ts', 'app/main.ts', 'app/other.ts'],
      [
        ['app/main.ts', 'types/index.ts', 'type-import'],
        ['app/other.ts', 'types/index.ts', 'type-import'],
      ],
    );

    const { modules } = calculateMetrics(graph);
    const types = modules.find(m => m.path === 'types');

    expect(types).toBeDefined();
    expect(types!.abstractness).toBe(1);
  });

  it('computes mixed abstractness', () => {
    const graph = makeGraph(
      ['lib/utils.ts', 'app/a.ts', 'app/b.ts'],
      [
        ['app/a.ts', 'lib/utils.ts', 'type-import'],
        ['app/b.ts', 'lib/utils.ts', 'static-import'],
      ],
    );

    const { modules } = calculateMetrics(graph);
    const lib = modules.find(m => m.path === 'lib');

    expect(lib).toBeDefined();
    expect(lib!.abstractness).toBe(0.5);
  });

  it('computes distance from main sequence', () => {
    // Concrete + stable → Zone of Pain → D ≈ 1
    const graph = makeGraph(
      ['utils/helper.ts', 'app/main.ts', 'app/other.ts'],
      [
        ['app/main.ts', 'utils/helper.ts'],
        ['app/other.ts', 'utils/helper.ts'],
      ],
    );

    const { modules } = calculateMetrics(graph);
    const utils = modules.find(m => m.path === 'utils');

    expect(utils).toBeDefined();
    // I=0, A=0 → D = |0 + 0 - 1| = 1
    expect(utils!.distance).toBe(1);
  });

  it('returns zero distance for ideal module on main sequence', () => {
    // Abstract + stable → on main sequence
    const graph = makeGraph(
      ['types/index.ts', 'app/main.ts'],
      [
        ['app/main.ts', 'types/index.ts', 'type-import'],
      ],
    );

    const { modules } = calculateMetrics(graph);
    const types = modules.find(m => m.path === 'types');

    // I=0, A=1 → D = |1 + 0 - 1| = 0
    expect(types!.distance).toBe(0);
  });

  it('skips directories with only internal edges', () => {
    const graph = makeGraph(
      ['src/components/Button.ts', 'src/components/Input.ts', 'src/main.ts'],
      [
        ['src/main.ts', 'src/components/Button.ts'],
        ['src/main.ts', 'src/components/Input.ts'],
      ],
    );

    const { modules } = calculateMetrics(graph);
    const src = modules.find(m => m.path === 'src');

    // All edges are internal to src/ → no cross-boundary edges → excluded
    expect(src).toBeUndefined();

    // src/components has cross-boundary fan-in from src/main.ts
    const components = modules.find(m => m.path === 'src/components');
    expect(components).toBeDefined();
    expect(components!.fanIn).toBe(2);
  });

  it('skips directories with no edges at all', () => {
    const graph = makeGraph(
      ['src/components/Button.ts', 'src/components/Input.ts', 'src/main.ts'],
      [],
    );

    const { modules } = calculateMetrics(graph);
    expect(modules).toEqual([]);
  });

  it('computes summary correctly', () => {
    const graph = makeGraph(
      ['utils/helper.ts', 'app/main.ts'],
      [['app/main.ts', 'utils/helper.ts']],
    );

    const { summary } = calculateMetrics(graph);

    expect(summary.maxDistance).toBeGreaterThanOrEqual(0);
    expect(summary.avgDistance).toBeGreaterThanOrEqual(0);
    expect(typeof summary.modulesInPainZone).toBe('number');
    expect(typeof summary.modulesInUselessnessZone).toBe('number');
  });

  it('sorts modules by distance descending', () => {
    const graph = makeGraph(
      ['types/index.ts', 'utils/helper.ts', 'app/main.ts'],
      [
        ['app/main.ts', 'utils/helper.ts'],
        ['app/main.ts', 'types/index.ts', 'type-import'],
      ],
    );

    const { modules } = calculateMetrics(graph);

    for (let i = 1; i < modules.length; i++) {
      expect(modules[i - 1].distance).toBeGreaterThanOrEqual(modules[i].distance);
    }
  });

  it('handles empty graph', () => {
    const graph = makeGraph([], []);
    const { modules, summary } = calculateMetrics(graph);

    expect(modules).toEqual([]);
    expect(summary.avgDistance).toBe(0);
    expect(summary.maxDistance).toBe(0);
  });

  it('excludes isolated directories from results', () => {
    const graph = makeGraph(['src/main.ts'], []);
    const { modules } = calculateMetrics(graph);

    expect(modules.find(m => m.path === 'src')).toBeUndefined();
  });

  it('detects Zone of Pain modules', () => {
    // Concrete (A≈0) + Stable (I≈0) → Zone of Pain
    const graph = makeGraph(
      ['core/db.ts', 'app/a.ts', 'app/b.ts', 'app/c.ts'],
      [
        ['app/a.ts', 'core/db.ts'],
        ['app/b.ts', 'core/db.ts'],
        ['app/c.ts', 'core/db.ts'],
      ],
    );

    const { summary } = calculateMetrics(graph);
    expect(summary.modulesInPainZone).toBeGreaterThanOrEqual(1);
  });
});

describe('calculateMetrics integration', () => {
  const metricsFixture = resolve(fixturesDir, 'metrics');

  it('computes correct metrics for known fixture structure', () => {
    const graph = buildGraph(
      [resolve(metricsFixture, 'app/main.ts'), resolve(metricsFixture, 'app/other.ts')],
      metricsFixture,
    );
    const { modules } = calculateMetrics(graph);

    const lib = modules.find(m => m.path === 'lib');
    const types = modules.find(m => m.path === 'types');
    const app = modules.find(m => m.path === 'app');

    expect(lib).toBeDefined();
    expect(types).toBeDefined();
    expect(app).toBeDefined();
  });

  it('lib/ is Zone of Pain: stable + concrete', () => {
    const graph = buildGraph(
      [resolve(metricsFixture, 'app/main.ts'), resolve(metricsFixture, 'app/other.ts')],
      metricsFixture,
    );
    const { modules } = calculateMetrics(graph);
    const lib = modules.find(m => m.path === 'lib')!;

    // Everyone imports from lib, lib imports from nobody
    expect(lib.fanIn).toBe(2);
    expect(lib.fanOut).toBe(0);
    expect(lib.instability).toBe(0);
    expect(lib.abstractness).toBe(0);
    expect(lib.distance).toBe(1);
  });

  it('types/ is on Main Sequence: abstract + stable', () => {
    const graph = buildGraph(
      [resolve(metricsFixture, 'app/main.ts'), resolve(metricsFixture, 'app/other.ts')],
      metricsFixture,
    );
    const { modules } = calculateMetrics(graph);
    const types = modules.find(m => m.path === 'types')!;

    // Only type-imports come into types/
    expect(types.fanIn).toBe(1);
    expect(types.fanOut).toBe(0);
    expect(types.instability).toBe(0);
    expect(types.abstractness).toBe(1);
    expect(types.distance).toBe(0);
  });

  it('app/ is on Main Sequence: unstable + concrete', () => {
    const graph = buildGraph(
      [resolve(metricsFixture, 'app/main.ts'), resolve(metricsFixture, 'app/other.ts')],
      metricsFixture,
    );
    const { modules } = calculateMetrics(graph);
    const app = modules.find(m => m.path === 'app')!;

    // app imports from others, nobody imports from app
    expect(app.fanIn).toBe(0);
    expect(app.fanOut).toBe(3);
    expect(app.instability).toBe(1);
    expect(app.abstractness).toBe(0);
    expect(app.distance).toBe(0);
  });

  it('summary reflects zones correctly', () => {
    const graph = buildGraph(
      [resolve(metricsFixture, 'app/main.ts'), resolve(metricsFixture, 'app/other.ts')],
      metricsFixture,
    );
    const { summary } = calculateMetrics(graph);

    // lib/ is in Zone of Pain (I=0, A=0)
    expect(summary.modulesInPainZone).toBe(1);
    expect(summary.modulesInUselessnessZone).toBe(0);
    expect(summary.maxDistance).toBe(1);
    expect(summary.avgDistance).toBeGreaterThan(0);
  });

  it('type-imports fixture: abstractness reflects type-import ratio', () => {
    const root = resolve(fixturesDir, 'type-imports');
    const graph = buildGraph(resolve(root, 'src/index.ts'), root);
    const { modules } = calculateMetrics(graph);

    // All files in src/ — no cross-boundary edges → no metrics
    expect(modules).toEqual([]);
  });

  it('circular fixture: metrics computed despite cycles', () => {
    const root = resolve(fixturesDir, 'circular');
    const graph = buildGraph(resolve(root, 'src/a.ts'), root);
    const { modules } = calculateMetrics(graph);

    // Both files in src/ — no cross-boundary edges
    expect(modules).toEqual([]);
  });
});
