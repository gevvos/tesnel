export type TreeNode =
  | { type: 'file'; id: string; name: string }
  | { type: 'directory'; name: string; children: TreeNode[] };

export type GraphNode = {
  id: string;
  directory: string;
};

export type GraphEdge = {
  from: string;
  to: string;
  type: string;
};

export type ModuleMetrics = {
  path: string;
  files: number;
  fanIn: number;
  fanOut: number;
  instability: number;
  abstractness: number;
  distance: number;
};

export type TesnelData = {
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
    nodes: GraphNode[];
    edges: GraphEdge[];
  };
  cycles: string[][];
  errors: Array<{ file: string; message: string }>;
  metrics?: {
    modules: ModuleMetrics[];
    summary: {
      avgDistance: number;
      maxDistance: number;
      modulesInPainZone: number;
      modulesInUselessnessZone: number;
    };
  };
};

export type LayoutNode = {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isDirectory: boolean;
  depth: number;
  metrics?: ModuleMetrics;
};

export type LayoutEdge = {
  id: string;
  from: string;
  to: string;
  points: Array<{ x: number; y: number }>;
  isCycle: boolean;
  isTypeOnly: boolean;
};
