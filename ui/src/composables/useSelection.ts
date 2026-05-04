import { ref, computed, type Ref } from 'vue';
import type { TesnelData } from '../types.js';

export const useSelection = (data: Ref<TesnelData | null>) => {
  const selectedId = ref<string | null>(null);
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

    return { id, imports, importedBy, inCycle };
  });

  const highlightedEdges = computed(() => {
    const active = hoveredId.value || selectedId.value;
    if (!active || !data.value) return new Set<string>();

    const fileIds = getFileIds(active);
    const fileIdSet = new Set(fileIds);

    const set = new Set<string>();
    for (let i = 0; i < data.value.graph.edges.length; i++) {
      const e = data.value.graph.edges[i];
      if (fileIdSet.has(e.from) || fileIdSet.has(e.to)) {
        set.add(`e${i}`);
      }
    }
    return set;
  });

  return { selectedId, hoveredId, selectNode, hoverNode, selectedInfo, highlightedEdges };
};
