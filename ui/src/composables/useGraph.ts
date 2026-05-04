import { ref, watch, shallowRef, nextTick, type Ref } from 'vue';
import ELK from 'elkjs/lib/elk.bundled.js';
import type { TesnelData, LayoutNode, LayoutEdge, TreeNode } from '../types.js';

const elk = new ELK();

const NODE_WIDTH = 140;
const NODE_HEIGHT = 32;
const DIR_PADDING_TOP = 32;
const DIR_PADDING = 16;

type ElkNode = {
  id: string;
  width?: number;
  height?: number;
  children?: ElkNode[];
  labels?: Array<{ text: string }>;
  layoutOptions?: Record<string, string>;
};

type ElkEdge = {
  id: string;
  sources: string[];
  targets: string[];
};

type ElkGraph = {
  id: string;
  children: ElkNode[];
  edges: ElkEdge[];
  layoutOptions: Record<string, string>;
};

const filterTree = (tree: TreeNode[], visible: Set<string>): TreeNode[] => {
  const result: TreeNode[] = [];
  for (const node of tree) {
    if (node.type === 'file') {
      if (visible.has(node.id)) result.push(node);
    } else {
      const children = filterTree(node.children, visible);
      if (children.length > 0) {
        result.push({ ...node, children });
      }
    }
  }
  return result;
};

type BuildResult = {
  nodes: ElkNode[];
  hiddenFileMap: Map<string, string>;
};

const buildElkTree = (tree: TreeNode[], depth: number, maxDepth: number, prefix: string = '', hiddenFileMap: Map<string, string> = new Map()): BuildResult => {
  const nodes: ElkNode[] = [];

  for (const node of tree) {
    if (node.type === 'file') {
      nodes.push({
        id: node.id,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        labels: [{ text: node.name }],
      });
    } else if (node.type === 'directory') {
      const dirId = prefix ? `${prefix}/${node.name}` : node.name;
      const elkDirId = `dir:${dirId}`;
      if (depth >= maxDepth) {
        collectHiddenFiles(node.children, elkDirId, hiddenFileMap);
        nodes.push({
          id: elkDirId,
          width: NODE_WIDTH,
          height: NODE_HEIGHT,
          labels: [{ text: node.name }],
        });
      } else {
        const { nodes: children } = buildElkTree(node.children, depth + 1, maxDepth, dirId, hiddenFileMap);
        nodes.push({
          id: elkDirId,
          children,
          labels: [{ text: node.name }],
          layoutOptions: {
            'elk.padding': `[top=${DIR_PADDING_TOP},left=${DIR_PADDING},bottom=${DIR_PADDING},right=${DIR_PADDING}]`,
          },
        });
      }
    }
  }

  return { nodes, hiddenFileMap };
};

const collectHiddenFiles = (tree: TreeNode[], targetDirId: string, map: Map<string, string>) => {
  for (const node of tree) {
    if (node.type === 'file') {
      map.set(node.id, targetDirId);
    } else if (node.type === 'directory') {
      collectHiddenFiles(node.children, targetDirId, map);
    }
  }
};

type ElkEdgesResult = { edges: ElkEdge[]; typeOnlyEdgeIds: Set<string> };

const buildElkEdges = (data: TesnelData, hiddenFileMap: Map<string, string>): ElkEdgesResult => {
  const remap = (id: string) => hiddenFileMap.get(id) ?? id;
  const seen = new Set<string>();
  const typeOnlyEdgeIds = new Set<string>();

  const edges = data.graph.edges
    .map((edge, i) => {
      const from = remap(edge.from);
      const to = remap(edge.to);
      if (from === to) return null;
      const key = `${from}|${to}`;
      if (seen.has(key)) return null;
      seen.add(key);
      const id = `e${i}`;
      if (edge.type === 'type-import') typeOnlyEdgeIds.add(id);
      return { id, sources: [from], targets: [to] };
    })
    .filter((e): e is ElkEdge => e !== null);

  return { edges, typeOnlyEdgeIds };
};

export const useGraph = (data: Ref<TesnelData | null>, maxDepth: Ref<number>, visibleNodeIds: Ref<Set<string> | null>, showTypeImports: Ref<boolean> = ref(true)) => {
  const layoutNodes = shallowRef<LayoutNode[]>([]);
  const layoutEdges = shallowRef<LayoutEdge[]>([]);
  const graphWidth = ref(0);
  const graphHeight = ref(0);
  const isLoading = ref(false);

  const computeLayout = async () => {
    if (!data.value) return;
    isLoading.value = true;
    await nextTick();

    const filteredTree = visibleNodeIds.value
      ? filterTree(data.value.tree, visibleNodeIds.value)
      : data.value.tree;
    let filteredGraphEdges = visibleNodeIds.value
      ? data.value.graph.edges.filter(e => visibleNodeIds.value!.has(e.from) && visibleNodeIds.value!.has(e.to))
      : data.value.graph.edges;
    if (!showTypeImports.value) {
      filteredGraphEdges = filteredGraphEdges.filter(e => e.type !== 'type-import');
    }
    const filteredData = { ...data.value, tree: filteredTree, graph: { ...data.value.graph, edges: filteredGraphEdges } };

    const { nodes: elkChildren, hiddenFileMap } = buildElkTree(filteredTree, 0, maxDepth.value);
    const { edges: elkEdges, typeOnlyEdgeIds } = buildElkEdges(filteredData, hiddenFileMap);

    const graph: ElkGraph = {
      id: 'root',
      children: elkChildren,
      edges: elkEdges,
      layoutOptions: {
        'elk.algorithm': 'layered',
        'elk.direction': 'RIGHT',
        'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
        'elk.layered.spacing.nodeNodeBetweenLayers': '60',
        'elk.layered.spacing.edgeNodeBetweenLayers': '30',
        'elk.spacing.nodeNode': '20',
        'elk.edgeRouting': 'ORTHOGONAL',
      },
    };

    try {
      const layout = await elk.layout(graph);
      const nodes: LayoutNode[] = [];
      const edges: LayoutEdge[] = [];

      const cycleEdgeSet = new Set<string>();
      if (data.value.cycles) {
        for (const cycle of data.value.cycles) {
          for (let i = 0; i < cycle.length - 1; i++) {
            cycleEdgeSet.add(`${cycle[i]}|${cycle[i + 1]}`);
          }
        }
      }

      const extractNodes = (elkNodes: any[], depth: number, offsetX: number, offsetY: number) => {
        for (const n of elkNodes) {
          const absX = (n.x ?? 0) + offsetX;
          const absY = (n.y ?? 0) + offsetY;
          nodes.push({
            id: n.id,
            name: n.labels?.[0]?.text || n.id,
            x: absX,
            y: absY,
            width: n.width ?? NODE_WIDTH,
            height: n.height ?? NODE_HEIGHT,
            isDirectory: !!n.children || n.id.startsWith('dir:'),
            depth,
          });
          if (n.children) {
            extractNodes(n.children, depth + 1, absX, absY);
          }
        }
      };

      extractNodes(layout.children || [], 0, 0, 0);

      // Build map of container ID → absolute position
      const containerOffsets = new Map<string, { x: number; y: number }>();
      containerOffsets.set('root', { x: 0, y: 0 });
      const buildOffsets = (elkNodes: any[], ox: number, oy: number) => {
        for (const n of elkNodes) {
          const ax = (n.x ?? 0) + ox;
          const ay = (n.y ?? 0) + oy;
          containerOffsets.set(n.id, { x: ax, y: ay });
          if (n.children) buildOffsets(n.children, ax, ay);
        }
      };
      buildOffsets(layout.children || [], 0, 0);

      const extractEdges = (elkNode: any) => {
        if (elkNode.edges) {
          for (const e of elkNode.edges) {
            const from = e.sources[0];
            const to = e.targets[0];
            const containerId = (e as any).container ?? 'root';
            const offset = containerOffsets.get(containerId) ?? { x: 0, y: 0 };
            const sections = (e as any).sections || [];
            const points: Array<{ x: number; y: number }> = [];

            for (const section of sections) {
              if (section.startPoint) points.push({ x: section.startPoint.x + offset.x, y: section.startPoint.y + offset.y });
              if (section.bendPoints) {
                for (const bp of section.bendPoints) {
                  points.push({ x: bp.x + offset.x, y: bp.y + offset.y });
                }
              }
              if (section.endPoint) points.push({ x: section.endPoint.x + offset.x, y: section.endPoint.y + offset.y });
            }

            edges.push({
              id: e.id,
              from,
              to,
              points,
              isCycle: cycleEdgeSet.has(`${from}|${to}`),
              isTypeOnly: typeOnlyEdgeIds.has(e.id),
            });
          }
        }
        if (elkNode.children) {
          for (const child of elkNode.children) {
            extractEdges(child);
          }
        }
      };

      extractEdges(layout);

      layoutNodes.value = nodes;
      layoutEdges.value = edges;
      graphWidth.value = layout.width ?? 800;
      graphHeight.value = layout.height ?? 600;
    } catch (err) {
      console.error('ELK layout failed:', err);
    }

    isLoading.value = false;
  };

  watch([data, maxDepth, visibleNodeIds, showTypeImports], computeLayout, { immediate: true });

  return { layoutNodes, layoutEdges, graphWidth, graphHeight, isLoading };
};
