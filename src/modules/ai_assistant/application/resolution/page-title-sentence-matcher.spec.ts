import {
  findPageTitlesInSentence,
  normalizeForTitleMatch,
} from './page-title-sentence-matcher';

describe('findPageTitlesInSentence (M1b)', () => {
  const pages = [
    { id: 'sub-man', title: 'sub man' },
    { id: 'sub', title: 'sub' },
    { id: 'man', title: 'man' },
    { id: 'meeting', title: 'Hội họp tuần' },
    { id: 'release', title: 'Release 2.0' },
    { id: 'checklist', title: 'checklist' },
    { id: 'test-a', title: 'Test' },
    { id: 'test-b', title: 'test' },
    { id: 'blank', title: '   ' },
  ];
  const ids = (instruction: string) =>
    findPageTitlesInSentence(instruction, pages).sort();

  it('normalizes case, accents, đ and punctuation', () => {
    expect(normalizeForTitleMatch('  Đổi   TRANG "Hội họp tuần"! ')).toBe(
      'doi trang hoi hop tuan',
    );
    // Precomposed and combining-mark input normalize identically.
    expect(normalizeForTitleMatch('Kiểm thử')).toBe(
      normalizeForTitleMatch('Kiểm thử'),
    );
  });

  it.each([
    ['thêm checklist vào trang sub man', ['sub-man']],
    ['thêm checklist vào trang sub man cho buổi họp', ['sub-man']],
    ['Trong trang sub man thêm bảng chi phí', ['sub-man']],
    ['thêm checklist vào trang "sub man', ['sub-man']],
    ['thêm checklist vào trang hoi hop tuan', ['meeting']],
    ['add a QA checklist to sub man page', ['sub-man']],
    ['add a QA checklist to the Release 2.0 page', ['release']],
    ['thêm ghi chú vào trang tên Release 2.0', ['release']],
    ['thêm checklist vào trang sub', ['sub']],
    ['thêm checklist vào trang Test', ['test-a', 'test-b']],
  ])('%s', (instruction, expected) => {
    expect(ids(instruction)).toEqual([...expected].sort());
  });

  it.each([
    // A content word is never a target unless it sits next to trang/page.
    'thêm checklist vào trang Q4',
    'thêm checklist',
    // Whole words only.
    'thêm checklist vào trang submarine',
    'thêm checklist vào trang Không tồn tại',
  ])('finds nothing for %s', (instruction) => {
    expect(ids(instruction)).toEqual([]);
  });
});
