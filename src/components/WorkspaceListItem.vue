<script setup lang="ts">
import { ref, reactive, nextTick } from 'vue';
import { QPopupEdit } from 'quasar';
import { useWorkspaceStore } from 'src/stores/workspace';

const props = defineProps<{
  id: number;
}>();

const workspace_store = useWorkspaceStore(props.id)();

const popup = ref<InstanceType<typeof QPopupEdit>>();

const state = reactive({ popup_disabled: true });

async function edit_workspace_name(): Promise<void> {
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
    <q-item-section>
      <div v-if="workspace_store.loading">
        <q-skeleton type="text" width="75px"></q-skeleton>
      </div>
      <div v-else>
        {{ workspace_store.name }}
        <q-popup-edit
          :disable="state.popup_disabled"
          ref="popup"
          v-model="workspace_store.name"
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
      </div>
    </q-item-section>
    <q-item-section side top>
      <q-btn
        :disable="workspace_store.loading"
        @click="edit_workspace_name()"
        icon="edit"
      />
    </q-item-section>
    <q-item-section side bottom>
      <q-btn
        :disable="workspace_store.loading"
        @click="workspace_store.delete_workspace()"
        icon="delete"
      />
    </q-item-section>
  </q-item>
</template>
