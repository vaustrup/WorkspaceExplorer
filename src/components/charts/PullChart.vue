<script setup lang="ts">
import { computed } from 'vue';
import { useWorkspaceStore } from '../../stores/workspace';
import DownloadHelper from '../DownloadHelper.vue';
import useHighlighted from '../../composables/useHighlighted';

const { highlight, unhighlight, ishighlighted, highlighted_index } =
  useHighlighted();

const props = defineProps<{
  id: number;
}>();

const workspace_store = useWorkspaceStore(props.id)();

const height_per_entry = 25;

const height = computed(() => {
  return workspace_store.fitresults.labels.length * height_per_entry + 100;
});

const sigma_width = 125;
const ylabel_width = 250;
const ylabel_offset = 10;
const width = 4 * sigma_width + ylabel_width + 2 * ylabel_offset;
const tick_length = 5;

function xaxis_path(): string {
  let path =
    'M' +
    ylabel_offset +
    ',' +
    (height.value - 100) +
    'H' +
    (4 * sigma_width + ylabel_offset);
  for (let i_tick = 0; i_tick <= 8; i_tick++) {
    path +=
      'M' +
      (ylabel_offset + (i_tick * sigma_width) / 2) +
      ',' +
      (height.value - 100);
    path += 'V' + (height.value - 100 + tick_length);
  }
  return path;
}
</script>

<template>
  <div>
    <DownloadHelper :svg_id="'pullchart' + workspace_store.name" :id="id" />
    <svg
      :width="width"
      :height="height"
      :id="'svg_pullchart' + workspace_store.name"
    >
      <g transform="translate(250, 10)">
        <rect
          :x="ylabel_offset"
          :width="4 * sigma_width"
          :height="height - 100"
          fill="yellow"
        />
        <rect
          :x="sigma_width + ylabel_offset"
          :width="2 * sigma_width"
          :height="height - 100"
          fill="green"
        />
        <line
          :x1="2 * sigma_width + ylabel_offset"
          :x2="2 * sigma_width + ylabel_offset"
          y1="0"
          :y2="height - 100"
          stroke="black"
          stroke-dasharray="8"
        />
        <template
          v-for="(np, np_index) in workspace_store.fitresults.labels"
          :key="np"
        >
          <text
            :y="np_index * height_per_entry + height_per_entry / 2"
            x="0"
            text-anchor="end"
            dominant-baseline="middle"
            :class="{
              isnothighlighted: !ishighlighted(np_index),
            }"
          >
            {{ np }}
          </text>
          <circle
            :cx="
              2 * sigma_width +
              workspace_store.fitresults.bestfit[np_index] * sigma_width +
              ylabel_offset
            "
            :cy="np_index * height_per_entry + height_per_entry / 2"
            fill="black"
            r="5"
            :class="{
              isnothighlighted: !ishighlighted(np_index),
            }"
          />
          <line
            :x1="
              2 * sigma_width +
              Math.max(
                workspace_store.fitresults.bestfit[np_index] -
                  workspace_store.fitresults.uncertainty[np_index],
                -2
              ) *
                sigma_width +
              ylabel_offset
            "
            :x2="
              2 * sigma_width +
              Math.min(
                workspace_store.fitresults.bestfit[np_index] +
                  workspace_store.fitresults.uncertainty[np_index],
                2
              ) *
                sigma_width +
              ylabel_offset
            "
            :y1="np_index * height_per_entry + height_per_entry / 2"
            :y2="np_index * height_per_entry + height_per_entry / 2"
            stroke="black"
            :class="{
              isnothighlighted: !ishighlighted(np_index),
            }"
          />
          <rect
            :x="-ylabel_width"
            :y="np_index * height_per_entry"
            :height="height_per_entry"
            :width="width"
            fill-opacity="0"
            stroke-opacity="0"
            stroke="black"
            @mouseover="highlight(np_index)"
            @mouseleave="unhighlight"
            :class="{
              ishighlighted: np_index === highlighted_index,
            }"
          >
            <title>
              {{
                'NP' +
                np +
                ': ' +
                Math.round(
                  workspace_store.fitresults.bestfit[np_index] * 1000
                ) /
                  1000 +
                ' &#177; ' +
                Math.round(
                  workspace_store.fitresults.uncertainty[np_index] * 1000
                ) /
                  1000
              }}
            </title>
          </rect>
        </template>
        <path fill="none" stroke="black" :d="xaxis_path()"></path>
        <text
          v-for="i_tick in 9"
          :key="'tick' + i_tick"
          :x="ylabel_offset + ((i_tick - 1) * sigma_width) / 2"
          :y="height - 80"
          text-anchor="middle"
        >
          {{ (i_tick - 5) / 2 }}
        </text>
        <text
          :x="ylabel_offset + 2 * sigma_width"
          :y="height - 60"
          text-anchor="middle"
        >
          (&#920;&#770; - &#920;)/&#916;&#920;
        </text>
      </g>
    </svg>
  </div>
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

rect.ishighlighted {
  stroke-opacity: 1;
}
</style>
