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
const ACTIONS = [
  'tom tat',
  'viet lai',
  'viet tiep',
  'rut gon',
  'mo rong',
  'dich',
  'translate',
  'summarize',
  'shorten',
  'rewrite',
  'expand',
  'continue',
  'paraphrase',
  'improve',
];
const FILLER = [
  ...vocabularyWords('help_after_verb'),
  'doan nay',
  'cau nay',
  'cai nay',
  'doan sau',
  'cau sau',
  'doan van nay',
  'this',
  'it',
  'lai',
  'nay',
];
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
// Translating takes any phrase; for the other actions only a real passage.
const MIN_WORDS: Record<string, number> = { dich: 2, translate: 2 };
const MIN_PASSAGE_WORDS = 8;

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
  if (!['sang', 'to', 'into', 'qua'].includes(folded[at] ?? '')) return 0;
  const size = startsWith(folded, at + 1, LANGUAGES);
  return size ? size + 1 : 0;
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
  if (!action) return null;
  const verb = folded.slice(start, start + action).join(' ');
  start += action;
  let end = words.length;
  for (let changed = true; changed; ) {
    changed = false;
    const head = startsWith(folded, start, FILLER) || languageAt(folded, start);
    if (head) {
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
      if (end - back > start && languageAt(folded, end - back) === back) {
        end -= back;
        changed = true;
        break;
      }
    }
  }
  const text = words.slice(start, end);
  if (text.length < (MIN_WORDS[verb] ?? MIN_PASSAGE_WORDS)) return null;
  return text.join(' ').replace(/^[\s:,.]+|[\s:,.]+$/gu, '') || null;
}
