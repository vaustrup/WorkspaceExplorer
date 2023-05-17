<script setup lang="ts">
import type { IStackedProcess } from 'src/interfaces';
const props = defineProps<{
  process: IStackedProcess;
  color: string;
  radius: number;
  isnothighlighted: boolean;
}>();

function pie_chart_path(process: IStackedProcess): string {
  return describe_arc(
    props.radius,
    props.radius,
    props.radius,
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
  r: number,
  angle_in_degrees: number
) {
  const angle_in_radians = ((angle_in_degrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + r * Math.cos(angle_in_radians),
    y: centerY + r * Math.sin(angle_in_radians),
  };
}
</script>

<template>
  <path
    :key="process.name"
    :d="pie_chart_path(process)"
    :fill="color"
    :class="{
      isnothighlighted: isnothighlighted,
    }"
  />
</template>
