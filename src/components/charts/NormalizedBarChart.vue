<script setup lang="ts">
import { computed } from 'vue';
import { useWorkspaceStore } from 'src/stores/workspace';
import DownloadHelper from 'src/components/DownloadHelper.vue';
import useHighlighted from 'src/composables/useHighlighted';
import { shorten_string } from 'src/utils/strings';
import { linear_scale, axis_path } from 'src/utils/plots';
import LegendEntry from 'src/components/charts/LegendEntry.vue';
import XAxisLabel from './XAxisLabel.vue';

const { highlight, unhighlight, ishighlighted } = useHighlighted();

const props = defineProps<{
  id: number;
}>();

const workspace_store = useWorkspaceStore(props.id)();

// define plot style
const bar_height = 35;
const padding = 5;
const number_of_ticks = 6;
const x_range = 500;
const x_label_offset = 15;
const y_label_offset = 10;
const x_title_offset = 30;

const offset =
  (bar_height + padding) * workspace_store.channels.length + padding;

// create strings for path of axes
const y_ticks = [
  ...Array(workspace_store.channels.length)
    .fill(0)
    .map((_, i) => (i + 0.5) * bar_height + (i + 1) * padding),
];
const yaxis_path = axis_path(0, 0, offset, y_ticks, false, true);

const x_ticks = [
  ...Array(number_of_ticks)
    .fill(0)
    .map((_, i) => i * (x_range / (number_of_ticks - 1))),
];
const xaxis_path = axis_path(0, offset, x_range, x_ticks, true, true);

// the height of the plot should be at least the height of the bars corresponding to the different channels
// but it also has to be large enough to contain all legend entries
const height = computed(() => {
  return Math.max(
    workspace_store.channels.length * 50 + 50,
    workspace_store.number_of_processes * 25
  );
});
</script>

<template>
  <div>
    <DownloadHelper
      :svg_id="'normalizedbarchart' + workspace_store.name"
      :id="id"
    />
    <svg
      width="1000"
      :height="height"
      :id="'svg_normalizedbarchart' + workspace_store.name"
    >
      <g transform="translate(250, 10)">
        <template
          v-for="(channel, channel_index) in workspace_store.channels"
          :key="'channel' + channel_index.toString"
        >
          <rect
            v-for="(process, process_index) in channel.normalized_stacked_data
              .processes"
            :key="'process' + process_index.toString()"
            :height="bar_height"
            :width="
              linear_scale(
                channel.normalized_stacked_data.processes[0].low,
                channel.normalized_stacked_data.processes[
                  workspace_store.number_of_processes - 1
                ].high,
                0,
                x_range
              ) *
              (process.high - process.low)
            "
            :x="
              linear_scale(
                channel.normalized_stacked_data.processes[0].low,
                channel.normalized_stacked_data.processes[
                  workspace_store.number_of_processes - 1
                ].high,
                0,
                x_range
              ) * process.low
            "
            :y="(bar_height + padding) * channel_index + padding"
            :fill="workspace_store.colors[process.name]"
            :class="{
              isnothighlighted: !ishighlighted(process_index),
            }"
            @mouseover="highlight(process_index)"
            @mouseleave="unhighlight"
          />
        </template>
        <path fill="none" stroke="#000" :d="yaxis_path"></path>
        <text
          v-for="(channel, channel_index) in workspace_store.channels"
          :key="channel.name"
          :x="-y_label_offset"
          :y="
            (channel_index + 1) * padding + (channel_index + 0.5) * bar_height
          "
          dominant-baseline="middle"
          text-anchor="end"
        >
          {{ shorten_string(channel.title, 25) }}
          <title>
            {{ channel.title }}
          </title>
        </text>
        <path fill="none" stroke="#000" :d="xaxis_path"></path>
        <text
          v-for="tick in number_of_ticks"
          :key="tick"
          :y="
            (bar_height + padding) * workspace_store.channels.length +
            padding +
            x_label_offset
          "
          :x="(tick - 1) * 20 * linear_scale(0, 100, 0, x_range)"
          dominant-baseline="middle"
          text-anchor="middle"
        >
          {{ (tick - 1) * 20 }}
        </text>
        <XAxisLabel
          :y="
            (bar_height + padding) * workspace_store.channels.length +
            padding +
            x_title_offset
          "
          :x="50 * linear_scale(0, 100, 0, x_range)"
        >
          Relative Contributions in %
        </XAxisLabel>
        <LegendEntry
          v-for="(process, process_index) in workspace_store.process_names"
          :key="process"
          :size="20"
          :color="workspace_store.colors[process]"
          :x="x_range + 50"
          :y="25 * process_index"
          :isnothighlighted="!ishighlighted(process_index)"
          :title="workspace_store.process_titles[process]"
          @mouseover="highlight(process_index)"
          @mouseleave="unhighlight"
        />
      </g>
    </svg>
  </div>
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
