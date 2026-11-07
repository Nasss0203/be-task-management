import { readFileSync } from 'fs';
import { join } from 'path';

import { inlineWritingText } from './ai-writing-inline-text';

/** Kế hoạch sửa tính năng viết (V2): the same cases as ai-taskmanly writing_source. */
const { cases } = JSON.parse(
  readFileSync(join(__dirname, 'ai-writing-inline-text.cases.json'), 'utf8'),
) as { cases: { input: string; text: string | null }[] };

describe('writing text without ":" shared with the AI service', () => {
  it.each(cases.map((item) => [item.input, item.text]))(
    'reads %s',
    (input, text) => {
      expect(inlineWritingText(input)).toBe(text);
    },
  );
});
