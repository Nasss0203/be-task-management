import {
  SIMILAR_TITLE_THRESHOLD,
  titleSimilarity,
} from './page-title-similarity';

describe('titleSimilarity (M3)', () => {
  it('matches pg_trgm similarity()', () => {
    // From the PostgreSQL pg_trgm documentation: similarity('word', 'two words').
    expect(titleSimilarity('word', 'two words')).toBeCloseTo(0.363636, 5);
    expect(titleSimilarity('Release 2.0', 'release 2.0')).toBe(1);
  });

  it.each([
    ['relese 2', 'Release 2.0'],
    ['realease 2.0', 'Release 2.0'],
    ['release2', 'Release 2.0'],
    ['Release 2', 'Release 2.0'],
    ['sub mn', 'sub man'],
    ['Hoi hp tuan', 'Hội họp tuần'],
  ])('suggests %s → %s', (typed, title) => {
    expect(titleSimilarity(typed, title)).toBeGreaterThanOrEqual(
      SIMILAR_TITLE_THRESHOLD,
    );
  });

  it.each([
    ['xyz abc', 'Release 2.0'],
    ['xyz abc', 'sub man'],
    ['Kế hoạch', 'Release 2.0'],
  ])('does not suggest %s → %s', (typed, title) => {
    expect(titleSimilarity(typed, title)).toBeLessThan(SIMILAR_TITLE_THRESHOLD);
  });

  it('ignores marks, case and punctuation', () => {
    expect(titleSimilarity('HỘI HỌP TUẦN!', 'hoi hop tuan')).toBe(1);
    expect(titleSimilarity('', 'sub man')).toBe(0);
  });
});
