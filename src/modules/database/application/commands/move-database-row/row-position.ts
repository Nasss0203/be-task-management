const MIN_GAP = 1e-6;

export interface RowSlot {
  id: string;
  position: number;
}

export type RowMove =
  | { kind: 'single'; position: number }
  | { kind: 'renumber'; positions: RowSlot[] };

export function planRowMove(
  orderedRows: readonly RowSlot[],
  movingRowId: string,
  previousRowId: string | null,
  nextRowId: string | null,
): RowMove {
  const others = orderedRows.filter((row) => row.id !== movingRowId);
  const previous = others.find((row) => row.id === previousRowId) ?? null;
  const next = others.find((row) => row.id === nextRowId) ?? null;

  if (!previous && !next) {
    const last = others.at(-1);
    return { kind: 'single', position: last ? last.position + 1 : 1 };
  }

  if (!previous) {
    return { kind: 'single', position: next!.position - 1 };
  }

  if (!next) {
    return { kind: 'single', position: previous.position + 1 };
  }

  if (next.position - previous.position > MIN_GAP) {
    return {
      kind: 'single',
      position: (previous.position + next.position) / 2,
    };
  }

  const insertAt = others.indexOf(previous) + 1;
  const ordered = [
    ...others.slice(0, insertAt),
    { id: movingRowId, position: 0 },
    ...others.slice(insertAt),
  ];

  return {
    kind: 'renumber',
    positions: ordered.map((row, index) => ({ id: row.id, position: index + 1 })),
  };
}
