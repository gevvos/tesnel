<script setup lang="ts">
import { ref } from 'vue';
import MetricsHelp from './MetricsHelp.vue';
import { getZoneInfo } from '../utils/metrics';

defineProps<{
  info: {
    id: string;
    imports: string[];
    importedBy: string[];
    inCycle: boolean;
    metrics?: {
      fanIn: number;
      fanOut: number;
      instability: number;
      abstractness: number;
      distance: number;
      files: number;
    };
    stats?: {
      loc: number;
      complexity: number;
      functions: number;
      maxNesting: number;
      exports: Array<{ name: string; isType: boolean }>;
    };
  } | null;
}>();

const emit = defineEmits<{
  navigate: [id: string];
  'filter-export': [fileId: string, exportName: string];
}>();

const fileName = (path: string) => path.split('/').pop() || path;
const showHelp = ref(false);
</script>

<template>
  <aside class="sidebar" :class="{ open: !!info }">
    <div v-if="info" class="sidebar-content">
      <h3 class="sidebar-title">{{ fileName(info.id) }}</h3>
      <p class="sidebar-path">{{ info.id }}</p>

      <div v-if="info.inCycle" class="cycle-badge">Circular dependency</div>

      <section v-if="info.stats">
        <h4>File stats</h4>
        <div class="stats-row">
          <div class="stat" data-tip="Total lines in the file">
            <span class="stat-value">{{ info.stats.loc }}</span>
            <span class="stat-label">LOC</span>
          </div>
          <div class="stat" data-tip="Decision points: if, for, while, switch, ternary, catch">
            <span class="stat-value" :class="{ 'stat-warn': info.stats.complexity > 20, 'stat-caution': info.stats.complexity > 10 && info.stats.complexity <= 20 }">{{ info.stats.complexity }}</span>
            <span class="stat-label">Complexity</span>
          </div>
          <div class="stat" data-tip="Functions and arrow functions in the file">
            <span class="stat-value">{{ info.stats.functions }}</span>
            <span class="stat-label">Functions</span>
          </div>
          <div class="stat" data-tip="Deepest nesting of control flow (if inside for inside try…)">
            <span class="stat-value" :class="{ 'stat-warn': info.stats.maxNesting > 4 }">{{ info.stats.maxNesting }}</span>
            <span class="stat-label">Nesting</span>
          </div>
        </div>
      </section>

      <section v-if="info.metrics" class="metrics-section">
        <div class="metrics-header">
          <h4>Metrics</h4>
          <button class="metrics-help-btn" @click="showHelp = true">?</button>
        </div>

        <div v-if="getZoneInfo(info.metrics)" class="zone-badge" :class="getZoneInfo(info.metrics)!.cls" :title="getZoneInfo(info.metrics)!.desc">
          {{ getZoneInfo(info.metrics)!.label }}
        </div>

        <div class="metrics-grid">
          <div class="metric" title="I = Fan-out / (Fan-in + Fan-out). 0 = stable (everyone depends on it), 1 = unstable (depends on others).">
            <span class="metric-label">Instability</span>
            <span class="metric-value">{{ info.metrics.instability }}</span>
          </div>
          <div class="metric" title="Ratio of type-only imports to total incoming imports. 0 = concrete (runtime code), 1 = abstract (only types).">
            <span class="metric-label">Abstractness</span>
            <span class="metric-value">{{ info.metrics.abstractness }}</span>
          </div>
          <div class="metric" title="D = |A + I − 1|. Distance from the Main Sequence. 0 = ideal balance, 1 = worst position.">
            <span class="metric-label">Distance</span>
            <span class="metric-value" :class="{ 'metric-warn': info.metrics.distance >= 0.5, 'metric-ok': info.metrics.distance < 0.2 }">{{ info.metrics.distance }}</span>
          </div>
          <div class="metric" title="Number of incoming cross-boundary dependencies (other modules importing from this one).">
            <span class="metric-label">Fan-in</span>
            <span class="metric-value">{{ info.metrics.fanIn }}</span>
          </div>
          <div class="metric" title="Number of outgoing cross-boundary dependencies (this module importing from others).">
            <span class="metric-label">Fan-out</span>
            <span class="metric-value">{{ info.metrics.fanOut }}</span>
          </div>
          <div class="metric" title="Total number of source files in this module.">
            <span class="metric-label">Files</span>
            <span class="metric-value">{{ info.metrics.files }}</span>
          </div>
        </div>
      </section>

      <section v-if="info.stats && info.stats.exports.length">
        <h4>Exports ({{ info.stats.exports.length }})</h4>
        <ul>
          <li v-for="exp in info.stats.exports" :key="exp.name" class="export-item" @click="emit('filter-export', info.id, exp.name)">
            <span :class="{ 'export-type': exp.isType }">{{ exp.name }}</span>
            <span v-if="exp.isType" class="export-tag">type</span>
          </li>
        </ul>
      </section>

      <section v-if="info.imports.length">
        <h4>Imports ({{ info.imports.length }})</h4>
        <ul>
          <li v-for="dep in info.imports" :key="dep" @click="emit('navigate', dep)">
            {{ fileName(dep) }}
          </li>
        </ul>
      </section>

      <section v-if="info.importedBy.length">
        <h4>Imported by ({{ info.importedBy.length }})</h4>
        <ul>
          <li v-for="dep in info.importedBy" :key="dep" @click="emit('navigate', dep)">
            {{ fileName(dep) }}
          </li>
        </ul>
      </section>

      <section v-if="!info.imports.length && !info.importedBy.length">
        <p class="empty">No dependencies</p>
      </section>
    </div>

    <MetricsHelp v-if="showHelp" @close="showHelp = false" />
  </aside>
</template>

<style scoped>
.sidebar {
  position: absolute;
  top: 0;
  right: 0;
  width: 280px;
  height: 100%;
  background: #1a1f2e;
  border-left: 1px solid #2d3548;
  transform: translateX(100%);
  transition: transform 0.2s ease;
  overflow-y: auto;
  z-index: 20;
}

.sidebar.open {
  transform: translateX(0);
}

.sidebar-content {
  padding: 16px;
}

.sidebar-title {
  font-size: 14px;
  font-weight: 600;
  color: #f1f5f9;
  margin-bottom: 4px;
}

.sidebar-path {
  font-size: 11px;
  color: #64748b;
  word-break: break-all;
  margin-bottom: 12px;
}

.cycle-badge {
  display: inline-block;
  padding: 2px 8px;
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  margin-bottom: 12px;
}

section {
  margin-bottom: 16px;
}

h4 {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #94a3b8;
  margin-bottom: 6px;
}

ul {
  list-style: none;
}

li {
  padding: 4px 8px;
  font-size: 12px;
  color: #cbd5e1;
  cursor: pointer;
  border-radius: 4px;
}

li:hover {
  background: #2d3548;
  color: #60a5fa;
}

.empty {
  font-size: 12px;
  color: #64748b;
  font-style: italic;
}

.metrics-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

.metrics-header h4 {
  margin-bottom: 0;
}

.metrics-help-btn {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1px solid #4b5563;
  background: transparent;
  color: #9ca3af;
  font-size: 10px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.metrics-help-btn:hover {
  border-color: #60a5fa;
  color: #60a5fa;
}

.zone-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  margin-bottom: 8px;
}

.zone-pain {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.zone-useless {
  background: rgba(168, 85, 247, 0.15);
  color: #a855f7;
}

.zone-ok {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
}

.metrics-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}

.metric {
  display: flex;
  justify-content: space-between;
  padding: 4px 8px;
  background: rgba(55, 65, 81, 0.3);
  border-radius: 4px;
}

.metric-label {
  font-size: 11px;
  color: #9ca3af;
}

.metric-value {
  font-size: 11px;
  color: #e2e8f0;
  font-weight: 600;
  font-family: monospace;
}

.metric-warn {
  color: #ef4444;
}

.metric-ok {
  color: #22c55e;
}

.stats-row {
  display: flex;
  gap: 6px;
}

.stat {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 6px 4px;
  background: rgba(55, 65, 81, 0.3);
  border-radius: 4px;
  position: relative;
  cursor: default;
}

.stat[data-tip]:hover::after {
  content: attr(data-tip);
  position: absolute;
  top: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%);
  background: #111827;
  color: #e2e8f0;
  font-size: 10px;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid #374151;
  z-index: 30;
  pointer-events: none;
  max-width: 200px;
  white-space: normal;
  text-align: center;
}

.stat-value {
  font-size: 14px;
  font-weight: 700;
  color: #e2e8f0;
  font-family: monospace;
}

.stat-label {
  font-size: 9px;
  color: #64748b;
  text-transform: uppercase;
  margin-top: 2px;
}

.stat-warn {
  color: #ef4444;
}

.stat-caution {
  color: #eab308;
}

.export-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.export-type {
  opacity: 0.7;
  font-style: italic;
}

.export-tag {
  font-size: 9px;
  color: #64748b;
  background: rgba(55, 65, 81, 0.4);
  padding: 1px 4px;
  border-radius: 3px;
}
</style>
