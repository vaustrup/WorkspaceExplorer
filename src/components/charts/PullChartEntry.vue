<script setup lang="ts">
const props = defineProps<{
  np_name: string;
  y: number;
  x_offset: number;
  bestfit: number;
  sigma_width: number;
  uncertainty: number;
  isnothighlighted: boolean;
}>();
</script>

<template>
  <text
    :y="y"
    x="0"
    text-anchor="end"
    dominant-baseline="middle"
    :class="{ isnothighlighted: isnothighlighted }"
  >
    {{ np_name }}
  </text>
  <circle
    :cx="x_offset + bestfit * sigma_width"
    :cy="y"
    fill="black"
    r="5"
    :class="{ isnothighlighted: isnothighlighted }"
  />
  <line
    :x1="x_offset + Math.max(bestfit - uncertainty, -2) * sigma_width"
    :x2="x_offset + Math.min(bestfit + uncertainty, 2) * sigma_width"
    :y1="y"
    :y2="y"
    stroke="black"
    :class="{ isnothighlighted: isnothighlighted }"
  />
</template>

<style scoped>
circle.isnothighlighted {
  fill-opacity: 0.3;
  transition: fill-opacity 0.5s ease;
}

line.isnothighlighted {
  stroke-opacity: 0.3;
  transition: fill-opacity 0.5s ease;
}

text.isnothighlighted {
  fill: grey;
  transition: fill 0.5s ease;
}
</style>
