<script setup lang="ts">
import HelloWorld from './HelloWorld.vue';
import { useCounter } from './composables/useCounter';

const { count, increment } = useCounter();
</script>

<template>
  <HelloWorld :count="count" @increment="increment" />
</template>
