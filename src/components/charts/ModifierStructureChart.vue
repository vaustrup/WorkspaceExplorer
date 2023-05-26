<script setup lang="ts">
import { computed, reactive } from 'vue';
import { useWorkspaceStore } from 'src/stores/workspace';
import DownloadHelper from 'src/components/DownloadHelper.vue';
import { shorten_string } from 'src/utils/strings';

const props = defineProps<{
  id: number;
}>();

const workspace_store = useWorkspaceStore(props.id)();

// define color scheme
const colors: { [key: string]: string } = {
  lumi: 'rgb(85,85,85)', // dark gray
  staterror: 'rgb(230,159,0)', // orange
  normsys: 'rgb(86,180,233)', // sky blue
  histosys: 'rgb(240,228,66)', // yellow
  shapesys: 'rgb(204,121,167)', // reddish purple
  normhisto: 'rgb(0,158,115)', // blueish green
  normfactor: 'rgb(213,94,0)', // vermilion
  none: 'rgb(255,255,255)', // white
};

const modifier_type_strings: { [key: string]: string } = {
  lumi: 'luminosity', // dark gray
  staterror: 'staterror', // orange
  normsys: 'normsys', // sky blue
  histosys: 'histosys', // yellow
  shapesys: 'shapesys', // reddish purple
  normhisto: 'normsys+histosys', // blueish green
  normfactor: 'normfactor', // vermilion
  none: 'none', // white
};

const modifier_type_names: string[] = Object.keys(colors);

// plot style
const half_size = 10;
const size = 2 * half_size;
const padding = 40;

const plot_height = computed(() => {
  let height =
    (workspace_store.workspace.channels.length - 1) * padding +
    legend_height.value;
  for (const channel of workspace_store.workspace.channels) {
    height += channel.samples.length * size;
  }
  return height;
});

const label_offset = 10;

function label_length(strings: string[]): number {
  const pixels_per_character = 8;
  return Math.max(...strings.map((el) => el.length)) * pixels_per_character;
}

const xlabel_length = computed(() => {
  return label_length(workspace_store.modifier_names);
});

const ylabel_length = computed(() => {
  return label_length(workspace_store.process_names);
});

const legend_height = computed(() => {
  return size + padding;
});

// pre-compute positions of rects
const x_pos = computed(() => {
  // return list of x-positions for the modifiers
  return workspace_store.modifier_names.map(
    (_, index) => index * size + ylabel_length.value + label_offset
  );
});

const y_pos = computed(() => {
  const positions: number[][] = [];
  let channel_offset = 0;
  for (const channel of workspace_store.workspace.channels) {
    const position_per_sample = channel.samples.map(
      (_, index) => index * size + channel_offset + legend_height.value
    );
    positions.push(position_per_sample);
    channel_offset += channel.samples.length * size + padding;
  }
  return positions;
});

// make interactive
const state = reactive({
  highlight_mode: false,
  channel_index: -999,
  sample_index: -999,
  modifier_index: -999,
});

const highlighted_channel = computed(() => {
  return workspace_store.workspace.channels[state.channel_index];
});

const highlighted_sample = computed(() => {
  return highlighted_channel.value.samples[state.sample_index];
});

const highlighted_modifier = computed(() => {
  return workspace_store.modifier_names[state.modifier_index];
});

const highlighted_modifier_types = computed(() => {
  return workspace_store.modifier_types[highlighted_channel.value.name][
    highlighted_sample.value.name
  ];
});

const highlighted_modifier_type = computed(() => {
  return highlighted_modifier_types.value[highlighted_modifier.value];
});

function turn_on(): void {
  state.highlight_mode = true;
}

function turn_off(): void {
  state.highlight_mode = false;
  state.channel_index = -999;
  state.sample_index = -999;
  state.modifier_index = -999;
}

function highlight(
  channel_index: number,
  sample_index: number,
  modifier_index: number
): void {
  state.channel_index = channel_index;
  state.sample_index = sample_index;
  state.modifier_index = modifier_index;
}

const width = computed(() => {
  return Math.max(
    workspace_store.modifier_names.length * size,
    modifier_type_names.length * 175 + ylabel_length.value + label_offset
  );
});
</script>

<template>
  <div>
    <q-scroll-area
      :style="
        'height: ' +
        (plot_height + xlabel_length + label_offset + 10) +
        'px; max-width: calc(100vw-2em);'
      "
    >
      <div id="modifierstructure">
        <svg
          :width="width"
          :height="plot_height + xlabel_length + label_offset"
          :id="'svg_modifierstructure' + workspace_store.name"
        >
          <!-- legend -->
          <!-- to avoid unnecessary rerendering, the structure is duplicated: once in case the mouse is over the chart area and once when it is outside -->
          <!-- highlight mode is turned is turned on when the mouse enters the area of the chart -->
          <template v-if="!state.highlight_mode">
            <template
              v-for="(
                modifier_type_name, modifier_type_index
              ) in modifier_type_names"
              :key="modifier_type_name"
            >
              <template v-if="modifier_type_name !== 'none'">
                <rect
                  :fill="colors[modifier_type_name]"
                  :height="size"
                  :width="size"
                  :x="modifier_type_index * 200 + ylabel_length + label_offset"
                  y="0"
                />
                <text
                  :x="
                    modifier_type_index * 200 +
                    size +
                    ylabel_length +
                    2 * label_offset
                  "
                  :y="half_size"
                  dominant-baseline="middle"
                  text-anchor="begin"
                >
                  {{ modifier_type_strings[modifier_type_name] }}
                </text>
              </template>
            </template>
          </template>
          <template v-else>
            <template
              v-for="(
                modifier_type_name, modifier_type_index
              ) in modifier_type_names"
              :key="modifier_type_name"
            >
              <template v-if="modifier_type_name !== 'none'">
                <template v-if="state.channel_index !== -999">
                  <rect
                    :fill="colors[modifier_type_name]"
                    :height="size"
                    :width="size"
                    :x="
                      modifier_type_index * 200 + ylabel_length + label_offset
                    "
                    y="0"
                    :class="{
                      isnothighlighted:
                        highlighted_modifier_type !== modifier_type_name,
                    }"
                  />
                  <text
                    :x="
                      modifier_type_index * 200 +
                      size +
                      ylabel_length +
                      2 * label_offset
                    "
                    :y="half_size"
                    dominant-baseline="middle"
                    text-anchor="begin"
                    :class="{
                      isnothighlighted:
                        highlighted_modifier_type !== modifier_type_name,
                    }"
                  >
                    {{ modifier_type_strings[modifier_type_name] }}
                  </text>
                </template>
              </template>
            </template>
          </template>

          <g @mouseover="turn_on" @mouseleave="turn_off">
            <!-- the first rect covers the whole area of the plot and is necessary to avoid rerendering everything when the mouse is on whitespace between rects -->
            <rect
              opacity="0"
              x="0"
              :y="legend_height - label_offset"
              :height="plot_height"
              :width="width"
            />
            <!-- channel names are shown in 1.5em -->
            <template
              v-for="(channel, channel_index) in workspace_store.workspace
                .channels"
              :key="channel.name"
            >
              <text
                x="0"
                :y="y_pos[channel_index][0] - 0.5 * padding"
                font-size="1.5em"
                dominant-baseline="middle"
                :class="{
                  isnothighlighted:
                    state.channel_index !== channel_index &&
                    state.highlight_mode,
                }"
              >
                {{ workspace_store.channel_titles[channel.name] }}
              </text>
            </template>
            <!-- to avoid unnecessary rerendering, the structure is duplicated: once in case the mouse is over the chart area and once when it is outside -->
            <!-- highlight mode is turned is turned on when the mouse enters the area of the chart -->
            <template v-if="!state.highlight_mode">
              <template
                v-for="(channel, channel_index) in workspace_store.workspace
                  .channels"
                :key="channel.name"
              >
                <template
                  v-for="(sample, sample_index) in channel.samples"
                  :key="sample.name"
                >
                  <rect
                    v-for="(
                      modifier_name, modifier_index
                    ) in workspace_store.modifier_names"
                    :key="modifier_name"
                    :width="size"
                    :height="size"
                    :x="x_pos[modifier_index]"
                    :y="y_pos[channel_index][sample_index]"
                    :fill="
                      colors[
                        workspace_store.modifier_types[channel.name][
                          sample.name
                        ][modifier_name]
                      ]
                    "
                  />
                  <text
                    :x="ylabel_length"
                    :y="y_pos[channel_index][sample_index] + half_size"
                    dominant-baseline="middle"
                    text-anchor="end"
                  >
                    {{
                      shorten_string(
                        workspace_store.process_titles[sample.name],
                        18
                      )
                    }}
                  </text>
                </template>
              </template>
            </template>
            <template v-else>
              <template
                v-for="(channel, channel_index) in workspace_store.workspace
                  .channels"
                :key="channel.name"
              >
                <template
                  v-for="(sample, sample_index) in channel.samples"
                  :key="sample.name"
                >
                  <rect
                    v-for="(
                      modifier_name, modifier_index
                    ) in workspace_store.modifier_names"
                    :key="modifier_name"
                    :width="size"
                    :height="size"
                    :x="x_pos[modifier_index]"
                    :y="y_pos[channel_index][sample_index]"
                    :fill="
                      colors[
                        workspace_store.modifier_types[channel.name][
                          sample.name
                        ][modifier_name]
                      ]
                    "
                    fill-opacity="0.3"
                    @mouseenter="
                      highlight(channel_index, sample_index, modifier_index)
                    "
                  />
                  <text
                    :x="ylabel_length"
                    :y="y_pos[channel_index][sample_index] + half_size"
                    dominant-baseline="middle"
                    text-anchor="end"
                    :class="{
                      isnothighlighted:
                        (state.sample_index !== sample_index ||
                          state.channel_index !== channel_index) &&
                        state.highlight_mode,
                    }"
                  >
                    {{
                      shorten_string(
                        workspace_store.process_titles[sample.name],
                        18
                      )
                    }}
                    <title>
                      {{ workspace_store.process_titles[sample.name] }}
                    </title>
                  </text>
                </template>
              </template>
            </template>
            <!-- highlight rects corresponding to modifiers for the same sample and channel as the one the mouse is over -->
            <template v-if="state.channel_index !== -999">
              <rect
                v-for="(
                  modifier_name, modifier_index
                ) in workspace_store.modifier_names"
                :key="modifier_name"
                :width="size"
                :height="size"
                :x="x_pos[modifier_index]"
                :y="y_pos[state.channel_index][state.sample_index]"
                :fill="colors[highlighted_modifier_types[modifier_name]]"
                fill-opacity="0.5"
                @mouseenter="
                  highlight(
                    state.channel_index,
                    state.sample_index,
                    modifier_index
                  )
                "
              />
              <!-- highlight rects corresponding to samples with the same modifier as the one the mouse is over -->
              <template
                v-for="(channel, channel_index) in workspace_store.workspace
                  .channels"
                :key="channel.name"
              >
                <rect
                  v-for="(sample, sample_index) in channel.samples"
                  :key="sample.name"
                  :width="size"
                  :height="size"
                  :x="x_pos[state.modifier_index]"
                  :y="y_pos[channel_index][sample_index]"
                  :fill="
                    colors[
                      workspace_store.modifier_types[channel.name][
                        channel.samples[sample_index].name
                      ][highlighted_modifier]
                    ]
                  "
                  fill-opacity="0.5"
                  @mouseenter="
                    highlight(channel_index, sample_index, state.modifier_index)
                  "
                />
              </template>
              <!-- highlight the rect the mouse hovers above -->
              <rect
                :width="size"
                :height="size"
                :x="x_pos[state.modifier_index]"
                :y="y_pos[state.channel_index][state.sample_index]"
                stroke="black"
                :fill="colors[highlighted_modifier_type]"
              >
                <title>
                  {{
                    'Channel: ' +
                    highlighted_channel.name +
                    '\nSample: ' +
                    workspace_store.process_titles[highlighted_sample.name] +
                    '\nModifier: ' +
                    highlighted_modifier +
                    '\nType: ' +
                    modifier_type_strings[highlighted_modifier_type]
                  }}
                </title>
              </rect>
            </template>
          </g>
          <!-- names of the modifiers as x-axis labels -->
          <text
            v-for="(
              modifier_name, modifier_index
            ) in workspace_store.modifier_names"
            :key="modifier_name"
            :x="-plot_height - label_offset"
            :y="x_pos[modifier_index] + half_size"
            transform="rotate(-90)"
            dominant-baseline="middle"
            text-anchor="end"
            :class="{
              isnothighlighted:
                state.modifier_index !== modifier_index && state.highlight_mode,
            }"
          >
            {{ modifier_name }}
          </text>
        </svg>
      </div>
    </q-scroll-area>
    <DownloadHelper
      :svg_id="'modifierstructure' + workspace_store.name"
      :id="id"
    />
  </div>
</template>

<style scoped>
text.isnothighlighted {
  fill: grey;
}
rect.isnothighlighted {
  fill-opacity: 0.5;
}
</style>
