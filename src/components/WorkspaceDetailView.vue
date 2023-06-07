<script setup lang="ts">
import { computed } from 'vue';
import NormalizedBarChart from 'src/components/charts/NormalizedBarChart.vue';
import PieChart from 'src/components/charts/PieChart.vue';
import StackedChart from 'src/components/charts/StackedChart.vue';
import ModifierStructureChart from 'src/components/charts/ModifierStructureChart.vue';
import PullChart from 'src/components/charts/PullChart.vue';
import HorizontalScrollArea from 'src/components/HorizontalScrollArea.vue';
import ProcessListItem from 'src/components/ProcessListItem.vue';
import ChannelListItem from 'src/components/ChannelListItem.vue';
import NormFactorListItem from 'src/components/NormFactorListItem.vue';
import { useWorkspaceStore } from 'src/stores/workspace';
import CorrelationChart from 'src/components/charts/CorrelationChart.vue';
import SystematicChart from 'src/components/charts/SystematicChart.vue';

const props = defineProps<{
  id: number;
}>();

const workspace_store = useWorkspaceStore(props.id)();

// the height of the plot should be at least the diameter of the pie chart
// but it also has to be large enough to contain all legend entries
const height = computed(() => {
  return String(
    Math.max(2 * 100, 25 * workspace_store.number_of_processes) + 150
  );
});
</script>

<template>
  <q-card flat bordered style="padding: 1em, width: calc(100vw-2em);">
    <q-card-section>
      <q-skeleton v-if="workspace_store.loading" height="4em"></q-skeleton>
      <h2 v-else>{{ workspace_store.name }}</h2>
    </q-card-section>
    <q-separator inset></q-separator>
    <!-- extra if condition needed to ensure data is not accessed before it is actually available in the store -->
    <q-skeleton v-if="workspace_store.loading" height="12em"></q-skeleton>
    <div
      v-else-if="workspace_store.workspace.channels !== undefined"
      class="column"
    >
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
                v-for="(channel, channel_id) in workspace_store.channels"
                :key="channel.name"
                :id="id"
                :channel_id="channel_id"
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
              v-for="(channel, channel_index) in workspace_store.channels"
              :key="channel.name"
              :id="id"
              :channel_index="channel_index"
            />
          </HorizontalScrollArea>
        </q-expansion-item>
        <q-separator inset></q-separator>
        <q-expansion-item switch-toggle-side label="Data-MC Comparisons">
          <HorizontalScrollArea height="650">
            <StackedChart
              v-for="(channel, channel_index) in workspace_store.channels"
              :key="channel.name"
              :id="id"
              :channel_index="channel_index"
              :postfit="false"
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
        <q-separator inset></q-separator>
        <!-- <q-expansion-item
          switch-toggle-side
          label="Systematic Uncertainty Chart"
        >
          <div
            class="column"
            v-for="(
              modifier_name, modifier_index
            ) in workspace_store.modifier_names"
            :key="modifier_name"
          >
            <h3>{{ modifier_name }}</h3>
            <div class="row">
              <SystematicChart
                v-for="(channel, channel_index) in workspace_store.channels"
                :key="channel.name"
                :id="id"
                :channel_index="channel_index"
                :modifier_index="modifier_index"
              />
            </div>
          </div>
        </q-expansion-item> -->
        <q-separator inset></q-separator>
        <q-expansion-item switch-toggle-side label="Fit Results">
          <q-btn
            @click="workspace_store.get_fit_results()"
            :loading="workspace_store.fitting"
            :disable="workspace_store.fitting"
            >{{
              workspace_store.fitted ? 'Reset to fit results' : 'Fit Workspace'
            }}</q-btn
          >
          <div v-if="workspace_store.fitted" class="row justify-around">
            <PullChart :id="id" />
            <div>
              <StackedChart
                v-for="(channel, channel_index) in workspace_store.channels"
                :key="channel.name"
                :id="id"
                :channel_index="channel_index"
                :postfit="true"
              />
            </div>
            <CorrelationChart :id="id" />
          </div>
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
