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
  modifier_name: string;
}>();

const workspace_store = useWorkspaceStore(props.id)();

const channel = workspace_store.channels[props.channel_index];

const bins = Array.from({ length: channel.number_of_bins }, (e, i) => i);
const bin_width = computed(() => {
  const max_width = 1000;
  const min_width = 250;
  const width_per_bin = 25;
  let total_width = Math.max(min_width, width_per_bin * channel.number_of_bins); // plot should have a width of at least 250px
  total_width = Math.min(total_width, max_width); // plot should have a width of at most 1000px
  return total_width / channel.number_of_bins;
});

const x_ticks = [
  ...Array(channel.number_of_bins + 1)
    .fill(0)
    .map((_, i) => i * bin_width.value),
];
const xaxis_path = axis_path(
  100,
  350,
  bin_width.value * channel.number_of_bins + 100,
  x_ticks,
  true,
  true
);

const stacked_data = computed(() => {
  return channel.stacked_data_per_bin;
});

const maximum = computed(() => {
  let max = 0;
  for (let i_bin = 0; i_bin < stacked_data.value.content.length; i_bin++) {
    const nominal =
      stacked_data.value.content[i_bin][
        workspace_store.process_names.length - 1
      ].high;
    if (max < nominal) {
      max = nominal;
    }
    const up = nominal + up_variation.value[i_bin];
    if (max < up) {
      max = up;
    }
    const down = nominal + down_variation.value[i_bin];
    if (max < down) {
      max = down;
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

const nominal = (bin: number): number => {
  return stacked_data.value.content[bin][
    workspace_store.process_names.length - 1
  ].high;
};

const up_variation = computed(() => {
  let variation = new Array(channel.number_of_bins).fill(0);
  for (const yields in channel.modifier_yields) {
    variation = variation.map(
      (e, i) =>
        e + channel.modifier_yields[yields][props.modifier_name]['up'][i]
    );
  }
  return variation;
});

const down_variation = computed(() => {
  let variation = new Array(channel.number_of_bins).fill(0);
  for (const yields in channel.modifier_yields) {
    variation = variation.map(
      (e, i) =>
        e + channel.modifier_yields[yields][props.modifier_name]['down'][i]
    );
  }
  return variation;
});
</script>

<template>
  <div class="column">
    <h3
      :style="
        'width: ' +
        (200 + bin_width * channel.number_of_bins) +
        'px; overflow: hidden; text-align: center; white-space: nowrap; text-overflow: ellipsis; display: inline-block;'
      "
    >
      {{ channel.title }}
    </h3>
    <svg
      height="400"
      :width="bin_width * channel.number_of_bins + 300"
      :id="
        'svg_systematicchart' +
        workspace_store.name +
        channel.title +
        modifier_name
      "
    >
      <template v-for="bin in bins" :key="bin">
        <line
          :x1="100 + bin * bin_width"
          :y1="350 - yscale * nominal(bin)"
          :x2="100 + (bin + 1) * bin_width"
          :y2="350 - yscale * nominal(bin)"
          stroke="black"
        />
        <line
          :x1="100 + bin * bin_width"
          :y1="350 - yscale * (nominal(bin) + up_variation[bin])"
          :x2="100 + (bin + 1) * bin_width"
          :y2="350 - yscale * (nominal(bin) + up_variation[bin])"
          stroke="blue"
        />
        <line
          :x1="100 + bin * bin_width"
          :y1="350 - yscale * (nominal(bin) + down_variation[bin])"
          :x2="100 + (bin + 1) * bin_width"
          :y2="350 - yscale * (nominal(bin) + down_variation[bin])"
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
        'systematicchart' + workspace_store.name + channel.title + modifier_name
      "
      :id="id"
    />
  </div>
</template>

<style scoped>
h3 {
  font-size: 1.2em;
}
</style>
