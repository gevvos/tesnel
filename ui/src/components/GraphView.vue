<script setup lang="ts">
import { ref } from 'vue';
import { useZoom } from '../composables/useZoom';
import type { LayoutNode, LayoutEdge } from '../types';

const props = defineProps<{
  nodes: LayoutNode[];
  edges: LayoutEdge[];
  width: number;
  height: number;
  selectedId: string | null;
  highlightedEdges: Set<string>;
}>();

const emit = defineEmits<{
  select: [id: string | null];
  hover: [id: string | null];
}>();

const svgRef = ref<SVGSVGElement | null>(null);
const { transform, resetZoom, zoomIn, zoomOut } = useZoom(svgRef);

const edgePath = (edge: LayoutEdge): string => {
  if (edge.points.length === 0) return '';
  const [first, ...rest] = edge.points;
  let d = `M ${first.x} ${first.y}`;
  for (const p of rest) {
    d += ` L ${p.x} ${p.y}`;
  }
  return d;
};

const handleBgClick = () => {
  emit('select', null);
};
</script>

<template>
  <div class="graph-container">
    <div class="zoom-controls">
      <button @click="zoomIn" title="Zoom in">+</button>
      <button @click="zoomOut" title="Zoom out">-</button>
      <button @click="resetZoom" title="Reset">⟳</button>
    </div>

    <svg
      ref="svgRef"
      :width="'100%'"
      :height="'100%'"
      :viewBox="`-20 -20 ${width + 40} ${height + 40}`"
      @click.self="handleBgClick"
    >
      <defs>
        <marker id="arrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#6b7280" />
        </marker>
        <marker id="arrow-cycle" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#ef4444" />
        </marker>
        <marker id="arrow-highlight" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#60a5fa" />
        </marker>
      </defs>

      <g :transform="transform">
        <!-- Directories -->
        <g
          v-for="node in nodes.filter(n => n.isDirectory)"
          :key="node.id"
          class="dir-node"
          :class="{ selected: selectedId === node.id }"
          @click.stop="emit('select', node.id)"
        >
          <rect
            :x="node.x"
            :y="node.y"
            :width="node.width"
            :height="node.height"
            class="dir-rect"
            :class="{ selected: selectedId === node.id }"
            rx="8"
          />
          <rect
            :x="node.x"
            :y="node.y"
            :width="4"
            :height="node.height"
            fill="#4b5563"
            rx="2"
          />
          <text
            :x="node.x + 12"
            :y="node.y + 18"
            class="dir-label"
          >{{ node.name }}</text>
        </g>

        <!-- Edges -->
        <path
          v-for="edge in edges"
          :key="edge.id"
          :d="edgePath(edge)"
          class="edge"
          :class="{
            'edge--cycle': edge.isCycle,
            'edge--highlight': highlightedEdges.has(edge.id),
            'edge--type': edge.isTypeOnly,
          }"
          :marker-end="edge.isCycle ? 'url(#arrow-cycle)' : highlightedEdges.has(edge.id) ? 'url(#arrow-highlight)' : 'url(#arrow)'"
          fill="none"
        />

        <!-- File nodes -->
        <g
          v-for="node in nodes.filter(n => !n.isDirectory)"
          :key="node.id"
          class="file-node"
          :class="{ selected: selectedId === node.id }"
          @click.stop="emit('select', node.id)"
          @mouseenter="emit('hover', node.id)"
          @mouseleave="emit('hover', null)"
        >
          <rect
            :x="node.x"
            :y="node.y"
            :width="node.width"
            :height="node.height"
            class="file-rect"
            rx="4"
          />
          <rect
            :x="node.x"
            :y="node.y"
            :width="3"
            :height="node.height"
            :fill="node.name.endsWith('.vue') ? '#42b883' : node.name.endsWith('.ts') || node.name.endsWith('.tsx') ? '#3178c6' : '#e8d44d'"
            rx="2"
          />
          <text
            :x="node.x + 10"
            :y="node.y + 20"
            class="file-label"
          >{{ node.name }}</text>
        </g>
      </g>
    </svg>
  </div>
</template>

<style scoped>
.graph-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.zoom-controls {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  gap: 4px;
  z-index: 10;
}

.zoom-controls button {
  width: 32px;
  height: 32px;
  border: 1px solid #374151;
  background: #1f2937;
  color: #e5e7eb;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.zoom-controls button:hover {
  background: #374151;
}

svg {
  display: block;
}

.dir-node {
  cursor: pointer;
}

.dir-rect {
  fill: rgba(55, 65, 81, 0.15);
  stroke: #4b5563;
  stroke-width: 1;
  stroke-dasharray: 4 2;
}

.dir-rect.selected {
  stroke: #60a5fa;
  stroke-width: 2;
}

.dir-label {
  fill: #6b7280;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.edge {
  stroke: #6b7280;
  stroke-width: 1.5;
  transition: stroke 0.15s;
}

.edge--type {
  stroke-dasharray: 6 3;
  opacity: 0.6;
}

.edge--cycle {
  stroke: #ef4444;
  stroke-width: 2;
}

.edge--highlight {
  stroke: #60a5fa;
  stroke-width: 2;
}

.file-node {
  cursor: pointer;
}

.file-rect {
  fill: #1e293b;
  stroke: #334155;
  stroke-width: 1.5;
  transition: all 0.15s;
}

.file-node:hover .file-rect {
  fill: #1e3a5f;
  stroke: #60a5fa;
}

.file-node.selected .file-rect {
  fill: #1e3a5f;
  stroke: #3b82f6;
  stroke-width: 2;
}

.file-label {
  fill: #e2e8f0;
  font-size: 11px;
  pointer-events: none;
}
</style>
