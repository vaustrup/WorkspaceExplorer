<template>
  <q-page
    class="column items-center justify-start"
    style="width: 100vw; padding: 1em"
  >
    <q-card flat bordered style="width: 100%">
      <q-card-section>
        <workspace-loader class="row" />
      </q-card-section>
      <q-separator inset></q-separator>
      <q-card-section>
        <workspace-list class="column" />
      </q-card-section>
    </q-card>

    <workspace-overview-list />
  </q-page>
</template>

<script setup lang="ts">
import WorkspaceLoader from 'components/WorkspaceLoader.vue';
import WorkspaceList from 'components/WorkspaceList.vue';
import WorkspaceOverviewList from 'components/WorkspaceOverviewList.vue';
import { useRoute } from 'vue-router';
import { useStoreIDStore } from 'src/stores/storeid';
import { onMounted } from 'vue';

const store_id_store = useStoreIDStore();
const route = useRoute();

onMounted(async () => {
  if (route.query.id) {
    const analyses = await store_id_store.check_workspaces_on_HEPdata(
      route.query.id as string
    );
    store_id_store.load_workspaces_from_HEPdata(analyses);
  }
});
</script>
