<script setup lang="ts">
import DataPoint from 'src/components/charts/DataPoint.vue';

const props = defineProps<{
  bin: number;
  bin_width: number;
  yscale: number;
  nominal: number;
  up_variation: number;
  down_variation: number;
  data: number;
}>();

const x1 = 100 + props.bin * props.bin_width;
const x2 = x1 + props.bin_width;
const y = 350 - props.yscale * props.nominal;
const y_up = y - props.yscale * props.up_variation;
const y_down = y - props.yscale * props.down_variation;
</script>

<template>
  <line :x1="x1" :y1="y" :x2="x2" :y2="y" stroke="black" />
  <line :x1="x1" :y1="y_up" :x2="x2" :y2="y_up" stroke="blue" />
  <line :x1="x1" :y1="y_down" :x2="x2" :y2="y_down" stroke="red" />
  <DataPoint
    :x="x1 + 0.5 * bin_width"
    :nominal="350 - yscale * data"
    :uncertainty="yscale * data ** 0.5"
  />
</template>
