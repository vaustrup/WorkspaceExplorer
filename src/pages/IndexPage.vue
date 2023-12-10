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
import { check_workspaces_on_HEPdata, load_workspaces_from_HEPdata } from 'src/core/hepdata';
import { onMounted } from 'vue';

const route = useRoute();

onMounted(async () => {
  if (route.query.id) {
    const analyses = await check_workspaces_on_HEPdata(
      route.query.id as string
    );
    load_workspaces_from_HEPdata(analyses);
  }
});
</script>
