<script setup lang="ts">
import { computed } from 'vue';
import { useWorkspaceStore } from 'src/stores/workspace';
import DownloadHelper from 'src/components/DownloadHelper.vue';
import useHighlighted from 'src/composables/useHighlighted';
import PieChartEntry from 'src/components/charts/PieChartEntry.vue';
import LegendEntry from 'src/components/charts/LegendEntry.vue';

const { highlight, unhighlight, ishighlighted } = useHighlighted();

const props = defineProps<{
  id: number;
  channel_index: number;
}>();

const workspace_store = useWorkspaceStore(props.id)();

const channel = workspace_store.channels[props.channel_index];

// plotting style
const radius = 100;

// the height of the plot should be at least the diameter of the pie chart
// but it also has to be large enough to contain all legend entries
const height = computed(() => {
  return Math.max(2 * radius, 25 * workspace_store.number_of_processes);
});
</script>

<template>
  <div class="piechart">
    <h3
      :style="
        'width: ' +
        3 * radius +
        'px; overflow: hidden; white-space: nowrap; text-align: center; text-overflow: ellipsis; display: inline-block;'
      "
      :title="channel.title"
    >
      {{ channel.title }}
    </h3>
    <svg
      :width="4 * radius"
      :height="height"
      :id="'svg_piechart' + workspace_store.name + channel.name"
    >
      <PieChartEntry
        v-for="(process, process_index) in channel.normalized_stacked_data
          .processes"
        :key="process.name"
        :process="process"
        :radius="radius"
        :color="workspace_store.colors[process.name]"
        :isnothighlighted="!ishighlighted(process_index)"
        @mouseover="highlight(process_index)"
        @mouseleave="unhighlight"
      />
      <LegendEntry
        v-for="(process, process_index) in channel.normalized_stacked_data
          .processes"
        :key="process.name"
        :size="20"
        :color="workspace_store.colors[process.name]"
        :x="2 * radius + 50"
        :y="25 * process_index"
        :isnothighlighted="!ishighlighted(process_index)"
        :title="workspace_store.process_titles[process.name]"
        @mouseover="highlight(process_index)"
        @mouseleave="unhighlight"
      />
    </svg>
    <DownloadHelper
      :svg_id="'piechart' + workspace_store.name + channel.name"
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
