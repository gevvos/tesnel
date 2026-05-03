<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  modelValue: number;
  max: number;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: number];
}>();

const preview = ref(props.modelValue);

const onInput = (e: Event) => {
  preview.value = Number((e.target as HTMLInputElement).value);
};

const onCommit = () => {
  emit('update:modelValue', preview.value);
};
</script>

<template>
  <div class="depth-control">
    <label>Depth: {{ preview }}/{{ max }}</label>
    <input
      type="range"
      :min="1"
      :max="max"
      :value="preview"
      @input="onInput"
      @change="onCommit"
    />
  </div>
</template>

<style scoped>
.depth-control {
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 10px;
  background: #1f2937;
  border: 1px solid #374151;
  border-radius: 8px;
  padding: 8px 16px;
  z-index: 10;
}

label {
  font-size: 12px;
  color: #9ca3af;
  white-space: nowrap;
}

input[type="range"] {
  width: 120px;
  accent-color: #3b82f6;
}
</style>
