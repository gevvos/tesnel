<script setup lang="ts">
import { useFormatter } from './composables/useFormatter';

defineProps<{ count: number }>();
defineEmits<{ increment: [] }>();

const { format } = useFormatter();
</script>

<template>
  <div>
    <p>{{ format(count) }}</p>
    <button @click="$emit('increment')">+</button>
  </div>
</template>
