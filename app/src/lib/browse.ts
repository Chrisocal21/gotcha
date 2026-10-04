// The order of cards the collection is currently showing (after filter and sort),
// so the card view can step to the previous and next card in that same order.
let order: string[] = [];

export const setBrowseOrder = (ids: string[]) => {
  order = ids;
};

export function position(id: string, fallback: string[]): { index: number; total: number } {
  const list = order.includes(id) ? order : fallback;
  return { index: list.indexOf(id), total: list.length };
}

export function neighbors(id: string, fallback: string[]): { prev: string | null; next: string | null } {
  const list = order.includes(id) ? order : fallback;
  const i = list.indexOf(id);
  return { prev: i > 0 ? list[i - 1] : null, next: i >= 0 && i < list.length - 1 ? list[i + 1] : null };
}
