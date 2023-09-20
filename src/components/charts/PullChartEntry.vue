<script setup lang="ts">
import { useWorkspaceStore } from 'src/stores/workspace';
import { computed, ref, watch } from 'vue';

const props = defineProps<{
  id: number;
  np_index: number;
  y: number;
  x_offset: number;
  sigma_width: number;
  isnothighlighted: boolean;
}>();

const workspace_store = useWorkspaceStore(props.id)();

const bestfit = computed(() => {
  return workspace_store.nps.bestfit[props.np_index];
});
const uncertainty = computed(() => {
  return workspace_store.nps.uncertainty[props.np_index];
});

// need to watch the bestfit props in case we want to reset the values
watch(bestfit, (newValue) => {
  x_position.value = props.x_offset + newValue * props.sigma_width;
});

const np_name = workspace_store.nps.labels[props.np_index];
const is_dragging = ref(false);
const x_position = ref(props.x_offset + bestfit.value * props.sigma_width);
const start_x = ref(0);

function startDrag(event: MouseEvent): void {
  is_dragging.value = true;
  start_x.value = event.clientX;
}

const two_sigma_width = 2 * props.sigma_width;

function drag(event: MouseEvent): void {
  if (!is_dragging.value) return;
  const delta = event.clientX - start_x.value;
  const new_position = x_position.value + delta;
  x_position.value = Math.max(
    props.x_offset - two_sigma_width,
    Math.min(props.x_offset + two_sigma_width, new_position)
  );
  workspace_store.nps.bestfit[props.np_index] =
    (x_position.value - props.x_offset) / props.sigma_width;
  start_x.value = event.clientX;
}

function endDrag(): void {
  is_dragging.value = false;
}
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
    :cx="x_position"
    :cy="y"
    fill="black"
    r="5"
    :class="{ isnothighlighted: isnothighlighted }"
  />
  <line
    :x1="
      Math.max(
        x_position - uncertainty * sigma_width,
        x_offset - two_sigma_width
      )
    "
    :x2="
      Math.min(
        x_position + uncertainty * sigma_width,
        x_offset + two_sigma_width
      )
    "
    :y1="y"
    :y2="y"
    stroke="black"
    :class="{ isnothighlighted: isnothighlighted }"
  />
  <rect
    :x="x_offset - two_sigma_width"
    :y="y - 12.5"
    :height="25"
    :width="4 * sigma_width"
    fill-opacity="0"
    stroke-opacity="0"
    stroke="black"
    @mousedown="startDrag"
    @mousemove="drag"
    @mouseup="endDrag"
    class="nprect"
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

rect.nprect:hover {
  cursor: ew-resize;
}
</style>
