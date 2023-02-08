<script setup lang="ts">
import { ref, computed } from 'vue';
import { useStoreIDStore } from '../stores/storeid';
import { Notify, QFile } from 'quasar';

const storeid_store = useStoreIDStore();

const hepdata_id = ref('');
const files = ref();
const button_is_disabled = computed(() => {
  return hepdata_id.value === '';
});

const file_input = ref<InstanceType<typeof QFile>>();

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
  await storeid_store.load_workspaces_from_HEPdata(hepdata_id.value);
  hepdata_id.value = '';
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
        label="Enter HEPdata ID"
        type="text"
        v-model="hepdata_id"
        hide-bottom-space
        style="margin-right: 1em"
      />
      <q-btn :disabled="button_is_disabled" @click="on_click()"
        >Read from HEPdata</q-btn
      >
    </div>
  </div>
</template>

<style>
#workspaceloader {
  padding: 2em;
  justify-content: center;
}
</style>
