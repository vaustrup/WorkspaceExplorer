<script setup lang="ts">
import { computed } from 'vue';
import { useWorkspaceStore } from 'src/stores/workspace';
import DownloadHelper from 'src/components/DownloadHelper.vue';
import { linear_scale, axis_path } from 'src/utils/plots';
import YAxisLabel from 'src/components/charts/YAxisLabel.vue';
import SystematicChartContent from 'src/components/charts/SystematicChartContent.vue';

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

const width = computed(() => {
  return channel.number_of_bins * bin_width.value;
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
  return Math.max(
    ...stacked_data.value.content.map((x, i) =>
      Math.max(
        x[workspace_store.number_of_processes - 1].high,
        x[workspace_store.number_of_processes - 1].high +
          Math.max(up_variation.value[i], down_variation.value[i]),
        stacked_data.value.data[i]
      )
    )
  );
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
        (200 + width) +
        'px; overflow: hidden; text-align: center; white-space: nowrap; text-overflow: ellipsis; display: inline-block;'
      "
    >
      {{ channel.title }}
    </h3>
    <svg
      height="400"
      :width="width + 300"
      :id="
        'svg_systematicchart' +
        workspace_store.name +
        channel.title +
        modifier_name
      "
    >
      <template v-for="bin in bins" :key="bin">
        <SystematicChartContent
          :bin="bin"
          :bin_width="bin_width"
          :data="stacked_data.data[bin]"
          :yscale="yscale"
          :nominal="nominal(bin)"
          :up_variation="up_variation[bin]"
          :down_variation="down_variation[bin]"
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
      <line
        :x1="100 + width + 10"
        :y1="350 - 60"
        :x2="100 + width + 30"
        :y2="350 - 60"
        stroke="black"
      />
      <text :x="100 + width + 40" :y="350 - 60" dominant-baseline="middle">
        nominal pre-fit
      </text>
      <line
        :x1="100 + width + 10"
        :y1="350 - 40"
        :x2="100 + width + 30"
        :y2="350 - 40"
        stroke="blue"
      />
      <text :x="100 + width + 40" :y="350 - 40" dominant-baseline="middle">
        +1&#963; variation
      </text>
      <line
        :x1="100 + width + 10"
        :y1="350 - 20"
        :x2="100 + width + 30"
        :y2="350 - 20"
        stroke="red"
      />
      <text :x="100 + width + 40" :y="350 - 20" dominant-baseline="middle">
        -1&#963; variation
      </text>
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
