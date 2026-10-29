import { wouldCreateCycle } from './row-tree';

describe('wouldCreateCycle', () => {
  // a → b → c (c is the deepest sub-task)
  const rows = [
    { id: 'a', parentRowId: null },
    { id: 'b', parentRowId: 'a' },
    { id: 'c', parentRowId: 'b' },
    { id: 'x', parentRowId: null },
  ];

  it('allows a parent outside the row subtree', () => {
    expect(wouldCreateCycle(rows, 'b', 'x')).toBe(false);
    expect(wouldCreateCycle(rows, 'x', 'c')).toBe(false);
  });

  it('rejects the row itself and its descendants', () => {
    expect(wouldCreateCycle(rows, 'a', 'a')).toBe(true);
    expect(wouldCreateCycle(rows, 'a', 'c')).toBe(true);
  });

  it('stops on data that already loops', () => {
    const broken = [
      { id: 'p', parentRowId: 'q' },
      { id: 'q', parentRowId: 'p' },
    ];
    expect(wouldCreateCycle(broken, 'z', 'p')).toBe(true);
  });
});
