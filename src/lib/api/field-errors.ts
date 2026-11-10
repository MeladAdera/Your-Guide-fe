/**
 * Splits the API's field errors (`{ "values.0.note": "maxLength" }`, the same
 * paths the forms use) into those the screen can show under a field and the
 * rest. Any error left over means the screen also needs its form-level alert,
 * or the person would press Save and see nothing happen.
 */
export function placeFieldErrors(errors: Record<string, string>, shows: (field: string) => boolean) {
  const entries = Object.entries(errors);
  const placed = entries.filter(([field]) => shows(field));
  return { placed, allPlaced: placed.length > 0 && placed.length === entries.length };
}
