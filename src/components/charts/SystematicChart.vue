<script setup lang="ts">
import { computed } from 'vue';
import { useWorkspaceStore } from 'src/stores/workspace';
import DownloadHelper from 'src/components/DownloadHelper.vue';
import { linear_scale, axis_path } from 'src/utils/plots';
import YAxisLabel from 'src/components/charts/YAxisLabel.vue';
import DataPoint from 'src/components/charts/DataPoint.vue';

const props = defineProps<{
  id: number;
  channel_index: number;
  modifier_index: number;
}>();

const workspace_store = useWorkspaceStore(props.id)();

const number_of_bins =
  workspace_store.workspace.channels[props.channel_index].samples[0].data
    .length;

const bins = Array.from({ length: number_of_bins }, (e, i) => i);
const bin_width = computed(() => {
  const max_width = 1000;
  const min_width = 250;
  const width_per_bin = 25;
  let total_width = Math.max(min_width, width_per_bin * number_of_bins); // plot should have a width of at least 250px
  total_width = Math.min(total_width, max_width); // plot should have a width of at most 1000px
  return total_width / number_of_bins;
});

const x_ticks = [
  ...Array(number_of_bins + 1)
    .fill(0)
    .map((_, i) => i * bin_width.value),
];
const xaxis_path = axis_path(
  100,
  350,
  bin_width.value * number_of_bins + 100,
  x_ticks,
  true,
  true
);

const channel_title = computed(() => {
  return workspace_store.channel_titles[
    workspace_store.channel_names[props.channel_index]
  ];
});
const modifier_name = computed(() => {
  return workspace_store.modifier_names[props.modifier_index];
});

const stacked_data = computed(() => {
  return workspace_store.stacked_data_per_bin[props.channel_index];
});

const maximum = computed(() => {
  let max = 0;
  for (let i_bin = 0; i_bin < stacked_data.value.content.length; i_bin++) {
    const high_value =
      stacked_data.value.content[i_bin][
        workspace_store.process_names.length - 1
      ].high;
    if (max < high_value) {
      max = high_value;
    }
    const data_value = stacked_data.value.data[i_bin];
    if (max < data_value) {
      max = data_value;
    }
  }
  return max;
});

const yscale = computed(() => {
  return linear_scale(0, maximum.value, 0, 300);
});

const number_of_zeroes = computed(() => {
  return Math.floor(Math.log10(maximum.value));
});

const maximum_normalised = computed(() => {
  // returns the highest value in any of the bins divided by the next smaller power of ten
  return maximum.value / 10 ** number_of_zeroes.value;
});

const y_ticks = computed(() => {
  // if maximum is between 1 and 2 10^n: set a tick for each 0.5m*e^n
  // if maximum is between 2 and 5 10^n: set a tick for each m*e^n
  // if maximum is between 5 and 9 10^n: set a tick for every second m*e^n
  const max = maximum_normalised.value;
  let stepsize = 0.5;
  if (max >= 6) {
    stepsize = 2;
  } else if (max >= 3) {
    stepsize = 1;
  }
  let i = 0;
  const ticks = [];
  while (i <= max) {
    ticks.push(i);
    i += stepsize;
  }
  return ticks;
});

const y_tick_positions = computed(() => {
  const max = maximum_normalised.value;
  return y_ticks.value.map((tick) => -(300 / max) * tick);
});

const yaxis_path = computed(() => {
  return axis_path(100, 350, 40, y_tick_positions.value, false, true);
});
</script>

<template>
  <div class="column">
    <h3>
      {{ channel_title }}
    </h3>
    <svg
      height="400"
      :width="bin_width * number_of_bins + 300"
      :id="
        'svg_systematicchart' +
        workspace_store.name +
        channel_title +
        modifier_name
      "
    >
      <template v-for="bin in bins" :key="bin">
        <line
          :x1="100 + bin * bin_width"
          :y1="
            350 -
            yscale *
              stacked_data.content[bin][
                workspace_store.process_names.length - 1
              ].high
          "
          :x2="100 + (bin + 1) * bin_width"
          :y2="
            350 -
            yscale *
              stacked_data.content[bin][
                workspace_store.process_names.length - 1
              ].high
          "
          stroke="black"
        />
        <line
          :x1="100 + bin * bin_width"
          :y1="
            350 -
            yscale *
              1.1 *
              stacked_data.content[bin][
                workspace_store.process_names.length - 1
              ].high
          "
          :x2="100 + (bin + 1) * bin_width"
          :y2="
            350 -
            yscale *
              1.1 *
              stacked_data.content[bin][
                workspace_store.process_names.length - 1
              ].high
          "
          stroke="blue"
        />
        <line
          :x1="100 + bin * bin_width"
          :y1="
            350 -
            yscale *
              0.9 *
              stacked_data.content[bin][
                workspace_store.process_names.length - 1
              ].high
          "
          :x2="100 + (bin + 1) * bin_width"
          :y2="
            350 -
            yscale *
              0.9 *
              stacked_data.content[bin][
                workspace_store.process_names.length - 1
              ].high
          "
          stroke="red"
        />
        <DataPoint
          :x="bin_width * (bin + 0.5) + 100"
          :nominal="350 - yscale * stacked_data.data[bin]"
          :uncertainty="yscale * stacked_data.data[bin] ** 0.5"
        />
      </template>
      <path fill="none" stroke="#000" :d="xaxis_path"></path>
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
      <path fill="none" stroke="#000" :d="yaxis_path"></path>
      <text
        v-for="(tick_label, tick_index) in y_ticks"
        :key="tick_label"
        x="90"
        :y="350 + y_tick_positions[tick_index]"
        dominant-baseline="middle"
        text-anchor="end"
      >
        {{ tick_label }}
      </text>
      <text x="95" y="35" dominant-baseline="middle" text-anchor="end">
        <tspan dy="-0px">x10</tspan>
        <tspan dy="-8px">{{ number_of_zeroes }}</tspan>
      </text>
      <YAxisLabel :x="-175" :y="50">Number of events per bin</YAxisLabel>
    </svg>
    <DownloadHelper
      :svg_id="
        'systematicchart' + workspace_store.name + channel_title + modifier_name
      "
      :id="id"
    />
  </div>
</template>
