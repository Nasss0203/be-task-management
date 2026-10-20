import { historyToReorder } from './migration-safety';

const row = (id: number, timestamp: string) => ({
  id,
  timestamp,
  name: `M${timestamp}`,
});

describe('historyToReorder', () => {
  it('returns nothing for an ordered history', () => {
    expect(historyToReorder([row(1, '100'), row(2, '200')])).toEqual([]);
  });

  it('sorts the tail starting at the first row newer than a later one', () => {
    const rows = [row(1, '100'), row(2, '300'), row(3, '400'), row(4, '200')];
    expect(historyToReorder(rows).map((item) => item.timestamp)).toEqual([
      '200',
      '300',
      '400',
    ]);
  });
});
