<script setup lang="ts">
import { computed } from 'vue';
import { useWorkspaceStore } from 'src/stores/workspace';
import DownloadHelper from 'src/components/DownloadHelper.vue';
import useHighlighted from 'src/composables/useHighlighted';
import { linear_scale, axis_path, number_of_zeroes } from 'src/utils/plots';
import LegendEntry from 'src/components/charts/LegendEntry.vue';
import YAxisLabel from 'src/components/charts/YAxisLabel.vue';
import DataPoint from 'src/components/charts/DataPoint.vue';

const { highlight, unhighlight, ishighlighted } = useHighlighted();

const props = defineProps<{
  id: number;
  channel_index: number;
  postfit: boolean;
}>();

const workspace_store = useWorkspaceStore(props.id)();

const name = 'stackedchart' + (props.postfit ? 'postfit' : 'prefit');
const channel = workspace_store.channels[props.channel_index];

const number_of_bins = channel.samples[0].data.length;

const bins = Array.from({ length: number_of_bins }, (e, i) => i);

const x_offset = 100;
const y_offset = 100;
const stacked_plot_height = 250;
const total_stacked_plot_offset = y_offset + stacked_plot_height;
const ratio_height = 80;
const ratio_offset = 20;
const total_ratio_offset =
  total_stacked_plot_offset + ratio_height + ratio_offset;

const stacked_data = computed(() => {
  return props.postfit
    ? channel.stacked_data_per_bin_postfit
    : channel.stacked_data_per_bin;
});

const maximum = computed(() => {
  let max = 0;
  for (let i_bin = 0; i_bin < number_of_bins; i_bin++) {
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

const maximum_deviation_ratio = computed(() => {
  // return maximum deviation from unity in ratio
  let max = 0;
  for (let i_bin = 0; i_bin < number_of_bins; i_bin++) {
    max = Math.max(
      max,
      Math.abs(
        1 -
          (stacked_data.value.data[i_bin] +
            stacked_data.value.data[i_bin] ** 0.5) /
            stacked_data.value.content[i_bin][
              workspace_store.process_names.length - 1
            ].high
      ),
      Math.abs(
        1 -
          (stacked_data.value.data[i_bin] -
            stacked_data.value.data[i_bin] ** 0.5) /
            stacked_data.value.content[i_bin][
              workspace_store.process_names.length - 1
            ].high
      )
    );
  }
  return max;
});

const yscale = computed(() => {
  return linear_scale(0, maximum.value, 0, 300);
});

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
  y_offset,
  total_stacked_plot_offset,
  bin_width.value * number_of_bins + 100,
  x_ticks,
  true,
  true
);

const xaxis_path_ratio = axis_path(
  y_offset,
  total_ratio_offset,
  bin_width.value * number_of_bins + 100,
  x_ticks,
  true,
  true
);

const maximum_normalised = computed(() => {
  // returns the highest value in any of the bins divided by the next smaller power of ten
  return maximum.value / 10 ** number_of_zeroes(maximum.value);
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

const y_ticks_ratio = computed(() => {
  const min = Math.max(0, 1 - maximum_deviation_ratio.value);
  const max = 1 + maximum_deviation_ratio.value;
  const delta = max - min;
  const zeroes = number_of_zeroes(delta);
  const delta_normalised = delta / 10 ** (zeroes + 1);
  let stepsize = 0.1;
  if (delta_normalised > 1.0) {
    stepsize = 1.0;
  } else if (delta_normalised > 0.6) {
    stepsize = 0.5;
  } else if (delta_normalised > 0.4) {
    stepsize = 0.3;
  } else if (delta_normalised > 0.2) {
    stepsize = 0.2;
  }
  return [
    Math.max(0, 1.0 - Math.max(0.1, stepsize * 10 ** (zeroes + 1))),
    1.0,
    1.0 + Math.max(0.1, stepsize * 10 ** (zeroes + 1)),
  ];
});

const yscale_ratio = computed(() => {
  return linear_scale(
    y_ticks_ratio.value[0],
    y_ticks_ratio.value[2],
    0,
    ratio_height
  );
});

const y_tick_positions_ratio = computed(() => {
  const diff: number = y_ticks_ratio.value[2] - y_ticks_ratio.value[0];
  const x = y_ticks_ratio.value.map(
    (tick) => -(ratio_height / diff) * (tick - y_ticks_ratio.value[0])
  );
  return x;
});

const yaxis_path = computed(() => {
  return axis_path(
    x_offset,
    total_stacked_plot_offset,
    40,
    y_tick_positions.value,
    false,
    true
  );
});

const yaxis_path_ratio = computed(() => {
  return axis_path(
    x_offset,
    total_ratio_offset,
    total_ratio_offset - ratio_height,
    y_tick_positions_ratio.value,
    false,
    true
  );
});
</script>

<template>
  <div class="name column">
    <h3
      :style="
        'width: ' +
        (200 + bin_width * number_of_bins) +
        'px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; display: inline-block;'
      "
      :title="channel.title"
    >
      {{ channel.title }}
    </h3>
    <svg
      height="500"
      :width="bin_width * number_of_bins + 300"
      :id="'svg_' + name + workspace_store.name + channel.name"
    >
      <template v-for="bin in bins" :key="bin">
        <template
          v-for="(process_name, process_index) in workspace_store.process_names"
          :key="process_name"
        >
          <rect
            :x="bin_width * bin + x_offset"
            :width="bin_width"
            :y="
              total_stacked_plot_offset -
              yscale * stacked_data.content[bin][process_index].high
            "
            :height="
              yscale *
              (stacked_data.content[bin][process_index].high -
                stacked_data.content[bin][process_index].low)
            "
            :fill="workspace_store.colors[process_name]"
            :class="{
              isnothighlighted: !ishighlighted(process_index),
            }"
            @mouseover="highlight(process_index)"
            @mouseleave="unhighlight"
          />
        </template>
        <DataPoint
          :x="bin_width * (bin + 0.5) + x_offset"
          :nominal="total_stacked_plot_offset - yscale * stacked_data.data[bin]"
          :uncertainty="yscale * stacked_data.data[bin] ** 0.5"
        />
        <DataPoint
          :x="bin_width * (bin + 0.5) + x_offset"
          :nominal="
            total_ratio_offset -
            yscale_ratio *
              (stacked_data.data[bin] /
                stacked_data.content[bin][
                  workspace_store.process_names.length - 1
                ].high -
                y_ticks_ratio[0])
          "
          :uncertainty="
            (yscale_ratio * stacked_data.data[bin] ** 0.5) /
            stacked_data.content[bin][workspace_store.process_names.length - 1]
              .high
          "
        />
      </template>
      <path fill="none" stroke="#000" :d="xaxis_path"></path>
      <path fill="none" stroke="#000" :d="xaxis_path_ratio"></path>
      <line
        stroke="#000"
        stroke-dasharray="4"
        :y1="total_ratio_offset - yscale_ratio * (1 - y_ticks_ratio[0])"
        :y2="total_ratio_offset - yscale_ratio * (1 - y_ticks_ratio[0])"
        :x1="x_offset"
        :x2="x_offset + bin_width * number_of_bins"
      />
      <text
        v-for="bin in bins"
        :key="bin"
        :x="total_ratio_offset + 10"
        :y="-bin_width * bin - x_offset - 0.5 * bin_width"
        transform="rotate(90)"
        dominant-baseline="middle"
        text-anchor="start"
      >
        bin {{ bin + 1 }}
      </text>
      <path fill="none" stroke="#000" :d="yaxis_path"></path>
      <path fill="none" stroke="#000" :d="yaxis_path_ratio"></path>
      <text
        v-for="(tick_label, tick_index) in y_ticks"
        :key="tick_label"
        x="90"
        :y="total_stacked_plot_offset + y_tick_positions[tick_index]"
        dominant-baseline="middle"
        text-anchor="end"
      >
        {{ tick_label }}
      </text>
      <text x="95" y="35" dominant-baseline="middle" text-anchor="end">
        <tspan dy="-0px">x10</tspan>
        <tspan dy="-8px">{{ number_of_zeroes(maximum) }}</tspan>
      </text>
      <text
        v-for="(tick_label, tick_index) in y_ticks_ratio"
        :key="tick_label"
        x="90"
        :y="total_ratio_offset + y_tick_positions_ratio[tick_index]"
        dominant-baseline="middle"
        text-anchor="end"
      >
        {{ tick_label }}
      </text>
      <YAxisLabel :x="-185" :y="50">Number of events per bin</YAxisLabel>
      <YAxisLabel :x="-410" :y="50">Data/Pred.</YAxisLabel>
      <!-- legend, data needs a separate entry -->
      <DataPoint
        :x="bin_width * number_of_bins + 115 + 10"
        :nominal="400 - workspace_store.number_of_processes * 25 - 75"
        :uncertainty="10"
      />
      <text
        :x="bin_width * number_of_bins + 145"
        :y="400 - workspace_store.number_of_processes * 25 - 70"
      >
        data
      </text>
      <LegendEntry
        v-for="(process, process_index) in workspace_store.process_names"
        :key="process"
        :size="20"
        :color="workspace_store.colors[process]"
        :x="bin_width * number_of_bins + 115"
        :y="
          400 -
          workspace_store.number_of_processes * 25 +
          25 * process_index -
          50
        "
        :isnothighlighted="!ishighlighted(process_index)"
        :title="workspace_store.process_titles[process]"
        @mouseover="highlight(process_index)"
        @mouseleave="unhighlight"
      />
    </svg>
    <DownloadHelper
      :svg_id="name + workspace_store.name + channel.name"
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
