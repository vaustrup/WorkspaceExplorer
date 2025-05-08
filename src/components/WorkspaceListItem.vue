<script setup lang="ts">
import { ref } from 'vue';
import { QPopupEdit } from 'quasar';
import { useWorkspaceStore } from 'src/stores/workspace';

const props = defineProps<{ id: number }>();

const workspaceStore = useWorkspaceStore(props.id)();

const popupRef = ref();
function editWorkspaceName(): void {
  popupRef.value?.show();
}
</script>

<template>
  <q-item>
    <q-item-section>
      <div v-if="workspaceStore.loading">
        <q-skeleton type="text" width="75px" />
      </div>
      <div v-else>
        {{ workspaceStore.name }}
        <q-popup-edit
          v-model="workspaceStore.name"
          ref="popupRef"
          auto-save
          v-slot="scope"
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
        :disable="workspaceStore.loading"
        @click="editWorkspaceName()"
        icon="edit"
      />
    </q-item-section>
    <q-item-section side bottom>
      <q-btn
        :disable="workspaceStore.loading"
        @click="workspaceStore.delete_workspace()"
        icon="delete"
      />
    </q-item-section>
  </q-item>
</template>
