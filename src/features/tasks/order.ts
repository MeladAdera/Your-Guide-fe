/** The list with item `index` moved one place up (-1) or down (+1); the same list when it cannot move. */
export function moveBy<T>(items: readonly T[], index: number, delta: -1 | 1): T[] {
  const to = index + delta;
  if (index < 0 || index >= items.length || to < 0 || to >= items.length) return [...items];
  const out = [...items];
  [out[index], out[to]] = [out[to], out[index]];
  return out;
}
