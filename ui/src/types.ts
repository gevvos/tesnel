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
  symbols?: string[];
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

export type ExportEntry = {
  name: string;
  isType: boolean;
};

export type FileStats = {
  loc: number;
  complexity: number;
  functions: number;
  maxNesting: number;
  exports: ExportEntry[];
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
  fileStats?: Record<string, FileStats>;
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
  stats?: FileStats;
};

export type LayoutEdge = {
  id: string;
  from: string;
  to: string;
  points: Array<{ x: number; y: number }>;
  isCycle: boolean;
  isTypeOnly: boolean;
};
