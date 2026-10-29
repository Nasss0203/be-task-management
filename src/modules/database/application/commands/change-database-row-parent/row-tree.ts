/** True if making `newParentId` the parent of `rowId` would loop back to `rowId`. */
export function wouldCreateCycle(
  rows: { id: string; parentRowId: string | null }[],
  rowId: string,
  newParentId: string,
): boolean {
  const parentOf = new Map(rows.map((row) => [row.id, row.parentRowId]));
  const seen = new Set<string>();
  let current: string | null = newParentId;

  while (current !== null) {
    if (current === rowId || seen.has(current)) return true;
    seen.add(current);
    current = parentOf.get(current) ?? null;
  }

  return false;
}
