import { ref } from 'vue';

export default function useHighlighted() {
  const highlighted_index = ref(-999);

  function highlight(index: number): void {
    highlighted_index.value = index;
  }

  function unhighlight(): void {
    highlighted_index.value = -999;
  }

  function ishighlighted(index: number): boolean {
    return (
      highlighted_index.value === -999 || index === highlighted_index.value
    );
  }

  return {
    highlight,
    unhighlight,
    ishighlighted,
    highlighted_index,
  };
}
