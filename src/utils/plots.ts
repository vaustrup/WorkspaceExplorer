export function linear_scale(
  input_min: number,
  input_max: number,
  target_min: number,
  target_max: number
): number {
  return (target_max - target_min) / (input_max - input_min) + target_min;
}

export function axis_path(
  x_offset: number,
  y_offset: number,
  range: number,
  tick_positions: number[],
  is_horizontal: boolean,
  is_left_or_bottom: boolean
): string {
  const tick_length = 5;
  let path =
    'M' + x_offset + ',' + y_offset + (is_horizontal ? 'H' : 'V') + range;
  for (const position of tick_positions) {
    path +=
      'M' +
      (x_offset + (is_horizontal ? position : 0)) +
      ',' +
      (y_offset + (is_horizontal ? 0 : position));
    path += is_horizontal
      ? 'V' + (y_offset + (is_left_or_bottom ? 1 : -1) * tick_length)
      : 'H' + (x_offset + (is_left_or_bottom ? -1 : 1) * tick_length);
  }
  return path;
}

export function round_to_n_digits(value: number, n: number): number {
  return Math.round(value * 10 ** n) / 10 ** n;
}

export function number_of_zeroes(x: number): number {
  return Math.floor(Math.log10(x));
}
