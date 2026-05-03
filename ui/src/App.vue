<script setup lang="ts">
import { ref, computed } from 'vue';
import { useData } from './composables/useData';
import { useGraph } from './composables/useGraph';
import { useSelection } from './composables/useSelection';
import GraphView from './components/GraphView.vue';
import Sidebar from './components/Sidebar.vue';
import DepthSlider from './components/DepthSlider.vue';
import SearchBar from './components/SearchBar.vue';

const { data } = useData();
const maxDepth = ref(5);
const isolateMode = ref(false);
const cyclesOnly = ref(false);

const maxPossibleDepth = computed(() => {
  if (!data.value) return 5;
  let max = 0;
  for (const node of data.value.graph.nodes) {
    const depth = node.id.split('/').length - 1;
    if (depth > max) max = depth;
  }
  return Math.max(max, 1);
});

const { selectedId, selectNode, hoverNode, selectedInfo, highlightedEdges } = useSelection(data);

const cycleNodeIds = computed(() => {
  if (!cyclesOnly.value || !data.value || !data.value.cycles.length) return null;
  const ids = new Set<string>();
  for (const cycle of data.value.cycles) {
    for (const id of cycle) ids.add(id);
  }
  return ids;
});

const connectedNodeIds = computed(() => {
  if (!isolateMode.value || !selectedId.value || !data.value) return null;
  const ids = new Set<string>();
  ids.add(selectedId.value);
  for (const e of data.value.graph.edges) {
    if (e.from === selectedId.value) ids.add(e.to);
    if (e.to === selectedId.value) ids.add(e.from);
  }
  return ids;
});

const visibleNodeIds = computed(() => {
  if (connectedNodeIds.value && cycleNodeIds.value) {
    const intersection = new Set<string>();
    for (const id of connectedNodeIds.value) {
      if (cycleNodeIds.value.has(id)) intersection.add(id);
    }
    return intersection;
  }
  return connectedNodeIds.value || cycleNodeIds.value || null;
});

const { layoutNodes, layoutEdges, graphWidth, graphHeight, isLoading } = useGraph(data, maxDepth, visibleNodeIds);

const handleSearch = (id: string) => {
  selectNode(id);
};
</script>

<template>
  <div class="app">
    <header class="header">
      <h1>tesnel</h1>
      <div v-if="data" class="stats">
        <span>{{ data.meta.totalFiles }} files</span>
        <span>{{ data.meta.totalEdges }} edges</span>
        <span v-if="data.meta.totalCycles" class="cycles">{{ data.meta.totalCycles }} cycles</span>
      </div>
      <div v-if="data" class="filters">
        <label class="filter-toggle">
          <input type="checkbox" v-model="isolateMode" />
          <span>Hide unrelated</span>
        </label>
        <label v-if="data.meta.totalCycles" class="filter-toggle">
          <input type="checkbox" v-model="cyclesOnly" />
          <span>Cycles only</span>
        </label>
      </div>
    </header>

    <main class="main">
      <div v-if="!data" class="empty-state">
        <p>No data loaded. Run <code>tesnel analyze &lt;entry&gt;</code> to generate the graph.</p>
      </div>

      <div v-else-if="isLoading" class="loading">Computing layout...</div>

      <template v-else>
        <SearchBar :nodes="data.graph.nodes" @select="handleSearch" />

        <GraphView
          :nodes="layoutNodes"
          :edges="layoutEdges"
          :width="graphWidth"
          :height="graphHeight"
          :selected-id="selectedId"
          :highlighted-edges="highlightedEdges"
          @select="selectNode"
          @hover="hoverNode"
        />

        <DepthSlider
          v-model="maxDepth"
          :max="maxPossibleDepth"
        />

        <Sidebar
          :info="selectedInfo"
          @navigate="selectNode"
        />
      </template>
    </main>
  </div>
</template>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 16px;
  border-bottom: 1px solid #1e293b;
  background: #111827;
}

h1 {
  font-size: 16px;
  font-weight: 700;
  color: #f8fafc;
  letter-spacing: -0.02em;
}

.stats {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #64748b;
}

.stats .cycles {
  color: #ef4444;
}

.filters {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-left: auto;
}

.filter-toggle {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: #9ca3af;
  cursor: pointer;
  user-select: none;
}

.filter-toggle input {
  accent-color: #3b82f6;
}

.filter-toggle:hover {
  color: #e5e7eb;
}

.main {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.empty-state, .loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #64748b;
  font-size: 14px;
}

code {
  background: #1e293b;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}
</style>
