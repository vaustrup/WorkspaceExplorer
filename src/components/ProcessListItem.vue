<script setup lang="ts">
import { useWorkspaceStore } from 'src/stores/workspace';
import { QPopupEdit } from 'quasar';
import { ref } from 'vue';
import { color_scheme } from 'src/utils/colors';

const props = defineProps<{
  id: number;
  process_name: string;
}>();

const workspace_store = useWorkspaceStore(props.id)();

const popup = ref<InstanceType<typeof QPopupEdit>>();

async function edit_process_title(): Promise<void> {
  popup.value?.show();
}

const color = ref(workspace_store.colors[props.process_name]);

function edit_process_color(): void {
  workspace_store.process_color_index[props.process_name] = color.value;
}

async function update_download_buttons(): Promise<void> {
  workspace_store.update_all_svg_urls();
}
</script>

<template>
  <q-item>
    <q-item-section :title="workspace_store.process_titles[process_name]">
      <q-item-label lines="1">
        {{ workspace_store.process_titles[process_name] }}
        <q-popup-edit
          ref="popup"
          v-model="workspace_store.process_title_index[process_name]"
          auto-save
          v-slot="scope"
          @hide="
            update_download_buttons();
          "
        >
          <q-input
            v-model="scope.value"
            dense
            autofocus
            @keyup.enter="scope.set"
          ></q-input>
        </q-popup-edit>
      </q-item-label>
    </q-item-section>
    <q-item-section side top>
      <q-btn @click="edit_process_title()" icon="edit" />
    </q-item-section>
    <q-item-section side top>
      <q-btn
        @click="edit_process_color()"
        icon="o_color_lens"
        :style="'color: white; background-color: ' + color"
      >
        <q-popup-proxy @before-hide="update_download_buttons()">
          <q-color
            v-model="color"
            @update:model-value="edit_process_color()"
            no-header-tabs
            default-view="palette"
            :palette="color_scheme"
            format-model="rgb"
          ></q-color>
        </q-popup-proxy>
      </q-btn>
    </q-item-section>
  </q-item>
</template>
