export function linear_scale(
  input_min: number,
  input_max: number,
  target_min: number,
  target_max: number
): number {
  return (target_max - target_min) / (input_max - input_min) + target_min;
}
