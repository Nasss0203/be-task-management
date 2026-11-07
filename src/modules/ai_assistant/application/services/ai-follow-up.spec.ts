import {
  detectFollowUp,
  resolveFollowUp,
  type PageBlockView,
  type PreviousTurn,
} from './ai-follow-up';

/**
 * Kế hoạch chat nhiều lượt — hiểu câu nhắc lại lượt trước (M5): simulated
 * two-turn conversations. Never a draft on the wrong block; unsure → asked.
 */
const APPLIED_AT = new Date('2026-11-07T10:00:00Z');
const NOW = new Date('2026-11-07T10:00:01Z');
const OLD = new Date('2026-11-01T08:00:00Z');

const page: PageBlockView[] = [
  { id: 'old-1', type: 'TODO', text: 'Gửi email', createdAt: OLD },
  { id: 'new-1', type: 'TODO', text: 'Gọi khách', createdAt: NOW },
  { id: 'new-2', type: 'TODO', text: 'Đặt phòng', createdAt: NOW },
  { id: 'txt-1', type: 'TEXT', text: 'Họp lúc 9h', createdAt: OLD },
];

const insert = (texts: string[], kind = 'TODO') => ({
  type: 'INSERT_BLOCKS',
  blocks: texts.map((text) => ({ type: kind, content: { text } })),
});

const turn = (
  state: PreviousTurn['state'],
  operations: PreviousTurn['operations'],
  instruction = 'thêm to-do Gọi khách vào trang sub man',
): PreviousTurn => ({
  generationId: 'gen-1',
  state,
  instruction,
  summary: 'Thêm 1 to-do',
  operations,
  appliedAt: state === 'APPLIED' ? APPLIED_AT : null,
});

const resolve = (sentence: string, previous: PreviousTurn | null) => {
  const followUp = detectFollowUp(sentence);
  if (!followUp) throw new Error(`not a follow-up: ${sentence}`);
  return resolveFollowUp(followUp, previous, page);
};

describe('detecting a sentence about the previous turn', () => {
  it.each([
    ['xoá nó đi', 'DELETE'],
    ['xoá cái vừa thêm', 'DELETE'],
    ['delete it', 'DELETE'],
    ['sửa cái vừa thêm thành Gọi khách hàng', 'EDIT'],
    ['đổi nó thành Gọi lại khách', 'EDIT'],
    ['tích nó đi', 'TICK'],
    ['đánh dấu xong cái đó', 'TICK'],
    ['bỏ tích nó', 'UNTICK'],
    ['đổi lại như cũ', 'UNDO'],
    ['hoàn tác', 'UNDO'],
    ['thêm 2 việc nữa', 'MORE'],
    ['thêm nữa đi', 'MORE'],
    ['thôi', 'DISCARD'],
    ['Bạn xoá giúp mình cái đó nhé', 'DELETE'],
  ])('%s → %s', (sentence, verb) => {
    expect(detectFollowUp(sentence)?.verb).toBe(verb);
  });

  it.each([
    'xoá to-do Gọi khách',
    'thêm to-do Gọi nó lại sau',
    'sửa Gọi khách thành Gọi lại',
    'xoá trang này',
    'thêm checklist gồm a, b',
    'tích xong Gửi email',
  ])('%s is a sentence of its own', (sentence) => {
    expect(detectFollowUp(sentence)).toBeNull();
  });
});

describe('resolving it from the latest turn', () => {
  const applied = turn('APPLIED', [insert(['Gọi khách'])]);
  const appliedTwo = turn('APPLIED', [insert(['Gọi khách', 'Đặt phòng'])]);

  it('deletes what was just added', () => {
    expect(resolve('xoá nó đi', applied)).toEqual({
      kind: 'SENTENCE',
      instruction: 'xoá "Gọi khách"',
      understood: 'Gọi khách',
    });
    expect(resolve('xoá mấy cái đó', appliedTwo)).toMatchObject({
      instruction: 'xoá "Gọi khách" và "Đặt phòng"',
    });
  });

  it('never picks the older block with the same kind', () => {
    const result = resolve('tích nó đi', applied);
    expect(result).toMatchObject({ instruction: 'tích "Gọi khách"' });
  });

  it('edits the one block just added, asks with several', () => {
    expect(
      resolve('sửa cái vừa thêm thành Gọi khách hàng', applied),
    ).toMatchObject({ instruction: 'sửa "Gọi khách" thành "Gọi khách hàng"' });
    expect(resolve('sửa cái vừa thêm thành X', appliedTwo)).toMatchObject({
      kind: 'ASK',
    });
  });

  it('undoes an insert, an edit and a tick with a draft doing the opposite', () => {
    expect(resolve('đổi lại như cũ', applied)).toMatchObject({
      instruction: 'xoá "Gọi khách"',
    });
    const edited = turn('APPLIED', [
      {
        type: 'SET_BLOCK_TEXT',
        blockId: 'new-1',
        oldText: 'Gọi điện',
        newText: 'Gọi khách',
      },
    ]);
    expect(resolve('hoàn tác', edited)).toMatchObject({
      instruction: 'sửa "Gọi khách" thành "Gọi điện"',
    });
    const ticked = turn('APPLIED', [
      { type: 'SET_TODO_CHECKED', blockId: 'new-1', checked: true },
    ]);
    expect(resolve('đổi lại như cũ', ticked)).toMatchObject({
      instruction: 'bỏ tích "Gọi khách"',
    });
  });

  it('points to Undo for a delete', () => {
    const deleted = turn('APPLIED', [
      { type: 'DELETE_BLOCK', blockId: 'gone', text: 'Cũ' },
    ]);
    expect(resolve('hoàn tác', deleted)).toMatchObject({ kind: 'ASK' });
    expect(resolve('xoá nó đi', deleted)).toMatchObject({ kind: 'ASK' });
  });

  it('asks when the block was changed by hand since', () => {
    const renamed = turn('APPLIED', [insert(['Gọi khách cũ'])]);
    expect(resolve('xoá nó đi', renamed)).toMatchObject({ kind: 'ASK' });
  });

  it('ticks only to-dos', () => {
    const text = turn('APPLIED', [insert(['Họp lúc 9h'], 'TEXT')]);
    expect(resolve('tích nó', text)).toMatchObject({ kind: 'ASK' });
  });

  it('asks what to add instead of inventing items (DM2)', () => {
    expect(resolve('thêm 2 việc nữa', applied)).toMatchObject({
      kind: 'ASK',
      message: expect.stringContaining('Gọi khách'),
    });
  });

  it('asks with no previous turn or a discarded one', () => {
    expect(resolve('xoá nó đi', null)).toMatchObject({ kind: 'ASK' });
    expect(resolve('xoá nó đi', turn('OTHER', []))).toMatchObject({
      kind: 'ASK',
    });
  });
});

describe('a draft not applied yet (DM1)', () => {
  const pending = turn('PENDING', [insert(['Gọi khách'])]);

  it('drops the draft for "xoá nó" / "thôi"', () => {
    expect(resolve('xoá nó đi', pending)).toMatchObject({
      kind: 'DISCARD',
      generationId: 'gen-1',
    });
    expect(resolve('thôi', pending)).toMatchObject({ kind: 'DISCARD' });
  });

  it('drafts again with the new words', () => {
    expect(
      resolve('sửa cái vừa thêm thành Gọi khách hàng', pending),
    ).toMatchObject({
      kind: 'SENTENCE',
      instruction: 'thêm to-do Gọi khách hàng vào trang sub man',
      replaces: 'gen-1',
    });
  });

  it('asks before ticking or undoing what is not on the Page', () => {
    expect(resolve('tích nó đi', pending)).toMatchObject({ kind: 'ASK' });
    expect(resolve('hoàn tác', pending)).toMatchObject({ kind: 'ASK' });
  });
});
