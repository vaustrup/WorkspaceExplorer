<script setup lang="ts">
import { computed } from 'vue';
import { useWorkspaceStore } from 'src/stores/workspace';
import DownloadHelper from 'src/components/DownloadHelper.vue';
import useHighlighted from 'src/composables/useHighlighted';
import { linear_scale, axis_path } from 'src/utils/plots';
import LegendEntry from 'src/components/charts/LegendEntry.vue';
import YAxisLabel from 'src/components/charts/YAxisLabel.vue';

const { highlight, unhighlight, ishighlighted } = useHighlighted();

const props = defineProps<{
  id: number;
  channel_index: number;
}>();

const workspace_store = useWorkspaceStore(props.id)();

const channel = workspace_store.workspace.channels[props.channel_index];
const channel_name = workspace_store.channel_names[props.channel_index];
const channel_stacked_data =
  workspace_store.stacked_data_per_bin[props.channel_index];

const number_of_bins = channel.samples[0].data.length;

const bins = Array.from({ length: number_of_bins }, (e, i) => i);

const maximum = computed(() => {
  let max = 0;
  for (let i_bin = 0; i_bin < channel_stacked_data.content.length; i_bin++) {
    const high_value =
      channel_stacked_data.content[i_bin][
        workspace_store.process_names.length - 1
      ].high;
    if (max < high_value) {
      max = high_value;
    }
    const data_value = channel_stacked_data.data[i_bin];
    if (max < data_value) {
      max = data_value;
    }
  }
  return max;
});

const yscale = linear_scale(0, maximum.value, 0, 300);

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
  let tick_positions = [];
  for (const tick of y_ticks.value) {
    tick_positions.push(-(300 / max) * tick);
  }
  return tick_positions;
});

const yaxis_path = axis_path(100, 350, 40, y_tick_positions.value, false, true);
</script>

<template>
  <div class="stackedchart">
    <h3
      :style="
        'width: ' +
        (200 + bin_width * number_of_bins) +
        'px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; display: inline-block;'
      "
      :title="workspace_store.channel_titles[channel_name]"
    >
      {{ workspace_store.channel_titles[channel_name] }}
    </h3>
    <svg
      height="400"
      :width="bin_width * number_of_bins + 300"
      :id="'svg_stackedchart' + workspace_store.name + channel_name"
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
              yscale * channel_stacked_data.content[bin][process_index].high
            "
            :height="
              yscale *
              (channel_stacked_data.content[bin][process_index].high -
                channel_stacked_data.content[bin][process_index].low)
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
          :cy="350 - yscale * channel_stacked_data.data[bin]"
          r="5"
        />
        <line
          :x1="bin_width * (bin + 0.5) + 100"
          :y1="
            350 -
            yscale *
              (channel_stacked_data.data[bin] -
                channel_stacked_data.data[bin] ** 0.5)
          "
          :x2="bin_width * (bin + 0.5) + 100"
          :y2="
            350 -
            yscale *
              (channel_stacked_data.data[bin] +
                channel_stacked_data.data[bin] ** 0.5)
          "
          stroke="black"
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
      <!-- legend, data needs a separate entry -->
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
      <LegendEntry
        v-for="(process, process_index) in workspace_store
          .normalized_stacked_data[0].processes"
        :key="process.name"
        :size="20"
        :color="workspace_store.colors[process.name]"
        :x="bin_width * number_of_bins + 115"
        :y="
          400 -
          workspace_store.number_of_processes * 25 +
          25 * process_index -
          50
        "
        :isnothighlighted="!ishighlighted(process_index)"
        :title="workspace_store.process_titles[process.name]"
        @mouseover="highlight(process_index)"
        @mouseleave="unhighlight"
      />
    </svg>
    <DownloadHelper
      :svg_id="'stackedchart' + workspace_store.name + channel_name"
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
