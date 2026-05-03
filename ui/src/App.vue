<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useData } from './composables/useData';
import { useGraph } from './composables/useGraph';
import { useSelection } from './composables/useSelection';
import GraphView from './components/GraphView.vue';
import Sidebar from './components/Sidebar.vue';
import DepthSlider from './components/DepthSlider.vue';
import SearchBar from './components/SearchBar.vue';

const { data } = useData();
const isolateMode = ref(false);
const reach = ref(2);
const cyclesOnly = ref(false);
const excludeInput = ref('');
const excludePattern = ref('');
const showTypeImports = ref(true);

const maxPossibleDepth = computed(() => {
  if (!data.value) return 1;
  let max = 0;
  for (const node of data.value.graph.nodes) {
    const depth = node.id.split('/').length - 1;
    if (depth > max) max = depth;
  }
  return Math.max(max, 1);
});

const maxDepth = ref(1);
watch(maxPossibleDepth, (val) => { maxDepth.value = val; }, { immediate: true });

const { selectedId, selectNode, hoverNode, selectedInfo, highlightedEdges } = useSelection(data);

const cycleNodeIds = computed(() => {
  if (!cyclesOnly.value || !data.value || !data.value.cycles.length) return null;
  const ids = new Set<string>();
  for (const cycle of data.value.cycles) {
    for (const id of cycle) ids.add(id);
  }
  return ids;
});

const getFileIdsForNode = (id: string): Set<string> => {
  if (!id.startsWith('dir:') || !data.value) return new Set([id]);
  const dirPath = id.slice(4) + '/';
  return new Set(data.value.graph.nodes.filter(n => n.id.startsWith(dirPath)).map(n => n.id));
};

const connectedNodeIds = computed(() => {
  if (!isolateMode.value || !selectedId.value || !data.value) return null;
  const edges = data.value.graph.edges;
  const seedIds = getFileIdsForNode(selectedId.value);
  const visited = new Set<string>(seedIds);
  let frontier = new Set<string>(seedIds);

  for (let hop = 1; hop < reach.value; hop++) {
    const next = new Set<string>();
    for (const e of edges) {
      if (frontier.has(e.from) && !visited.has(e.to)) next.add(e.to);
      if (frontier.has(e.to) && !visited.has(e.from)) next.add(e.from);
    }
    if (next.size === 0) break;
    for (const id of next) visited.add(id);
    frontier = next;
  }
  return visited;
});

const excludedNodeIds = computed(() => {
  if (!excludePattern.value.trim() || !data.value) return null;
  const patterns = excludePattern.value.split(',').map(p => p.trim()).filter(Boolean);
  if (!patterns.length) return null;
  const excluded = new Set<string>();
  for (const node of data.value.graph.nodes) {
    if (patterns.some(p => node.id.includes(p))) {
      excluded.add(node.id);
    }
  }
  return excluded.size > 0 ? excluded : null;
});

const visibleNodeIds = computed(() => {
  let ids: Set<string> | null = null;

  if (connectedNodeIds.value && cycleNodeIds.value) {
    ids = new Set<string>();
    for (const id of connectedNodeIds.value) {
      if (cycleNodeIds.value.has(id)) ids.add(id);
    }
  } else {
    ids = connectedNodeIds.value || cycleNodeIds.value || null;
  }

  if (excludedNodeIds.value) {
    if (ids) {
      const filtered = new Set<string>();
      for (const id of ids) {
        if (!excludedNodeIds.value.has(id)) filtered.add(id);
      }
      return filtered;
    }
    if (!data.value) return null;
    const all = new Set<string>();
    for (const node of data.value.graph.nodes) {
      if (!excludedNodeIds.value.has(node.id)) all.add(node.id);
    }
    return all;
  }

  return ids;
});

const { layoutNodes, layoutEdges, graphWidth, graphHeight, isLoading } = useGraph(data, maxDepth, visibleNodeIds, showTypeImports);

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
        <div v-if="isolateMode" class="reach-control">
          <span class="reach-label">Reach: {{ reach }}</span>
          <input
            type="range"
            :min="1"
            :max="10"
            v-model.number="reach"
            class="reach-slider"
          />
        </div>
        <label v-if="data.meta.totalCycles" class="filter-toggle">
          <input type="checkbox" v-model="cyclesOnly" />
          <span>Cycles only</span>
        </label>
        <input
          v-model="excludeInput"
          class="exclude-input"
          placeholder="Exclude: __tests__, .spec"
          @keydown.enter="excludePattern = excludeInput"
          @blur="excludePattern = excludeInput"
        />
      </div>
    </header>

    <main class="main">
      <div v-if="!data" class="empty-state">
        <p>No data loaded. Run <code>tesnel analyze &lt;entry&gt;</code> to generate the graph.</p>
      </div>

      <div v-else-if="isLoading" class="loading">Computing layout...</div>

      <template v-else>
        <SearchBar :nodes="data.graph.nodes" @select="handleSearch" />

        <div class="legend">
          <div class="legend-item">
            <svg width="24" height="10"><line x1="0" y1="5" x2="24" y2="5" stroke="#6b7280" stroke-width="1.5" /></svg>
            <span>Import</span>
          </div>
          <div class="legend-item">
            <svg width="24" height="10"><line x1="0" y1="5" x2="24" y2="5" stroke="#6b7280" stroke-width="1.5" stroke-dasharray="6 3" opacity="0.6" /></svg>
            <label class="legend-check">
              <input type="checkbox" v-model="showTypeImports" />
              <span>Type import</span>
            </label>
          </div>
          <div class="legend-item">
            <svg width="24" height="10"><line x1="0" y1="5" x2="24" y2="5" stroke="#ef4444" stroke-width="2" /></svg>
            <span>Cycle</span>
          </div>
          <div class="legend-item">
            <svg width="24" height="10"><line x1="0" y1="5" x2="24" y2="5" stroke="#60a5fa" stroke-width="2" /></svg>
            <span>Selected</span>
          </div>
        </div>

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

.reach-control {
  display: flex;
  align-items: center;
  gap: 6px;
}

.reach-label {
  font-size: 12px;
  color: #9ca3af;
  white-space: nowrap;
}

.reach-slider {
  width: 80px;
  accent-color: #3b82f6;
}

.exclude-input {
  width: 180px;
  padding: 4px 8px;
  background: #111827;
  border: 1px solid #374151;
  border-radius: 4px;
  color: #e5e7eb;
  font-size: 12px;
  outline: none;
}

.exclude-input:focus {
  border-color: #3b82f6;
}

.exclude-input::placeholder {
  color: #6b7280;
}

.legend {
  position: absolute;
  top: 52px;
  left: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: #1f2937;
  border: 1px solid #374151;
  border-radius: 8px;
  padding: 8px 12px;
  z-index: 10;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #9ca3af;
}

.legend-check {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}

.legend-check input {
  accent-color: #3b82f6;
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
