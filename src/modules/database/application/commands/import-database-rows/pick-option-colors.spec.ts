import { OPTION_COLOR_PALETTE } from '../../../domain/constants/option-color-palette.constant';
import { pickOptionColors } from './pick-option-colors';

const [BROWN, ORANGE, YELLOW, GREEN, BLUE, PURPLE] = OPTION_COLOR_PALETTE;

describe('pickOptionColors', () => {
  it('gives each new name the next palette color in file order', () => {
    expect(
      pickOptionColors([], ['Frontend', 'DevOps', 'Backend', 'QA']),
    ).toEqual([BROWN, ORANGE, YELLOW, GREEN]);
  });

  it('keeps the default color of familiar names and skips colors already used', () => {
    expect(
      pickOptionColors(
        [],
        ['Backlog', 'Todo', 'In Progress', 'Review', 'done', 'Testing'],
      ),
    ).toEqual([BROWN, ORANGE, BLUE, YELLOW, GREEN, PURPLE]);
    expect(pickOptionColors([], ['Critical', 'High', 'Medium', 'Low'])).toEqual(
      [BROWN, '#F97316', '#EAB308', '#6B7280'],
    );
  });

  it('skips colors of existing options, ignoring case and empty colors', () => {
    expect(
      pickOptionColors(['#92400e', null, ORANGE], ['Alpha', 'Beta']),
    ).toEqual([YELLOW, GREEN]);
  });

  it('starts over from the first color once all eight are used', () => {
    const names = Array.from({ length: 10 }, (_, index) => `Team ${index}`);

    expect(pickOptionColors([], names)).toEqual([
      ...OPTION_COLOR_PALETTE,
      BROWN,
      ORANGE,
    ]);
  });
});
