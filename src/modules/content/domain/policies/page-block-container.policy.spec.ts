import { BadRequestException } from '@nestjs/common';
import { PageBlockType } from 'src/shared/domain/page-block-type.enum';
import {
  assertValidColumnStyle,
  canContain,
} from './page-block-container.policy';

const { COLUMN, COLUMN_LIST, TEXT, TOGGLE } = PageBlockType;

describe('page block nesting', () => {
  it.each([
    [null, TEXT, true],
    [null, COLUMN_LIST, true],
    [null, COLUMN, false],
    [TOGGLE, TEXT, true],
    [TOGGLE, COLUMN_LIST, true],
    [TOGGLE, COLUMN, false],
    [COLUMN_LIST, COLUMN, true],
    [COLUMN_LIST, TEXT, false],
    [COLUMN, TEXT, true],
    [COLUMN, TOGGLE, true],
    [COLUMN, COLUMN_LIST, false],
    [COLUMN, COLUMN, false],
    [TEXT, TEXT, false],
  ])('%s holds %s: %s', (parent, child, allowed) => {
    expect(canContain(parent, child)).toBe(allowed);
  });

  it('keeps a column width between 10% and 90%', () => {
    expect(() =>
      assertValidColumnStyle(COLUMN, { width_ratio: 0.5 }),
    ).not.toThrow();
    expect(() => assertValidColumnStyle(COLUMN, {})).not.toThrow();
    for (const ratio of [0.05, 0.95, '0.5', Number.NaN]) {
      expect(() =>
        assertValidColumnStyle(COLUMN, { width_ratio: ratio }),
      ).toThrow(BadRequestException);
    }
    // Other blocks keep their free-form style_config.
    expect(() =>
      assertValidColumnStyle(TEXT, { width_ratio: 5 }),
    ).not.toThrow();
  });
});
