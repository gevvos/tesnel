export type TreeNode =
  | { type: 'file'; id: string; name: string }
  | { type: 'directory'; name: string; children: TreeNode[] };

export type ModuleMetricsOutput = {
  path: string;
  files: number;
  fanIn: number;
  fanOut: number;
  instability: number;
  abstractness: number;
  distance: number;
};

export type MetricsSummaryOutput = {
  avgDistance: number;
  maxDistance: number;
  modulesInPainZone: number;
  modulesInUselessnessZone: number;
};

export type TesnelOutput = {
  meta: {
    version: string;
    entry: string;
    root: string;
    generatedAt: string;
    totalFiles: number;
    totalEdges: number;
    totalCycles: number;
  };
  tree: TreeNode[];
  graph: {
    nodes: Array<{ id: string; directory: string }>;
    edges: Array<{ from: string; to: string; type: string }>;
  };
  cycles: string[][];
  errors: Array<{ file: string; message: string }>;
  metrics?: {
    modules: ModuleMetricsOutput[];
    summary: MetricsSummaryOutput;
  };
};
