<script setup lang="ts">
defineProps<{
  x: number;
  nominal: number;
  uncertainty: number;
}>();
</script>

<template>
  <g>
    <circle :cx="x" :cy="nominal" r="5" />
    <line
      :x1="x"
      :y1="nominal - uncertainty"
      :x2="x"
      :y2="nominal + uncertainty"
      stroke="black"
    />
  </g>
</template>
