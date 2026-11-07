import { readFileSync } from 'fs';
import { join } from 'path';

import { foldInstruction } from './ai-instruction-evidence';
import { normalizeCommand } from './ai-sentence-normalize';

/**
 * Kế hoạch sửa lỗi người dùng giả lập (S2–S5): the same cases as ai-taskmanly
 * `evaluation/normalization_cases.json`, compared on folded text without quotes.
 */
const { cases } = JSON.parse(
  readFileSync(join(__dirname, 'ai-sentence-normalize.cases.json'), 'utf8'),
) as { cases: { input: string; output: string }[] };

const masked = (text: string): string =>
  text.replace(/"[^"]*"|“[^”]*”/gu, 'quoted');

const folded = (text: string): string =>
  foldInstruction(text)
    .toLowerCase()
    .replace(/["“”]/gu, '')
    .replace(/\s+/gu, ' ')
    .trim();

describe('everyday wording shared with the AI service rules', () => {
  it.each(cases.map((item) => [item.input, item.output]))(
    'normalizes %s',
    (input, output) => {
      // Quoted parts reach normalizeCommand masked, as in the policy.
      if (/["“”]/u.test(input)) {
        expect(normalizeCommand(folded(masked(input)))).toBe(
          folded(masked(output)),
        );
      } else {
        expect(normalizeCommand(folded(input))).toBe(folded(output));
      }
    },
  );
});
