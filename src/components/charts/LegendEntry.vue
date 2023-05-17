<script setup lang="ts">
import { shorten_string } from 'src/utils/strings';
const props = defineProps<{
  size: number;
  color: string;
  x: number;
  y: number;
  title: string;
  isnothighlighted: boolean;
}>();
</script>

<template>
  <g>
    <rect
      :height="size"
      :width="size"
      :fill="color"
      :x="x"
      :y="y"
      :class="{
        isnothighlighted: isnothighlighted,
      }"
    />
    <text
      :x="x + size + 5"
      :y="y + 15"
      :class="{
        isnothighlighted: isnothighlighted,
      }"
    >
      {{ shorten_string(title, 10) }}
      <title>
        {{ title }}
      </title>
    </text>
  </g>
</template>

<style scoped>
rect.isnothighlighted {
  fill-opacity: 0.5;
  transition: fill-opacity 0.5s ease;
}

text.isnothighlighted {
  fill: grey;
  transition: fill 0.5s ease;
}
</style>
