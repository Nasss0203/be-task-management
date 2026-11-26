import { BadRequestException } from '@nestjs/common';
import { PageBlockType } from 'src/shared/domain/page-block-type.enum';
import {
  assertValidLayoutStyle,
  canContain,
} from './page-block-container.policy';

const { COLUMN, COLUMN_LIST, FORM_FIELD, SECTION, TEXT, TOGGLE } =
  PageBlockType;

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
    [null, SECTION, true],
    [TOGGLE, SECTION, true],
    [COLUMN, SECTION, true],
    [SECTION, TEXT, true],
    [SECTION, TOGGLE, true],
    [SECTION, COLUMN_LIST, true],
    [SECTION, SECTION, false],
    [SECTION, COLUMN, false],
    [COLUMN_LIST, SECTION, false],
    [SECTION, FORM_FIELD, true],
    [null, FORM_FIELD, false],
    [TOGGLE, FORM_FIELD, false],
    [COLUMN, FORM_FIELD, false],
    [FORM_FIELD, TEXT, false],
  ])('%s holds %s: %s', (parent, child, allowed) => {
    expect(canContain(parent, child)).toBe(allowed);
  });

  it('keeps a column width between 10% and 90%', () => {
    expect(() =>
      assertValidLayoutStyle(COLUMN, { width_ratio: 0.5 }),
    ).not.toThrow();
    expect(() => assertValidLayoutStyle(COLUMN, {})).not.toThrow();
    for (const ratio of [0.05, 0.95, '0.5', Number.NaN]) {
      expect(() =>
        assertValidLayoutStyle(COLUMN, { width_ratio: ratio }),
      ).toThrow(BadRequestException);
    }
    // Other blocks keep their free-form style_config.
    expect(() =>
      assertValidLayoutStyle(TEXT, { width_ratio: 5 }),
    ).not.toThrow();
  });

  it('only takes a callout tone for a section', () => {
    for (const tone of ['default', 'info', 'success', 'warning', 'danger']) {
      expect(() => assertValidLayoutStyle(SECTION, { tone })).not.toThrow();
    }
    expect(() => assertValidLayoutStyle(SECTION, {})).not.toThrow();
    for (const tone of ['purple', '', 3]) {
      expect(() => assertValidLayoutStyle(SECTION, { tone })).toThrow(
        BadRequestException,
      );
    }
  });

  it('checks the display settings of an embed', () => {
    expect(() =>
      assertValidLayoutStyle(PageBlockType.EMBED, {
        width: 50,
        align: 'center',
        aspect: 'custom',
        height: 600,
      }),
    ).not.toThrow();
    expect(() => assertValidLayoutStyle(PageBlockType.EMBED, {})).not.toThrow();
    for (const style of [
      { width: 33 },
      { width: '50' },
      { align: 'right' },
      { aspect: '21:9' },
      { height: 5000 },
      { height: 100 },
      { height: 300.5 },
    ]) {
      expect(() => assertValidLayoutStyle(PageBlockType.EMBED, style)).toThrow(
        BadRequestException,
      );
    }
  });
});
