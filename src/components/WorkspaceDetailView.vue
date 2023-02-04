<script setup lang="ts">
import { computed } from 'vue';
import NormalizedBarChart from './NormalizedBarChart.vue';
import PieChart from './PieChart.vue';
import StackedChart from './StackedChart.vue';
import ModifierStructureChart from './ModifierStructureChart.vue';
import HorizontalScrollArea from './HorizontalScrollArea.vue';
import ProcessListItem from './ProcessListItem.vue';
import ChannelListItem from './ChannelListItem.vue';
import NormFactorListItem from './NormFactorListItem.vue';
import { useWorkspaceStore } from '../stores/workspace';

const props = defineProps<{
  id: number;
}>();

const workspace_store = useWorkspaceStore(props.id)();

// the height of the plot should be at least the diameter of the pie chart
// but it also has to be large enough to contain all legend entries
const height = computed(() => {
  return String(
    Math.max(
      2 * 100,
      25 * workspace_store.normalized_stacked_data[0].processes.length
    ) + 150
  );
});
</script>

<template>
  <q-card flat bordered style="padding: 1em, width: calc(100vw-2em);">
    <q-card-section>
      <h2>{{ workspace_store.name }}</h2>
    </q-card-section>
    <q-separator inset></q-separator>
    <!-- extra if condition needed to ensure data is not accessed before it is actually available in the store -->
    <div v-if="workspace_store.workspace.channels !== undefined" class="column">
      <q-expansion-item switch-toggle-side default-opened label="Summary">
        <div class="row justify-around">
          <div class="col-3">
            <h3 class="list-title">Processes</h3>
            <q-list
              bordered
              separator
              style="margin-top: 1em; margin-bottom: 1em"
            >
              <ProcessListItem
                v-for="process_name in workspace_store.process_names"
                :key="process_name.toString"
                :id="id"
                :process_name="process_name"
              />
            </q-list>
          </div>
          <div class="col-3">
            <h3 class="list-title">Regions</h3>
            <q-list
              bordered
              separator
              style="margin-top: 1em; margin-bottom: 1em"
            >
              <ChannelListItem
                v-for="channel_name in workspace_store.channel_names"
                :key="channel_name.toString"
                :id="id"
                :channel_name="channel_name"
              />
            </q-list>
          </div>
          <div class="col-3">
            <h3 class="list-title">Normalisation Factors</h3>
            <q-list
              bordered
              separator
              style="margin-top: 1em; margin-bottom: 1em"
            >
              <NormFactorListItem
                v-for="normfactor in workspace_store.normfactors"
                :key="normfactor.name"
                :id="id"
                :normfactor="normfactor"
              />
            </q-list>
          </div>
        </div>
      </q-expansion-item>
      <q-separator inset></q-separator>
      <div class="column">
        <q-expansion-item switch-toggle-side label="Normalized Bar Chart">
          <NormalizedBarChart
            :id="id"
            style="margin-top: 1em; margin-bottom: 1em"
          />
        </q-expansion-item>
        <q-separator inset></q-separator>
        <q-expansion-item switch-toggle-side label="Pie Charts">
          <HorizontalScrollArea :height="height">
            <PieChart
              v-for="(
                channel, channel_index
              ) in workspace_store.normalized_stacked_data"
              :key="channel.name"
              :id="id"
              :channel_index="channel_index"
            />
          </HorizontalScrollArea>
        </q-expansion-item>
        <q-separator inset></q-separator>
        <q-expansion-item switch-toggle-side label="Data-MC Comparisons">
          <HorizontalScrollArea height="550">
            <StackedChart
              v-for="(
                channel, channel_index
              ) in workspace_store.stacked_data_per_bin"
              :key="channel.name"
              :id="id"
              :channel_index="channel_index"
            />
          </HorizontalScrollArea>
        </q-expansion-item>
        <q-separator inset></q-separator>
        <q-expansion-item switch-toggle-side label="Modifier Structure Chart">
          <ModifierStructureChart
            :id="id"
            style="width: 100%; margin-top: 1em; margin-bottom: 1em"
          />
        </q-expansion-item>
      </div>
    </div>
  </q-card>
</template>

<style scoped>
.list-title {
  font-size: 2em;
}

h2 {
  font-size: 2.5em;
}
</style>
