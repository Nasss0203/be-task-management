import { planRowMove } from './row-position';

const rows = (...positions: number[]) =>
  positions.map((position, index) => ({ id: `r${index + 1}`, position }));

describe('planRowMove', () => {
  it('places a row halfway between its new neighbours', () => {
    expect(planRowMove(rows(1, 2, 3), 'r3', 'r1', 'r2')).toEqual({
      kind: 'single',
      position: 1.5,
    });
  });

  it('places a row before the first or after the last neighbour', () => {
    expect(planRowMove(rows(1, 2, 3), 'r3', null, 'r1')).toEqual({ kind: 'single', position: 0 });
    expect(planRowMove(rows(1, 2, 3), 'r1', 'r3', null)).toEqual({ kind: 'single', position: 4 });
  });

  it('moves to the end of the database when no neighbour is given', () => {
    expect(planRowMove(rows(1, 7), 'r1', null, null)).toEqual({ kind: 'single', position: 8 });
  });

  it('renumbers every row when neighbours share a position, as legacy rows do', () => {
    expect(planRowMove(rows(0, 0, 0), 'r3', 'r1', 'r2')).toEqual({
      kind: 'renumber',
      positions: [
        { id: 'r1', position: 1 },
        { id: 'r3', position: 2 },
        { id: 'r2', position: 3 },
      ],
    });
  });
});
