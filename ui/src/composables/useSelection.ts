import { ref, computed, type Ref } from 'vue';
import type { TesnelData } from '../types';

export const useSelection = (data: Ref<TesnelData | null>) => {
  const selectedId = ref<string | null>(null);
  const hoveredId = ref<string | null>(null);

  const selectNode = (id: string | null) => {
    selectedId.value = id;
  };

  const hoverNode = (id: string | null) => {
    hoveredId.value = id;
  };

  const selectedInfo = computed(() => {
    if (!selectedId.value || !data.value) return null;

    const id = selectedId.value;
    const imports = data.value.graph.edges
      .filter(e => e.from === id)
      .map(e => e.to);
    const importedBy = data.value.graph.edges
      .filter(e => e.to === id)
      .map(e => e.from);

    const inCycle = data.value.cycles.some(c => c.includes(id));

    return { id, imports, importedBy, inCycle };
  });

  const highlightedEdges = computed(() => {
    const active = hoveredId.value || selectedId.value;
    if (!active || !data.value) return new Set<string>();

    const set = new Set<string>();
    for (let i = 0; i < data.value.graph.edges.length; i++) {
      const e = data.value.graph.edges[i];
      if (e.from === active || e.to === active) {
        set.add(`e${i}`);
      }
    }
    return set;
  });

  return { selectedId, hoveredId, selectNode, hoverNode, selectedInfo, highlightedEdges };
};
