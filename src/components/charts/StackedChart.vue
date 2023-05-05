<script setup lang="ts">
import { computed } from 'vue';
import { useWorkspaceStore } from '../../stores/workspace';
import DownloadHelper from '../DownloadHelper.vue';
import useHighlighted from '../../composables/useHighlighted';

const { highlight, unhighlight, ishighlighted } = useHighlighted();

const props = defineProps<{
  id: number;
  channel_index: number;
}>();

const workspace_store = useWorkspaceStore(props.id)();

const number_of_bins =
  workspace_store.workspace.channels[props.channel_index].samples[0].data
    .length;

const bins = Array.from({ length: number_of_bins }, (e, i) => i);

const maximum = computed(() => {
  let max = 0;
  for (
    let i_bin = 0;
    i_bin <
    workspace_store.stacked_data_per_bin[props.channel_index].content.length;
    i_bin++
  ) {
    if (
      max <
      workspace_store.stacked_data_per_bin[props.channel_index].content[i_bin][
        workspace_store.process_names.length - 1
      ].high
    ) {
      max =
        workspace_store.stacked_data_per_bin[props.channel_index].content[
          i_bin
        ][workspace_store.process_names.length - 1].high;
    }
    if (
      max <
      workspace_store.stacked_data_per_bin[props.channel_index].data[i_bin]
    ) {
      max =
        workspace_store.stacked_data_per_bin[props.channel_index].data[i_bin];
    }
  }
  return max;
});

// method to scale height and position in y to a given range
function vertical_scale(
  input_min: number,
  input_max: number,
  target_min: number,
  target_max: number
): number {
  return (target_max - target_min) / (input_max - input_min) + target_min;
}

const bin_width = computed(() => {
  const max_width = 1000;
  const min_width = 250;
  let bin_width = 25;
  let total_width = Math.max(min_width, bin_width * number_of_bins); // plot should have a width of at least 250px
  total_width = Math.min(total_width, max_width); // plot should have a width of at most 1000px
  return total_width / number_of_bins;
});

const tick_length = 5;

function xaxis_path(): string {
  let path = 'M100,350H' + (bin_width.value * number_of_bins + 100);
  for (let i_bin = 0; i_bin <= number_of_bins; i_bin++) {
    path += 'M' + (100 + i_bin * bin_width.value) + ',350';
    path += 'V' + (350 + tick_length);
  }
  return path;
}

function number_of_zeroes(): number {
  return Math.floor(Math.log10(maximum.value));
}

function maximum_normalised(): number {
  // returns the highest value in any of the bins divided by the next smaller power of ten
  return maximum.value / 10 ** number_of_zeroes();
}

function y_ticks(): number[] {
  let ticks = [];
  // if maximum is between 1 and 5 10^n: set a tick for each m*e^n
  // if maximum is between 5 and 9 10^n: set a tick for every second m*e^n
  const max = maximum_normalised();
  if (max > 8) {
    ticks = [0, 2, 4, 6, 8];
  } else if (max > 6) {
    ticks = [0, 2, 4, 6];
  } else if (max > 5) {
    ticks = [0, 1, 2, 3, 4, 5];
  } else if (max > 4) {
    ticks = [0, 1, 2, 3, 4];
  } else if (max > 3) {
    ticks = [0, 1, 2, 3];
  } else if (max > 2) {
    ticks = [0, 0.5, 1, 1.5, 2];
  } else if (max > 1.5) {
    ticks = [0, 0.5, 1, 1.5];
  } else {
    ticks = [0, 0.5, 1];
  }
  return ticks;
}

function y_tick_positions(): number[] {
  const max = maximum_normalised();
  let tick_positions = [];
  for (const tick of y_ticks()) {
    tick_positions.push(350 - (300 / max) * tick);
  }
  return tick_positions;
}

function yaxis_path(): string {
  let path = 'M100,350V40';
  for (const tick_position of y_tick_positions()) {
    path += 'M100,' + tick_position;
    path += 'H' + (100 - tick_length);
  }
  return path;
}
</script>

<template>
  <div class="stackedchart">
    <h3
      :style="
        'width: ' +
        (200 + bin_width * number_of_bins) +
        'px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; display: inline-block;'
      "
      :title="
        workspace_store.channel_titles[
          workspace_store.channel_names[channel_index]
        ]
      "
    >
      {{
        workspace_store.channel_titles[
          workspace_store.channel_names[channel_index]
        ]
      }}
    </h3>
    <svg
      height="400"
      :width="bin_width * number_of_bins + 300"
      :id="
        'svg_stackedchart' +
        workspace_store.name +
        workspace_store.channel_names[channel_index]
      "
    >
      <template v-for="bin in bins" :key="bin">
        <template
          v-for="(process_name, process_index) in workspace_store.process_names"
          :key="process_name"
        >
          <rect
            :x="bin_width * bin + 100"
            :width="bin_width"
            :y="
              350 -
              vertical_scale(0, maximum, 0, 300) *
                workspace_store.stacked_data_per_bin[channel_index].content[
                  bin
                ][process_index].high
            "
            :height="
              vertical_scale(0, maximum, 0, 300) *
              (workspace_store.stacked_data_per_bin[channel_index].content[bin][
                process_index
              ].high -
                workspace_store.stacked_data_per_bin[channel_index].content[
                  bin
                ][process_index].low)
            "
            :fill="workspace_store.colors[process_name]"
            :class="{
              isnothighlighted: !ishighlighted(process_index),
            }"
            @mouseover="highlight(process_index)"
            @mouseleave="unhighlight"
          />
        </template>
        <circle
          :cx="bin_width * (bin + 0.5) + 100"
          :cy="
            350 -
            vertical_scale(0, maximum, 0, 300) *
              workspace_store.stacked_data_per_bin[channel_index].data[bin]
          "
          r="5"
        />
        <line
          :x1="bin_width * (bin + 0.5) + 100"
          :y1="
            350 -
            vertical_scale(0, maximum, 0, 300) *
              (workspace_store.stacked_data_per_bin[channel_index].data[bin] -
                workspace_store.stacked_data_per_bin[channel_index].data[bin] **
                  0.5)
          "
          :x2="bin_width * (bin + 0.5) + 100"
          :y2="
            350 -
            vertical_scale(0, maximum, 0, 300) *
              (workspace_store.stacked_data_per_bin[channel_index].data[bin] +
                workspace_store.stacked_data_per_bin[channel_index].data[bin] **
                  0.5)
          "
          stroke="black"
        />
      </template>
      <path fill="none" stroke="#000" :d="xaxis_path()"></path>
      <text
        v-for="bin in bins"
        :key="bin"
        :x="360"
        :y="-bin_width * bin - 100 - 0.5 * bin_width"
        transform="rotate(90)"
        dominant-baseline="middle"
        text-anchor="start"
      >
        bin {{ bin + 1 }}
      </text>
      <path fill="none" stroke="#000" :d="yaxis_path()"></path>
      <text
        v-for="(tick_label, tick_index) in y_ticks()"
        :key="tick_label"
        x="90"
        :y="y_tick_positions()[tick_index]"
        dominant-baseline="middle"
        text-anchor="end"
      >
        {{ tick_label }}
      </text>
      <text x="95" y="35" dominant-baseline="middle" text-anchor="end">
        <tspan dy="-0px">x10</tspan>
        <tspan dy="-8px">{{ number_of_zeroes() }}</tspan>
      </text>
      <text
        x="-175"
        y="50"
        transform="rotate(-90)"
        dominant-baseline="middle"
        text-anchor="middle"
      >
        Number of events per bin
      </text>
      <circle
        :cx="bin_width * number_of_bins + 115 + 10"
        :cy="400 - workspace_store.number_of_processes * 25 - 75"
        r="5"
      />
      <line
        :x1="bin_width * number_of_bins + 115 + 10"
        :y1="400 - workspace_store.number_of_processes * 25 - 75 + 10"
        :x2="bin_width * number_of_bins + 115 + 10"
        :y2="400 - workspace_store.number_of_processes * 25 - 75 - 10"
        stroke="black"
      />
      <text
        :x="bin_width * number_of_bins + 145"
        :y="400 - workspace_store.number_of_processes * 25 - 70"
      >
        data
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
          :x="bin_width * number_of_bins + 115"
          :y="
            400 -
            workspace_store.number_of_processes * 25 +
            25 * process_index -
            50
          "
          :id="process.name"
          :class="{
            isnothighlighted: !ishighlighted(process_index),
          }"
          @mouseover="highlight(process_index)"
          @mouseleave="unhighlight"
        />
        <text
          :x="bin_width * number_of_bins + 145"
          :y="
            400 -
            workspace_store.number_of_processes * 25 +
            15 -
            50 +
            25 * process_index
          "
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
    </svg>
    <DownloadHelper
      :svg_id="
        'stackedchart' +
        workspace_store.name +
        workspace_store.channel_names[channel_index]
      "
      :id="id"
    />
  </div>
</template>

<style scoped>
rect.isnothighlighted {
  fill-opacity: 0.5;
  transition: fill-opacity 0.5s ease;
}

path.isnothighlighted {
  fill-opacity: 0.5;
  transition: fill-opacity 0.5s ease;
}

text.isnothighlighted {
  fill: grey;
  transition: fill 0.5s ease;
}

h3 {
  font-size: 1.2em;
}
</style>
