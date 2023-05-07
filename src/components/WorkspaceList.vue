<script setup lang="ts">
import WorkspaceListItem from 'src/components/WorkspaceListItem.vue';
import { useStoreIDStore } from 'src/stores/storeid';

const storeid_store = useStoreIDStore();
</script>

<template>
  <div id="workspacelist">
    <p v-if="storeid_store.ids.length > 0">
      The following workspaces are ready to explore:
    </p>
    <p v-else>Add a workspace to start exploring!</p>
    <q-list bordered separator>
      <WorkspaceListItem
        v-for="id in storeid_store.ids"
        :key="'workspacelistitem' + id.toString()"
        :id="id"
      />
    </q-list>
  </div>
</template>

<style>
#workspacelist {
  align-items: center;
}
</style>
