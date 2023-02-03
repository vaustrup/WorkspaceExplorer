<script setup lang="ts">
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const props = defineProps<{
  height: string;
}>();
</script>

<template>
  <div>
    <q-scroll-area
      :style="
        'height: ' +
        height +
        'px; max-width: calc(100vw-2em); width: 100%; margin-top: 1em; margin-bottom: 1em;'
      "
    >
      <div class="row no-wrap justify-around">
        <slot></slot>
      </div>
    </q-scroll-area>
  </div>
</template>
