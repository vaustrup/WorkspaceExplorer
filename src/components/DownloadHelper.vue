<script setup lang="ts">
import { onMounted, ref } from 'vue';
const props = defineProps<{
  id: string;
}>();

const svg2img = ref('');

onMounted(() => {
  const svg = document.getElementById('svg_' + props.id);
  if (svg === null) {
    return '';
  }
  const xml = new XMLSerializer().serializeToString(svg);
  const blob = new Blob([xml], { type: 'image/svg+xml' });
  const url = window.URL.createObjectURL(blob);
  svg2img.value = url;
});
</script>

<template>
  <q-btn :href="svg2img" :download="id + '.svg'" target="_blank">
    Download
  </q-btn>
</template>
