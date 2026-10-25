/**
 * M1b: finds names of real Pages inside the user's sentence, so a bare,
 * unaccented or over-extended title still reaches a candidate list.
 *
 * Pure text matching against titles the caller already loaded; it never
 * guesses an ID and never authorizes. A title only counts when it sits right
 * next to a Page noun ("trang X", "page X", "X page"), so content words such
 * as "checklist" are not mistaken for targets.
 */

export interface TitledPage {
  id: string;
  title: string;
}

interface Span {
  title: string;
  start: number;
  end: number;
}

/** Lowercase, accent-free, punctuation-free text with single spaces. */
export function normalizeForTitleMatch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function anchoredSpans(sentence: string, title: string): Span[] {
  const name = escapeRegExp(title);
  // "trang X" / "page X" (optionally "tên" / "named"), or English "X page".
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
}

/** IDs of every Page whose title is the longest anchored name at its position. */
export function findPageTitlesInSentence(
  instruction: string,
  pages: readonly TitledPage[],
): string[] {
  const sentence = normalizeForTitleMatch(instruction);
  const byTitle = new Map<string, string[]>();
  for (const page of pages) {
    const title = normalizeForTitleMatch(page.title);
    if (!title) continue;
    byTitle.set(title, [...(byTitle.get(title) ?? []), page.id]);
  }

  const spans = [...byTitle.keys()]
    .flatMap((title) => anchoredSpans(sentence, title))
    .sort((a, b) => b.end - b.start - (a.end - a.start));
  // "trang sub man" names "sub man", not also "sub" or "man".
  const accepted: Span[] = [];
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
