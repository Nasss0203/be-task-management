import {
  endsWithExactPageTitle,
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

describe('endsWithExactPageTitle: a title explicit enough to skip the choice', () => {
  it.each([
    ['xoá Gửi email và Dịch vụ khách hàng trong trang sub man', 'sub man'],
    ['tích gửi email trong trang Sub Man.', 'sub man'],
    ['xoá Doanh số nhóm B trong trang Hội họp tuần nhé', 'Hội họp tuần'],
    ['thêm checklist gồm a, b vào trang tên Hội họp tuần', 'Hội họp tuần'],
    ['add a QA checklist to Q4 page', 'Q4'],
  ])('%s', (instruction, title) => {
    expect(endsWithExactPageTitle(instruction, title)).toBe(true);
  });

  it.each([
    // Other marks: only a choice may confirm it.
    ['xoá Doanh số nhóm B trong trang hoi hop tuan', 'Hội họp tuần'],
    // More words after the name: "sub man mới" may be another Page.
    ['thêm checklist gồm a vào trang sub man mới', 'sub man'],
    // The name is not right after the Page noun.
    ['xoá sub man trong trang Q4', 'sub man'],
    // Two Page nouns: which one is the target is not certain.
    ['chép gửi email từ trang Q4 sang trang sub man', 'sub man'],
    ['thêm checklist vào trang', 'sub man'],
  ])('not %s', (instruction, title) => {
    expect(endsWithExactPageTitle(instruction, title)).toBe(false);
  });
});

/** The M1b matcher before M1 (one regex per title): the reference for parity. */
function legacyFindPageTitlesInSentence(
  instruction: string,
  pages: readonly { id: string; title: string }[],
): string[] {
  const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const sentence = normalizeForTitleMatch(instruction);
  const byTitle = new Map<string, string[]>();
  for (const page of pages) {
    const title = normalizeForTitleMatch(page.title);
    if (title) byTitle.set(title, [...(byTitle.get(title) ?? []), page.id]);
  }
  const spans = [...byTitle.keys()]
    .flatMap((title) => {
      const name = escape(title);
      const pattern = new RegExp(
        `(?:^| )(?:(?:trang|page)(?: (?:co ten|ten|named|called))? (${name})|(${name}) page)(?= |$)`,
        'g',
      );
      return [...sentence.matchAll(pattern)].map((match) => {
        const start =
          match[1] !== undefined
            ? match.index + match[0].length - title.length
            : match.index + (match[0].startsWith(' ') ? 1 : 0);
        return { title, start, end: start + title.length };
      });
    })
    .sort((a, b) => b.end - b.start - (a.end - a.start));
  const accepted: typeof spans = [];
  for (const span of spans) {
    if (
      !accepted.some((kept) => span.start < kept.end && kept.start < span.end)
    ) {
      accepted.push(span);
    }
  }
  return [...new Set(accepted.map((span) => span.title))].flatMap(
    (title) => byTitle.get(title) ?? [],
  );
}

describe('findPageTitlesInSentence (M1): same answers as the regex matcher', () => {
  const pages = [
    { id: 'sub-man', title: 'sub man' },
    { id: 'sub', title: 'sub' },
    { id: 'man', title: 'man' },
    { id: 'meeting', title: 'Hội họp tuần' },
    { id: 'meeting-2', title: 'Hội họp tuần' },
    { id: 'release', title: 'Release 2.0' },
    { id: 'plan', title: 'Kế hoạch Q4' },
    { id: 'plan-long', title: 'Kế hoạch Q4 phòng kinh doanh' },
    { id: 'named', title: 'tên dự án' },
    { id: 'page-word', title: 'Trang chủ' },
    { id: 'en', title: 'Launch Plan' },
  ];
  it.each([
    'thêm checklist vào trang sub man',
    'thêm checklist vào trang sub man cho buổi họp',
    'Trong trang sub man thêm bảng chi phí',
    'thêm checklist vào trang hoi hop tuan',
    'xoá Gửi email trong trang Hội họp tuần',
    'add a QA checklist to sub man page',
    'add a QA checklist to the Release 2.0 page',
    'thêm ghi chú vào trang tên Release 2.0',
    'thêm ghi chú vào trang có tên Kế hoạch Q4',
    'thêm ghi chú vào trang Kế hoạch Q4 phòng kinh doanh',
    'thêm ghi chú vào trang Kế hoạch Q4 phòng marketing',
    'thêm ghi chú vào trang tên dự án',
    'chép từ trang sub man sang trang Kế hoạch Q4',
    'thêm checklist vào trang Trang chủ',
    'add notes to Launch Plan page and to sub page',
    'page named Launch Plan',
    'thêm checklist',
    'trang',
    '',
  ])('%s', (instruction) => {
    expect(findPageTitlesInSentence(instruction, pages).sort()).toEqual(
      legacyFindPageTitlesInSentence(instruction, pages).sort(),
    );
  });

  it('looks titles up instead of trying each one (5,000 Pages)', () => {
    const many = Array.from({ length: 5000 }, (_, index) => ({
      id: `p${index}`,
      title: `Kế hoạch dự án ${index}`,
    }));
    many.push({ id: 'target', title: 'Hội họp tuần' });
    const started = performance.now();
    expect(
      findPageTitlesInSentence('thêm checklist vào trang hoi hop tuan', many),
    ).toEqual(['target']);
    // Building the lookup table dominates; one regex per title took far longer.
    expect(performance.now() - started).toBeLessThan(200);
  });
});
