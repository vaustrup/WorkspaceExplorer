<script setup lang="ts">
import { computed } from 'vue';
import { useWorkspaceStore } from 'src/stores/workspace';
import DownloadHelper from 'src/components/DownloadHelper.vue';
import useHighlighted from 'src/composables/useHighlighted';
import { shorten_string } from 'src/utils/strings';
import { linear_scale } from 'src/utils/plots';

const { highlight, unhighlight, ishighlighted } = useHighlighted();

const props = defineProps<{
  id: number;
}>();

const workspace_store = useWorkspaceStore(props.id)();

// define plot style
const tick_length = 5;
const bar_height = 35;
const padding = 5;
const number_of_ticks = 6;
const x_range = 500;
const x_label_offset = 15;
const y_label_offset = 10;
const x_title_offset = 30;

const offset =
  (bar_height + padding) * workspace_store.normalized_stacked_data.length +
  padding;

// create strings for path of axes
function yaxis_path(): string {
  let path = 'M0,0V' + offset;
  for (let i = 1; i <= workspace_store.normalized_stacked_data.length; i++) {
    path += 'M0,' + ((i - 0.5) * bar_height + i * padding);
    path += 'H-' + tick_length;
  }

  return path;
}

function xaxis_path(): string {
  let path = 'M0,' + offset + 'H' + x_range;
  for (let i = 0; i < number_of_ticks; i++) {
    path += 'M' + i * (x_range / (number_of_ticks - 1)) + ',' + offset;
    path += 'V' + (offset + tick_length);
  }
  return path;
}

// the height of the plot should be at least the height of the bars corresponding to the different channels
// but it also has to be large enough to contain all legend entries
const height = computed(() => {
  return Math.max(
    workspace_store.channel_names.length * 50 + 50,
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
          v-for="(
            channel, channel_index
          ) in workspace_store.normalized_stacked_data"
          :key="'channel' + channel_index.toString"
        >
          <rect
            v-for="(process, process_index) in channel.processes"
            :key="'process' + process_index.toString()"
            :height="bar_height"
            :width="
              linear_scale(
                channel.processes[0].low,
                channel.processes[channel.processes.length - 1].high,
                0,
                x_range
              ) *
              (process.high - process.low)
            "
            :x="
              linear_scale(
                channel.processes[0].low,
                channel.processes[channel.processes.length - 1].high,
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
        <path fill="none" stroke="#000" :d="yaxis_path()"></path>
        <text
          v-for="(
            channel, channel_index
          ) in workspace_store.normalized_stacked_data"
          :key="channel.name"
          :x="-y_label_offset"
          :y="
            (channel_index + 1) * padding + (channel_index + 0.5) * bar_height
          "
          dominant-baseline="middle"
          text-anchor="end"
        >
          {{ shorten_string(workspace_store.channel_titles[channel.name], 25) }}
          <title>
            {{ workspace_store.channel_titles[channel.name] }}
          </title>
        </text>
        <path fill="none" stroke="#000" :d="xaxis_path()"></path>
        <text
          v-for="tick in number_of_ticks"
          :key="tick"
          :y="
            (bar_height + padding) *
              workspace_store.normalized_stacked_data.length +
            padding +
            x_label_offset
          "
          :x="(tick - 1) * 20 * linear_scale(0, 100, 0, x_range)"
          dominant-baseline="middle"
          text-anchor="middle"
        >
          {{ (tick - 1) * 20 }}
        </text>
        <text
          :y="
            (bar_height + padding) *
              workspace_store.normalized_stacked_data.length +
            padding +
            x_title_offset
          "
          :x="50 * linear_scale(0, 100, 0, x_range)"
          dominant-baseline="middle"
          text-anchor="middle"
        >
          Relative Contributions in %
        </text>
        <template
          v-for="(process, process_index) in workspace_store
            .normalized_stacked_data[0].processes"
          :key="process.name"
        >
          <rect
            height="20"
            width="20"
            :fill="workspace_store.colors[process.name]"
            :x="x_range + 50"
            :y="25 * process_index"
            :id="process.name"
            :class="{
              isnothighlighted: !ishighlighted(process_index),
            }"
            @mouseover="highlight(process_index)"
            @mouseleave="unhighlight"
          />
          <text
            :x="x_range + 80"
            :y="15 + 25 * process_index"
            :id="process.name"
            :class="{
              isnothighlighted: !ishighlighted(process_index),
            }"
            @mouseover="highlight(process_index)"
            @mouseleave="unhighlight"
          >
            {{
              workspace_store.process_titles[process.name].substring(0, 18) +
              (workspace_store.process_titles[process.name].length > 18
                ? '...'
                : '')
            }}
            <title>
              {{ workspace_store.process_titles[process.name] }}
            </title>
          </text>
        </template>
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
