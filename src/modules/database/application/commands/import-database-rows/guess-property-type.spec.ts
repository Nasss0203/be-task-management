import { PropertyType } from '../../../domain/enums/property-type.enum';
import { guessPropertyType } from './guess-property-type';

describe('guessPropertyType', () => {
  it.each([
    [['1', '2.5', '', "'-3"], PropertyType.NUMBER],
    [['TRUE', 'false', 'x', 'No'], PropertyType.CHECKBOX],
    [
      ['2026-11-22', '22/11/2026 09:00', '2026-11-01 → 2026-11-03'],
      PropertyType.DATE,
    ],
    [['https://a.dev', 'http://b.dev/x'], PropertyType.URL],
    [['lan@test.dev', 'hoa@test.dev'], PropertyType.EMAIL],
    [['Todo', 'Done', 'todo', 'Done'], PropertyType.SELECT],
    [['Viết API', 'Thiết kế', 'Họp'], PropertyType.TEXT],
    [['', '  '], PropertyType.TEXT],
    [['2026-13-01', '2026-11-22'], PropertyType.TEXT],
  ])('guesses %j as %s', (cells, type) => {
    expect(guessPropertyType(cells)).toBe(type);
  });

  it('keeps a column with exactly 20 repeated values as SELECT and 21 as TEXT', () => {
    const values = (count: number) =>
      Array.from({ length: count * 2 }, (_, index) => `v${index % count}`);

    expect(guessPropertyType(values(20))).toBe(PropertyType.SELECT);
    expect(guessPropertyType(values(21))).toBe(PropertyType.TEXT);
  });
});
