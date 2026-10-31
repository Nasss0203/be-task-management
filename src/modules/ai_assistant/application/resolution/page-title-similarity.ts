/**
 * M3 (kế hoạch tên gần đúng, C1/C3): how close a typed Page name is to a real
 * title, computed like PostgreSQL's pg_trgm `similarity()` so the comparison
 * can move into SQL later without changing what is suggested.
 */
import { normalizeForTitleMatch } from './page-title-sentence-matcher';

/** plan-v2 §6 M3: below this a title is not suggested at all. */
export const SIMILAR_TITLE_THRESHOLD = 0.3;

interface TitleTrigrams {
  spaced: Set<number>;
  /** "release2" and "release 2" are one name typed with or without a space. */
  compact: Set<number>;
}

// Titles rarely change between questions; scoring 5,000 of them would
// otherwise normalize and split every title again on each Ask.
const MAX_CACHED_TITLES = 20_000;
const cache = new Map<string, TitleTrigrams>();

/** pg_trgm: each word padded with two spaces before and one after. */
function trigrams(text: string): Set<number> {
  const result = new Set<number>();
  for (const word of text.split(' ')) {
    if (!word) continue;
    const padded = `  ${word} `;
    for (let index = 0; index + 3 <= padded.length; index++) {
      result.add(
        (padded.charCodeAt(index) * 65_536 + padded.charCodeAt(index + 1)) *
          65_536 +
          padded.charCodeAt(index + 2),
      );
    }
  }
  return result;
}

function titleTrigrams(title: string): TitleTrigrams {
  const cached = cache.get(title);
  if (cached) return cached;
  // Marks, case and punctuation are ignored.
  const normalized = normalizeForTitleMatch(title);
  const result = {
    spaced: trigrams(normalized),
    compact: trigrams(normalized.replace(/ /g, '')),
  };
  if (cache.size >= MAX_CACHED_TITLES) cache.clear();
  cache.set(title, result);
  return result;
}

function overlap(left: Set<number>, right: Set<number>): number {
  if (left.size === 0 || right.size === 0) return 0;
  let shared = 0;
  for (const trigram of left) if (right.has(trigram)) shared++;
  return shared / (left.size + right.size - shared);
}

/** Scores titles against one typed name; the name is prepared once. */
export function similarTitleScorer(typed: string): (title: string) => number {
  const name = titleTrigrams(typed);
  return (title) => {
    const other = titleTrigrams(title);
    return Math.max(
      overlap(name.spaced, other.spaced),
      overlap(name.compact, other.compact),
    );
  };
}

export function titleSimilarity(typed: string, title: string): number {
  return similarTitleScorer(typed)(title);
}
