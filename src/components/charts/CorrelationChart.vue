<script setup lang="ts">
import { reactive, computed } from 'vue';
import { useWorkspaceStore } from 'src/stores/workspace';
import DownloadHelper from 'src/components/DownloadHelper.vue';
import { axis_path } from 'src/utils/plots';

const props = defineProps<{
  id: number;
}>();

const workspace_store = useWorkspaceStore(props.id)();

// highlight NPs on mouseover
const state = reactive({
  highlighted_np_index1: -999,
  highlighted_np_index2: -999,
});

function highlight(index1: number, index2: number): void {
  state.highlighted_np_index1 = index1;
  state.highlighted_np_index2 = index2;
}

function unhighlight(): void {
  state.highlighted_np_index1 = -999;
  state.highlighted_np_index2 = -999;
}

const correlation_threshold = 0.1;

const correlated_nps = computed(() => {
  let correlated: number[] = [];
  for (
    let index1 = 0;
    index1 < workspace_store.fitresults.correlations.length - 1;
    index1++
  ) {
    for (
      let index2 = index1 + 1;
      index2 < workspace_store.fitresults.correlations[index1].length;
      index2++
    ) {
      // correlation to itself is always 1
      if (index1 === index2) {
        continue;
      }
      // only show NPs with a correlation coefficient higher than the threshold wrt to at least one other NP
      if (
        Math.abs(workspace_store.fitresults.correlations[index1][index2]) <
        correlation_threshold
      ) {
        continue;
      }
      // we need to explicitly check whether the indices have been added to the array before
      if (!correlated.includes(index1)) {
        correlated.push(index1);
      }
      if (!correlated.includes(index2)) {
        correlated.push(index2);
      }
    }
  }
  correlated.sort();
  return correlated;
});

const size = 25;
const label_size = 250;
const label_offset = 10;
const zlabel_size = 40;
const height =
  correlated_nps.value.length * size + label_size + 2 * label_offset;
const width = height + 3 * label_offset + size + zlabel_size;

function get_correlation(np1_index: number, np2_index: number): number {
  return workspace_store.fitresults.correlations[np1_index][np2_index];
}

function get_color(np1_index: number, np2_index: number): string {
  if (np1_index === np2_index) {
    return 'white';
  }
  const correlation = get_correlation(np1_index, np2_index);
  if (correlation <= 0) {
    return 'red';
  }
  return 'blue';
}

function get_opacity(np1_index: number, np2_index: number): number {
  if (np1_index === np2_index) {
    return 0;
  }
  return Math.abs(get_correlation(np1_index, np2_index));
}

const ztick = [1.0, 0.75, 0.5, 0.25, 0.0, -0.25, -0.5, -0.75, -1.0];
const z_height = height - label_size - 2 * label_offset;
const z_ticks = [
  ...Array(ztick.length)
    .fill(0)
    .map((_, i) => i * (z_height / (ztick.length - 1))),
];
const zaxis_path = axis_path(
  label_size + label_offset * 3 + correlated_nps.value.length * size + size,
  0,
  z_height,
  z_ticks,
  false,
  false
);
</script>

<template>
  <div>
    <DownloadHelper
      :svg_id="'correlationchart' + workspace_store.name"
      :id="id"
    />
    <svg
      :width="width"
      :height="height"
      :id="'svg_correlationchart' + workspace_store.name"
    >
      <defs>
        <linearGradient id="gradient" x1="0" x2="0" y1="1" y2="0">
          <stop offset="0%" stop-color="red" stop-opacity="1" />
          <stop offset="50%" stop-color="white" stop-opacity="0" />
          <stop offset="100%" stop-color="blue" stop-opacity="1" />
        </linearGradient>
      </defs>
      <g :transform="'translate(0,' + label_offset + ')'">
        <template v-for="(np1_index, index1) in correlated_nps">
          <rect
            v-for="(np2_index, index2) in correlated_nps"
            :key="
              workspace_store.fitresults.labels[np1_index] +
              workspace_store.fitresults.labels[np2_index]
            "
            :fill="get_color(np1_index, np2_index)"
            :fill-opacity="get_opacity(np1_index, np2_index)"
            :height="size"
            :width="size"
            :x="size * index2 + label_size + label_offset"
            :y="size * index1"
            stroke-opacity="0"
            stroke="black"
            @mouseover="highlight(np1_index, np2_index)"
            @mouseleave="unhighlight"
            :class="{
              ishighlighted:
                np1_index === state.highlighted_np_index1 &&
                np2_index === state.highlighted_np_index2,
            }"
          >
            <title>
              {{
                'NP1: ' +
                workspace_store.fitresults.labels[np1_index] +
                '\nNP2: ' +
                workspace_store.fitresults.labels[np2_index] +
                '\nCorrelation: ' +
                get_correlation(np1_index, np2_index)
              }}
            </title>
          </rect>
        </template>
        <text
          v-for="(np1_index, index1) in correlated_nps"
          :key="'ylabel' + np1_index"
          :x="label_size"
          text-anchor="end"
          :y="size * index1 + 0.5 * size"
          dominant-baseline="middle"
          :class="{
            isnothighlighted:
              np1_index !== state.highlighted_np_index1 &&
              state.highlighted_np_index1 !== -999,
          }"
        >
          {{ workspace_store.fitresults.labels[np1_index] }}
        </text>
        <text
          v-for="(np2_index, index2) in correlated_nps"
          :key="'xlabel' + np2_index"
          :x="-correlated_nps.length * size - label_offset"
          text-anchor="end"
          :y="label_size + label_offset + size * index2 + 0.5 * size"
          dominant-baseline="middle"
          transform="rotate(-90)"
          :class="{
            isnothighlighted:
              np2_index !== state.highlighted_np_index2 &&
              state.highlighted_np_index2 !== -999,
          }"
        >
          {{ workspace_store.fitresults.labels[np2_index] }}
        </text>
        <rect
          :x="label_size + label_offset * 3 + correlated_nps.length * size"
          y="0"
          :width="size"
          :height="correlated_nps.length * size"
          fill="url(#gradient)"
        />
        <path fill="none" stroke="#000" :d="zaxis_path"></path>
        <text
          v-for="(tick, index) of ztick"
          :key="'ztick' + tick"
          :x="
            label_size + label_offset * 4 + correlated_nps.length * size + size
          "
          :y="(index * z_height) / (ztick.length - 1)"
          dominant-baseline="middle"
        >
          {{ tick }}
        </text>
      </g>
    </svg>
  </div>
</template>

<style scoped>
rect.ishighlighted {
  stroke-opacity: 1;
}

text.isnothighlighted {
  fill: grey;
  transition: fill 0.5s ease;
}
</style>
