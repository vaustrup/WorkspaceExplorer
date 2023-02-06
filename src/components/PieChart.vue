<script setup lang="ts">
import { reactive, computed } from 'vue';
import type { IStackedProcess } from '../interfaces';
import { useWorkspaceStore } from '../stores/workspace';
import DownloadHelper from './DownloadHelper.vue';

const props = defineProps<{
  id: number;
  channel_index: number;
}>();

const workspace_store = useWorkspaceStore(props.id)();

function pie_chart_path(process: IStackedProcess): string {
  return describe_arc(
    radius,
    radius,
    radius,
    process.low * 3.6,
    process.high * 3.6
  );
}

function describe_arc(
  x: number,
  y: number,
  r: number,
  start_angle: number,
  end_angle: number
): string {
  const start = polar_to_cartesian(x, y, r, end_angle);
  const end = polar_to_cartesian(x, y, r, start_angle);
  const large_arc_flag = end_angle - start_angle <= 180 ? '0' : '1';
  const d = [
    'M',
    r,
    r,
    'L',
    start.x,
    start.y,
    'A',
    r,
    r,
    0,
    large_arc_flag,
    0,
    end.x,
    end.y,
  ].join(' ');
  return d;
}

function polar_to_cartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angle_in_degrees: number
) {
  const angle_in_radians = ((angle_in_degrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angle_in_radians),
    y: centerY + radius * Math.sin(angle_in_radians),
  };
}

// plotting style
const radius = 100;

// highlight processes on mouseover
const state = reactive({ highlighted_process_index: -999 });

function highlight(index: number): void {
  state.highlighted_process_index = index;
}

function unhighlight(): void {
  state.highlighted_process_index = -999;
}

// the height of the plot should be at least the diameter of the pie chart
// but it also has to be large enough to contain all legend entries
const height = computed(() => {
  return Math.max(
    2 * radius,
    25 * workspace_store.normalized_stacked_data[0].processes.length
  );
});
</script>

<template>
  <div class="piechart">
    <h3
      :style="
        'width: ' +
        3 * radius +
        'px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; display: inline-block;'
      "
      :title="
        workspace_store.channel_titles[
          workspace_store.channel_names[channel_index]
        ]
      "
    >
      {{
        workspace_store.channel_titles[
          workspace_store.channel_names[channel_index]
        ]
      }}
    </h3>
    <svg
      :width="4 * radius"
      :height="height"
      :id="
        'svg_piechart' +
        workspace_store.name +
        workspace_store.channel_names[channel_index]
      "
    >
      <path
        v-for="(process, process_index) in workspace_store
          .normalized_stacked_data[channel_index].processes"
        :key="process.name"
        :d="pie_chart_path(process)"
        :fill="workspace_store.colors[process.name]"
        :class="{
          isnothighlighted: !(
            state.highlighted_process_index === -999 ||
            process_index === state.highlighted_process_index
          ),
        }"
        @mouseover="highlight(process_index)"
        @mouseleave="unhighlight"
      />
      <template
        v-for="(process, process_index) in workspace_store
          .normalized_stacked_data[0].processes"
        :key="process.name"
      >
        <rect
          height="20"
          width="20"
          :fill="workspace_store.colors[process.name]"
          :x="2 * radius + 50"
          :y="25 * process_index"
          :id="process.name"
          :class="{
            isnothighlighted: !(
              state.highlighted_process_index === -999 ||
              process_index === state.highlighted_process_index
            ),
          }"
          @mouseover="highlight(process_index)"
          @mouseleave="unhighlight"
        />
        <text
          :x="2 * radius + 80"
          :y="15 + 25 * process_index"
          :id="process.name"
          :class="{
            isnothighlighted: !(
              state.highlighted_process_index === -999 ||
              process_index === state.highlighted_process_index
            ),
          }"
          @mouseover="highlight(process_index)"
          @mouseleave="unhighlight"
        >
          {{
            workspace_store.process_titles[process.name].substring(0, 10) +
            (workspace_store.process_titles[process.name].length > 10
              ? '...'
              : '')
          }}
          <title>
            {{ workspace_store.process_titles[process.name] }}
          </title>
        </text>
      </template>
    </svg>
    <DownloadHelper
      :svg_id="
        'piechart' +
        workspace_store.name +
        workspace_store.channel_names[channel_index]
      "
      :id="id"
    />
  </div>
</template>

<style scoped>
rect.isnothighlighted {
  fill-opacity: 0.5;
  transition: fill-opacity 0.5s ease;
}

path.isnothighlighted {
  fill-opacity: 0.5;
  transition: fill-opacity 0.5s ease;
}

text.isnothighlighted {
  fill: grey;
  transition: fill 0.5s ease;
}

h3 {
  font-size: 1.2em;
}
</style>
