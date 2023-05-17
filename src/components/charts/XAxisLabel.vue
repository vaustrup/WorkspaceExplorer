<script setup lang="ts">
defineProps<{
  x: number;
  y: number;
}>();
</script>

<template>
  <text :x="x" :y="y" text-anchor="middle" dominant-baseline="middle">
    <slot></slot>
  </text>
</template>
