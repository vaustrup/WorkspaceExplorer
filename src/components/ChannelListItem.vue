<script setup lang="ts">
import { useWorkspaceStore } from 'src/stores/workspace';
import { QPopupEdit } from 'quasar';
import { ref } from 'vue';

const props = defineProps<{
  id: number;
  channel_id: number;
}>();

const workspace_store = useWorkspaceStore(props.id)();

const popup = ref<InstanceType<typeof QPopupEdit>>();

async function edit_process_title(): Promise<void> {
  popup.value?.show();
}

async function update_download_buttons(): Promise<void> {
  workspace_store.update_all_svg_urls();
}
</script>

<template>
  <q-item>
    <q-item-section :title="workspace_store.channels[channel_id].title">
      <q-item-label lines="1">
        {{ workspace_store.channels[channel_id].title }}
        <q-popup-edit
          ref="popup"
          v-model="workspace_store.channels[channel_id]._title"
          auto-save
          v-slot="scope"
          @hide="
            update_download_buttons();
          "
        >
          <q-input
            v-model="scope.value"
            dense
            autofocus
            @keyup.enter="scope.set"
          ></q-input>
        </q-popup-edit>
      </q-item-label>
    </q-item-section>
    <q-item-section side top>
      <q-btn @click="edit_process_title()" icon="edit" />
    </q-item-section>
  </q-item>
</template>
