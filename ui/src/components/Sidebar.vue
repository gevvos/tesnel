<script setup lang="ts">
defineProps<{
  info: {
    id: string;
    imports: string[];
    importedBy: string[];
    inCycle: boolean;
  } | null;
}>();

const emit = defineEmits<{
  navigate: [id: string];
}>();

const fileName = (path: string) => path.split('/').pop() || path;
</script>

<template>
  <aside class="sidebar" :class="{ open: !!info }">
    <div v-if="info" class="sidebar-content">
      <h3 class="sidebar-title">{{ fileName(info.id) }}</h3>
      <p class="sidebar-path">{{ info.id }}</p>

      <div v-if="info.inCycle" class="cycle-badge">Circular dependency</div>

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
</style>
