/**
 * M1b: finds names of real Pages inside the user's sentence, so a bare,
 * unaccented or over-extended title still reaches a candidate list.
 *
 * Pure text matching against titles the caller already loaded; it never
 * guesses an ID and never authorizes. A title only counts when it sits right
 * next to a Page noun ("trang X", "page X", "X page"), so content words such
 * as "checklist" are not mistaken for targets.
 *
 * M1: titles are looked up by the word runs next to each Page noun, so the
 * cost follows the sentence, not the number of Pages in the workspace.
 */

export interface TitledPage {
  id: string;
  title: string;
}

interface Span {
  title: string;
  /** Word positions in the sentence: [start, end). */
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

const PAGE_NOUNS = new Set(['trang', 'page']);
// "trang tên X", "page named X": an optional word before the name.
const NAME_MARKERS = [['co', 'ten'], ['ten'], ['named'], ['called']];

/** Every known title in a word run next to a Page noun. */
function anchoredSpans(
  words: readonly string[],
  titles: ReadonlySet<string>,
  maxWords: number,
): Span[] {
  const spans: Span[] = [];
  const add = (start: number, end: number) => {
    const title = words.slice(start, end).join(' ');
    if (titles.has(title)) spans.push({ title, start, end });
  };
  words.forEach((word, index) => {
    if (!PAGE_NOUNS.has(word)) return;
    // "trang X" / "page X", optionally "trang tên X" / "page named X".
    const starts = [index + 1];
    for (const marker of NAME_MARKERS) {
      if (marker.every((part, offset) => words[index + 1 + offset] === part)) {
        starts.push(index + 1 + marker.length);
      }
    }
    for (const start of starts) {
      for (
        let end = start + 1;
        end <= Math.min(words.length, start + maxWords);
        end++
      )
        add(start, end);
    }
    // English "X page".
    if (word === 'page') {
      for (let start = Math.max(0, index - maxWords); start < index; start++)
        add(start, index);
    }
  });
  return spans;
}

/** Lowercase text with single spaces; marks are kept. */
function normalizeKeepingMarks(text: string): string {
  return text.normalize('NFC').toLowerCase().replace(/\s+/gu, ' ').trim();
}

/**
 * The sentence's only Page noun is followed by exactly this title, marks
 * included, up to the end of the sentence ("… trong trang sub man", "… on
 * sub man page"). That is as explicit as a quoted title, so no choice is asked.
 */
export function endsWithExactPageTitle(
  instruction: string,
  title: string,
): boolean {
  const name = normalizeKeepingMarks(title);
  const sentence = normalizeKeepingMarks(instruction)
    .replace(/(?:[\s,]+(?:nhé|nha|ạ|please))*[\s.!?]*$/u, '')
    .trim();
  if (
    !name ||
    (sentence.match(/(?<![\p{L}\p{N}])(?:trang|page)(?![\p{L}\p{N}])/gu) ?? [])
      .length !== 1
  ) {
    return false;
  }
  return new RegExp(
    `(?:^| )(?:(?:trang|page)(?: (?:có tên|tên|named|called))? ${escapeRegExp(name)}|(?:in|on|to) ${escapeRegExp(name)} page)$`,
    'u',
  ).test(sentence);
}

/** IDs of every Page whose title is the longest anchored name at its position. */
export function findPageTitlesInSentence(
  instruction: string,
  pages: readonly TitledPage[],
): string[] {
  const sentence = normalizeForTitleMatch(instruction);
  const words = sentence ? sentence.split(' ') : [];
  const byTitle = new Map<string, string[]>();
  let maxWords = 0;
  for (const page of pages) {
    const title = normalizeForTitleMatch(page.title);
    if (!title) continue;
    byTitle.set(title, [...(byTitle.get(title) ?? []), page.id]);
    maxWords = Math.max(maxWords, title.split(' ').length);
  }
  const order = new Map(
    [...byTitle.keys()].map((title, index) => [title, index]),
  );

  // Longest title first; equal lengths keep the Pages' order.
  const spans = anchoredSpans(words, new Set(byTitle.keys()), maxWords).sort(
    (a, b) =>
      b.title.length - a.title.length ||
      order.get(a.title)! - order.get(b.title)! ||
      a.start - b.start,
  );
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
