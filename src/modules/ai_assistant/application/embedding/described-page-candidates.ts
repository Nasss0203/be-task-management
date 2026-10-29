import type { PageEmbeddingMatch } from './page-embedding-search.service';

// M6 (kế hoạch tìm theo mô tả, G3, G7): on 20 described and 5 unrelated
// sentences the right Page scored 0.45–0.79 (one, 0.449, stays out) and an
// unrelated best Page at most 0.42; on real Pages the right one 0.67–0.72,
// the next 0.34–0.39.
export const DESCRIBED_PAGE_MIN_SCORE = 0.45;
export const DESCRIBED_PAGE_MAX_GAP = 0.15;
export const DESCRIBED_PAGE_LIMIT = 3;
/** Pages read from the search before the cut, so the gap is seen. */
export const DESCRIBED_PAGE_SEARCH_LIMIT = 5;

/**
 * Pages close enough to a description to offer: at most three, each at least
 * DESCRIBED_PAGE_MIN_SCORE and within DESCRIBED_PAGE_MAX_GAP of the best.
 * Matches arrive best first.
 */
export function describedPageMatches(
  matches: readonly PageEmbeddingMatch[],
): PageEmbeddingMatch[] {
  const [best] = matches;
  if (!best || best.score < DESCRIBED_PAGE_MIN_SCORE) return [];
  return matches
    .filter(
      (match) =>
        match.score >= DESCRIBED_PAGE_MIN_SCORE &&
        best.score - match.score <= DESCRIBED_PAGE_MAX_GAP,
    )
    .slice(0, DESCRIBED_PAGE_LIMIT);
}
