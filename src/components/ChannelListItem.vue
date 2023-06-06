<script setup lang="ts">
import { useWorkspaceStore } from 'src/stores/workspace';
import { QPopupEdit } from 'quasar';
import { ref, reactive, nextTick } from 'vue';

const props = defineProps<{
  id: number;
  channel_id: number;
}>();

const workspace_store = useWorkspaceStore(props.id)();

const popup = ref<InstanceType<typeof QPopupEdit>>();

const state = reactive({ popup_disabled: true });

// when clicking the edit button, the popup element is enabled
// we then wait for the next tick for the information to propagate
// afterwards we can actually show the popup
async function edit_process_title(): Promise<void> {
  enable_popup();
  await nextTick();
  popup.value?.show();
}
function disable_popup(): void {
  state.popup_disabled = true;
}
function enable_popup(): void {
  state.popup_disabled = false;
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
          :disable="state.popup_disabled"
          ref="popup"
          v-model="workspace_store.channels[channel_id]._title"
          auto-save
          v-slot="scope"
          @hide="
            disable_popup();
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
