import { ref, computed, type Ref } from 'vue';
import type { TesnelData, LayoutEdge } from '../types.js';

export const useSelection = (data: Ref<TesnelData | null>, layoutEdges: Ref<LayoutEdge[]>, selectedId: Ref<string | null>) => {
  const hoveredId = ref<string | null>(null);

  const selectNode = (id: string | null) => {
    selectedId.value = id;
  };

  const hoverNode = (id: string | null) => {
    hoveredId.value = id;
  };

  const getFileIds = (id: string): string[] => {
    if (!id.startsWith('dir:') || !data.value) return [id];

    const dirPath = id.slice(4) + '/';
    return data.value.graph.nodes
      .filter(n => n.id.startsWith(dirPath))
      .map(n => n.id);
  };

  const selectedInfo = computed(() => {
    if (!selectedId.value || !data.value) return null;

    const id = selectedId.value;
    const fileIds = getFileIds(id);
    const fileIdSet = new Set(fileIds);

    const imports: string[] = [];
    const importedBy: string[] = [];

    for (const e of data.value.graph.edges) {
      if (fileIdSet.has(e.from) && !fileIdSet.has(e.to)) {
        if (!imports.includes(e.to)) imports.push(e.to);
      }
      if (fileIdSet.has(e.to) && !fileIdSet.has(e.from)) {
        if (!importedBy.includes(e.from)) importedBy.push(e.from);
      }
    }

    const inCycle = data.value.cycles.some(c => fileIds.some(f => c.includes(f)));

    let metrics: { fanIn: number; fanOut: number; instability: number; abstractness: number; distance: number; files: number } | undefined;
    if (id.startsWith('dir:') && data.value.metrics) {
      const dirPath = id.slice(4);
      const m = data.value.metrics.modules.find(mod => mod.path === dirPath);
      if (m) metrics = { fanIn: m.fanIn, fanOut: m.fanOut, instability: m.instability, abstractness: m.abstractness, distance: m.distance, files: m.files };
    }

    let stats: { loc: number; complexity: number; functions: number; maxNesting: number; exports: Array<{ name: string; isType: boolean }> } | undefined;
    if (!id.startsWith('dir:') && data.value.fileStats) {
      stats = data.value.fileStats[id];
    }

    return { id, imports, importedBy, inCycle, metrics, stats };
  });

  const highlightedEdges = computed(() => {
    const active = hoveredId.value || selectedId.value;
    if (!active || !data.value) return new Set<string>();

    const fileIds = getFileIds(active);
    const fileIdSet = new Set(fileIds);
    fileIdSet.add(active);

    const set = new Set<string>();
    for (const e of layoutEdges.value) {
      if (fileIdSet.has(e.from) || fileIdSet.has(e.to)) {
        set.add(e.id);
      }
    }
    return set;
  });

  return { selectedId, hoveredId, selectNode, hoverNode, selectedInfo, highlightedEdges };
};
