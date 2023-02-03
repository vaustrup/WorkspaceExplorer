<script setup lang="ts">
import type { INormFactor } from 'src/interfaces';

// apparently a false positive, as props need to be declared
// in order to access them in the template
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const props = defineProps<{
  id: number;
  normfactor: INormFactor;
}>();
</script>

<template>
  <q-item>
    <q-item-section :title="normfactor.name">
      <q-item-label lines="1">
        {{ normfactor.name }}
      </q-item-label>
      <span v-if="normfactor.fixed">(fixed)</span><span v-else>(floating)</span>
    </q-item-section>
  </q-item>
</template>
