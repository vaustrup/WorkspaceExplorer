// utility to shorten a string to a maximum length and appending ellipses if string exceeds maximum length
export function shorten_string(string: string, max_length: number): string {
  return (
    string.substring(0, max_length) + (string.length > max_length ? '...' : '')
  );
}
