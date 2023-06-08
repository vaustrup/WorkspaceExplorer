<script setup lang="ts">
import { computed, ref } from 'vue';
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

const modifier_filter = ref('');
const current = ref(1);
const syst_plots_per_page = 5;

const modifiers_to_display = computed(() => {
  // get type of modifier in any region and for any sample
  // (it does not matter which because in this step we only
  // want to filter out lumi, staterror, normfactor)
  const types =
    workspace_store.channels[0].modifier_types[
      workspace_store.channels[0].samples[0].name
    ];
  const systematic_variations = workspace_store.modifier_names.filter(
    (item) =>
      !(
        types[item] === 'lumi' ||
        types[item] === 'staterror' ||
        types[item] === 'normfactor'
      )
  );
  // afterwards, filter by name
  return systematic_variations.filter((item) =>
    item.includes(modifier_filter.value)
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
        <q-expansion-item
          switch-toggle-side
          label="Systematic Uncertainty Chart"
        >
          <div class="row">
            <q-input
              filled
              bottom-slots
              label="Filter by name"
              type="text"
              v-model="modifier_filter"
              hide-bottom-space
              style="margin-right: 1em"
            ></q-input>
            <q-pagination
              v-model="current"
              :max="
                Math.floor(modifiers_to_display.length / syst_plots_per_page) +
                1
              "
              input
              size="xl"
            />
          </div>
          <div
            class="column"
            v-for="modifier_name in modifiers_to_display.slice(
              (current - 1) * syst_plots_per_page,
              current * syst_plots_per_page
            )"
            :key="modifier_name"
          >
            <h3 style="text-align: center">{{ modifier_name }}</h3>
            <HorizontalScrollArea height="550">
              <div
                class="row"
                v-for="(channel, channel_index) in workspace_store.channels"
                :key="channel.name"
              >
                <SystematicChart
                  :id="id"
                  :channel_index="channel_index"
                  :modifier_name="modifier_name"
                />
              </div>
            </HorizontalScrollArea>
          </div>
          <div class="row">
            <q-input
              filled
              bottom-slots
              label="Filter by name"
              type="text"
              v-model="modifier_filter"
              hide-bottom-space
              style="margin-right: 1em"
            ></q-input>
            <q-pagination
              v-model="current"
              :max="Math.floor(modifiers_to_display.length / 10) + 1"
              input
              size="xl"
            />
          </div>
        </q-expansion-item>
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

h3 {
  font-size: 1.8em;
}
</style>
