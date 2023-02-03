<script setup lang="ts">
import WorkspaceDetailView from './WorkspaceDetailView.vue';
import { useStoreIDStore } from '../stores/storeid';

const storeid_store = useStoreIDStore();
</script>

<template>
  <div style="width: 100%">
    <WorkspaceDetailView
      v-for="id in storeid_store.ids"
      :id="id"
      :key="'workspacedetailview' + id.toString()"
      style="padding: 1em; margin-top: 1em; margin-bottom: 1em"
    />
  </div>
</template>
