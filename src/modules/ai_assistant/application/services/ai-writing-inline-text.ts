import { foldInstruction } from './ai-instruction-evidence';
import { vocabularyWords } from './ai-vi-vocabulary-words';

/**
 * The text a writing request works on when it has no ":" or quotes (kế hoạch sửa
 * tính năng viết, V2): "dịch sang tiếng Anh chúc mọi người cuối tuần vui vẻ".
 * After the polite words, the writing verb, filler ("đoạn này", "giúp tôi") and
 * the target language, the words left are the text. Mirrors ai-taskmanly
 * `writing_source.inline_writing_text` (shared `ai-writing-inline-text.cases.json`).
 */
const LEAD = vocabularyWords('lead', 'lead_short', 'let_me');
const ACTIONS = vocabularyWords(
  'write_translate',
  'write_improve',
  'write_shorten',
  'write_expand',
  'write_summarize',
  'write_continue',
);
const PASSAGE = vocabularyWords('write_passage');
const PASSAGE_HEAD = vocabularyWords('write_passage_head');
const PASSAGE_POINTER = vocabularyWords(
  'write_passage_pointer',
  'write_selection',
);
const FILLER = [
  ...vocabularyWords(
    'help_after_verb',
    'write_help_after_verb',
    'write_passage',
    'inline_lead_filler',
  ),
  'this',
  'it',
  'lai',
  'nay',
];
const STYLE_WORDS = vocabularyWords(
  'write_style_improve',
  'write_style_shorten',
  'write_style_expand',
);
const LANGUAGE_BEFORE = vocabularyWords('language_prep', 'language_noun');
const LANGUAGES = [
  'tieng tay ban nha',
  'tieng anh',
  'tieng viet',
  'tieng nhat',
  'tieng han',
  'tieng phap',
  'tieng duc',
  'tieng trung',
  'english',
  'vietnamese',
  'japanese',
  'korean',
  'french',
  'german',
  'chinese',
  'spanish',
];
const TAIL = vocabularyWords('tail', 'trailing_with');
const COMMAND_WORDS = [
  ...vocabularyWords(
    'lead',
    'let_me',
    'help_after_verb',
    'write_help_after_verb',
    'tail',
    'write_passage',
    'write_passage_head',
    'write_passage_pointer',
    'write_selection',
    'write_soft_tail',
    'write_style_improve',
    'write_style_shorten',
    'write_style_expand',
  ),
  ...LANGUAGES,
];
// Translating takes any phrase; for the other actions only a real passage.
const MIN_WORDS: Record<string, number> = { dich: 2, translate: 2 };
const MIN_PASSAGE_WORDS = 8;
const SHORT_PASSAGE_WORDS = 4;

const byLength = (phrases: string[]): string[][] =>
  phrases.map((p) => p.split(' ')).sort((a, b) => b.length - a.length);

function startsWith(folded: string[], at: number, phrases: string[]): number {
  for (const words of byLength(phrases)) {
    if (words.every((word, i) => folded[at + i] === word)) return words.length;
  }
  return 0;
}

function endsWith(folded: string[], end: number, phrases: string[]): number {
  for (const words of byLength(phrases)) {
    const from = end - words.length;
    if (from >= 0 && words.every((word, i) => folded[from + i] === word))
      return words.length;
  }
  return 0;
}

function languageAt(folded: string[], at: number): number {
  const before =
    at < folded.length ? startsWith(folded, at, LANGUAGE_BEFORE) : 0;
  if (!before) return 0;
  const size = startsWith(folded, at + before, LANGUAGES);
  return size ? size + before : 0;
}

function styleAt(folded: string[], at: number): number {
  if (folded[at] !== 'cho') return 0;
  const size = startsWith(folded, at + 1, STYLE_WORDS);
  if (!size) return 0;
  return size + 1 + (folded[at + size + 1] === 'hon' ? 1 : 0);
}

function trim(
  folded: string[],
  from: number,
  to: number,
): { start: number; end: number; styled: boolean } {
  let [start, end, styled] = [from, to, false];
  for (let changed = true; changed; ) {
    changed = false;
    const head =
      startsWith(folded, start, FILLER) ||
      languageAt(folded, start) ||
      styleAt(folded, start);
    if (head) {
      styled = styled || styleAt(folded, start) > 0;
      start += head;
      changed = true;
      continue;
    }
    const tail = endsWith(folded, end, TAIL);
    if (tail && end - tail >= start) {
      end -= tail;
      changed = true;
    }
    for (let back = 2; back < 6; back++) {
      const style = styleAt(folded, end - back) === back;
      if (
        end - back >= start &&
        (languageAt(folded, end - back) === back || style)
      ) {
        styled = styled || style;
        end -= back;
        changed = true;
        break;
      }
    }
  }
  return { start, end, styled };
}

function contentWords(folded: string[], start: number, end: number): number {
  const part = folded.slice(0, end);
  let [count, index] = [0, start];
  while (index < end) {
    const size =
      languageAt(part, index) || startsWith(part, index, COMMAND_WORDS);
    if (size) index += size;
    else [count, index] = [count + 1, index + 1];
  }
  return count;
}

function pointsAtPassage(
  folded: string[],
  start: number,
  end: number,
): boolean {
  for (let index = 0; index < Math.min(end, folded.length); index++) {
    const head = startsWith(folded, index, PASSAGE_HEAD);
    if (
      head &&
      startsWith(folded, index + head, PASSAGE_POINTER) &&
      index + head + 1 > start
    )
      return true;
  }
  return false;
}

function passage(
  words: string[],
  folded: string[],
  start: number,
  end: number,
  verb: string,
  styled: boolean,
): string | null {
  for (let index = start; index < end; index++) {
    if (startsWith(folded, index, PASSAGE)) return null;
  }
  if (pointsAtPassage(folded, start, end)) return null;
  const minimum =
    MIN_WORDS[verb] ?? (styled ? MIN_PASSAGE_WORDS : SHORT_PASSAGE_WORDS);
  if (contentWords(folded, start, end) < minimum) return null;
  return (
    words
      .slice(start, end)
      .join(' ')
      .replace(/^[\s:,.]+|[\s:,.]+$/gu, '') || null
  );
}

function textBeforeCommand(
  words: string[],
  folded: string[],
  start: number,
): string | null {
  for (let index = words.length - 1; index > start; index--) {
    if (!words[index - 1].endsWith(',')) continue;
    const action = startsWith(folded, index, ACTIONS);
    if (!action) continue;
    const rest = trim(folded, index + action, words.length);
    if (rest.start < rest.end) return null;
    const verb = folded.slice(index, index + action).join(' ');
    return passage(words, folded, start, index, verb, false);
  }
  return null;
}

export function inlineWritingText(instruction: string): string | null {
  const words = instruction
    .split(/\s+/u)
    .map((word) => word.replace(/^["'“”‘’`]+|["'“”‘’`]+$/gu, ''))
    .filter(Boolean);
  const folded = words.map((word) =>
    foldInstruction(word)
      .toLowerCase()
      .replace(/[^\p{L}\p{N}_-]/gu, ''),
  );
  let start = 0;
  for (let size = startsWith(folded, start, LEAD); size; ) {
    start += size;
    size = startsWith(folded, start, LEAD);
  }
  const action = startsWith(folded, start, ACTIONS);
  if (!action) return textBeforeCommand(words, folded, start);
  const verb = folded.slice(start, start + action).join(' ');
  const found = trim(folded, start + action, words.length);
  return passage(words, folded, found.start, found.end, verb, found.styled);
}
