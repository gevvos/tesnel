import type { DependencyGraph } from './graph-builder.js';

export type ModuleMetrics = {
  path: string;
  files: number;
  fanIn: number;
  fanOut: number;
  instability: number;
  abstractness: number;
  distance: number;
};

export type MetricsSummary = {
  avgDistance: number;
  maxDistance: number;
  modulesInPainZone: number;
  modulesInUselessnessZone: number;
};

export type ArchitectureMetrics = {
  modules: ModuleMetrics[];
  summary: MetricsSummary;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

export const calculateMetrics = (graph: DependencyGraph): ArchitectureMetrics => {
  const dirPaths = new Set<string>();
  for (const node of graph.nodes) {
    const parts = node.id.split('/');
    for (let i = 1; i < parts.length; i++) {
      dirPaths.add(parts.slice(0, i).join('/'));
    }
  }

  const modules: ModuleMetrics[] = [];

  for (const dirPath of dirPaths) {
    const prefix = dirPath + '/';
    const fileIds = new Set<string>();
    for (const node of graph.nodes) {
      if (node.id.startsWith(prefix)) fileIds.add(node.id);
    }

    if (fileIds.size === 0) continue;

    let fanIn = 0;
    let fanOut = 0;
    let typeImportFanIn = 0;

    for (const edge of graph.edges) {
      const fromInside = fileIds.has(edge.from);
      const toInside = fileIds.has(edge.to);

      if (toInside && !fromInside) {
        fanIn++;
        if (edge.type === 'type-import') typeImportFanIn++;
      }
      if (fromInside && !toInside) {
        fanOut++;
      }
    }

    const total = fanIn + fanOut;
    if (total === 0) continue;

    const instability = fanOut / total;
    const abstractness = fanIn > 0 ? typeImportFanIn / fanIn : 0;
    const distance = Math.abs(abstractness + instability - 1);

    modules.push({
      path: dirPath,
      files: fileIds.size,
      fanIn,
      fanOut,
      instability: round2(instability),
      abstractness: round2(abstractness),
      distance: round2(distance),
    });
  }

  modules.sort((a, b) => b.distance - a.distance);

  const distances = modules.map(m => m.distance);

  const summary: MetricsSummary = {
    avgDistance: modules.length > 0
      ? round2(distances.reduce((s, d) => s + d, 0) / modules.length)
      : 0,
    maxDistance: modules.length > 0 ? Math.max(...distances) : 0,
    modulesInPainZone: modules.filter(m => m.abstractness < 0.2 && m.instability < 0.2).length,
    modulesInUselessnessZone: modules.filter(m => m.abstractness > 0.8 && m.instability > 0.8).length,
  };

  return { modules, summary };
};
