<script setup lang="ts">
import { ref, computed } from 'vue';
import type { GraphNode } from '../types';

const props = defineProps<{
  nodes: GraphNode[];
}>();

const emit = defineEmits<{
  select: [id: string];
}>();

const query = ref('');
const isOpen = ref(false);

const results = computed(() => {
  if (!query.value || query.value.length < 2) return [];
  const q = query.value.toLowerCase();
  return props.nodes
    .filter(n => n.id.toLowerCase().includes(q))
    .slice(0, 8);
});

const selectResult = (id: string) => {
  emit('select', id);
  query.value = '';
  isOpen.value = false;
};
</script>

<template>
  <div class="search-bar">
    <input
      v-model="query"
      placeholder="Search files..."
      @focus="isOpen = true"
      @blur="setTimeout(() => isOpen = false, 150)"
    />
    <ul v-if="isOpen && results.length" class="results">
      <li v-for="node in results" :key="node.id" @mousedown="selectResult(node.id)">
        {{ node.id }}
      </li>
    </ul>
  </div>
</template>

<style scoped>
.search-bar {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 10;
}

input {
  width: 220px;
  padding: 8px 12px;
  background: #1f2937;
  border: 1px solid #374151;
  border-radius: 6px;
  color: #e5e7eb;
  font-size: 12px;
  outline: none;
}

input:focus {
  border-color: #3b82f6;
}

input::placeholder {
  color: #6b7280;
}

.results {
  list-style: none;
  margin-top: 4px;
  background: #1f2937;
  border: 1px solid #374151;
  border-radius: 6px;
  max-height: 200px;
  overflow-y: auto;
}

.results li {
  padding: 6px 12px;
  font-size: 12px;
  color: #cbd5e1;
  cursor: pointer;
}

.results li:hover {
  background: #2d3548;
  color: #60a5fa;
}
</style>
