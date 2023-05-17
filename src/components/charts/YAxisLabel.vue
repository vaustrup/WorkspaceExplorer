<script setup lang="ts">
defineProps<{
  x: number;
  y: number;
}>();
</script>

<template>
  <text
    :x="x"
    :y="y"
    transform="rotate(-90)"
    dominant-baseline="middle"
    text-anchor="middle"
  >
    <slot></slot>
  </text>
</template>
