<script setup lang="ts">
import { onMounted } from 'vue';
import { useWorkspaceStore } from 'src/stores/workspace';
const props = defineProps<{
  svg_id: string;
  id: number;
}>();

const workspace_store = useWorkspaceStore(props.id)();

// we should set the url only once the component is created,
// as otherwise the button will be created first and the plot will be empty
onMounted(() => {
  workspace_store.set_svg_url(props.svg_id);
});
</script>

<template>
  <q-btn
    :href="workspace_store.download_urls[props.svg_id]"
    :download="svg_id + '.svg'"
    target="_blank"
    style="margin-left: 10px"
  >
    Download
  </q-btn>
</template>
