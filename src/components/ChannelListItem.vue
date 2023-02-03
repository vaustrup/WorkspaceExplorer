<script setup lang="ts">
import { useWorkspaceStore } from '../stores/workspace';
import { QPopupEdit } from 'quasar';
import { ref, reactive, nextTick } from 'vue';

const props = defineProps<{
  id: number;
  channel_name: string;
}>();

const workspace_store = useWorkspaceStore(props.id)();

const popup = ref<InstanceType<typeof QPopupEdit>>();

const state = reactive({ popup_disabled: true });

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
</script>

<template>
  <q-item>
    <q-item-section :title="workspace_store.channel_titles[channel_name]">
      <q-item-label lines="1">
        {{ workspace_store.channel_titles[channel_name] }}
        <q-popup-edit
          :disable="state.popup_disabled"
          ref="popup"
          v-model="workspace_store.channel_title_index[channel_name]"
          auto-save
          v-slot="scope"
          @hide="disable_popup"
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
