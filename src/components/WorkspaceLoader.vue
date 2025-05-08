<script setup lang="ts">
import { ref, computed } from 'vue';
import { useStoreIDStore } from 'src/stores/storeid';
import { Notify, QFile, QPopupProxy } from 'quasar';
import { check_workspaces_on_HEPdata, load_workspaces_from_HEPdata } from 'src/core/hepdata';
import type { IAnalysis, IAnalysisOption } from 'src/interfaces';

const storeid_store = useStoreIDStore();

const hepdata_id = ref('');
const analyses = ref<IAnalysis[]>([]);
let analyses_to_load = [] as IAnalysisOption[];
const files = ref();
const button_is_disabled = computed(() => {
  return hepdata_id.value === '';
});

const file_input = ref<InstanceType<typeof QFile>>();

// we need the ref to the popup proxy element in order to be able
// to toggle it once the workspaces are loaded
const popup = ref<InstanceType<typeof QPopupProxy>>();

function on_rejected(): void {
  Notify.create({
    message: 'Only workspaces in JSON format are allowed.',
    color: 'negative',
    icon: 'report_problem',
    position: 'top',
  });
}

function get_file(): void {
  file_input.value?.pickFiles();
}

async function on_click(): Promise<void> {
  analyses.value = await check_workspaces_on_HEPdata(
    hepdata_id.value
  );
  analyses_to_load = analyses.value.map((analysis) => {
    return { label: analysis.name, value: analysis };
  });
  popup.value?.show();
}

async function load_workspaces(): Promise<void> {
  load_workspaces_from_HEPdata(analyses.value);
  popup.value?.hide();
  hepdata_id.value = '';
}

async function on_example_click(): Promise<void> {
  const url =
    'https://raw.githubusercontent.com/vaustrup/WorkspaceExplorer/main/tests/example_workspace.json';
  storeid_store.load_workspace_from_url(url, 'Example');
}
</script>

<template>
  <div id="workspaceloader">
    <!-- not sure how to style the qfile element like a button
            -> use an actual button instead to trigger invisible, zero-size qfile element -->
    <q-file
      multiple
      accept=".json"
      ref="file_input"
      @rejected="on_rejected"
      v-model="files"
      @update:model-value="
        storeid_store.load_workspaces_from_local_files(files)
      "
      style="visibility: hidden; width: 0; height: 0"
    >
    </q-file>
    <q-btn
      icon="cloud_upload"
      @click="get_file"
      label="Read local file"
    ></q-btn>
    <span style="margin: 1em">or</span>
    <div class="row">
      <q-input
        filled
        bottom-slots
        label="INSPIRE ID of HEPData record"
        type="text"
        v-model="hepdata_id"
        title="To load all available workspaces from a given HEPData record, enter the corresponding INSPIRE ID. The ID can be read from the URL as 'https://www.hepdata.net/record/ins<INSPIREID>'."
        :input-style="{width:'220px'}"
        hide-bottom-space
        style="margin-right: 1em"
      />
      <q-btn :disabled="button_is_disabled" @click="on_click()"
        >Read from HEPdata
        <q-popup-proxy ref="popup">
          <q-page-container style="padding: 10px">
            <q-skeleton v-if="storeid_store.checking" height="6em"></q-skeleton>
            <q-option-group
              v-else
              v-model="analyses"
              :options="analyses_to_load"
              type="checkbox"
            ></q-option-group>
            <q-btn @click="load_workspaces()">Load Selected Workspaces</q-btn>
          </q-page-container>
        </q-popup-proxy>
      </q-btn>
    </div>
    <span style="margin: 1em">or</span>
    <q-btn @click="on_example_click()"> Try an example </q-btn>
  </div>
</template>

<style>
#workspaceloader {
  padding: 2em;
  justify-content: center;
}
</style>
