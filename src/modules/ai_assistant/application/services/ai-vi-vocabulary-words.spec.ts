import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

import {
  sameVocabulary,
  vocabularyPattern,
  vocabularyWords,
} from './ai-vi-vocabulary-words';

const OWN = join(__dirname, 'ai-vi-vocabulary.json');
const AI_SERVICE_COPY = join(
  __dirname,
  '../../../../../../ai-taskmanly/app/shared/vi_vocabulary.json',
);

const read = (path: string) =>
  JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;

describe('shared Vietnamese vocabulary', () => {
  (existsSync(AI_SERVICE_COPY) ? it : it.skip)(
    'is the same file as in the AI service',
    () => {
      expect(sameVocabulary(read(OWN), read(AI_SERVICE_COPY))).toBe(true);
    },
  );

  it('finds one word of difference', () => {
    const own = read(OWN);
    const changed = { ...own, tail: [...(own.tail as string[]), 'thêm từ'] };
    expect(sameVocabulary(own, read(OWN))).toBe(true);
    expect(sameVocabulary(own, changed)).toBe(false);
  });

  it('reads folded spellings, longest phrase first', () => {
    const tail = new RegExp(`^${vocabularyPattern('tail')}$`, 'u');
    expect(tail.test('giup minh')).toBe(true);
    expect(tail.test('gium')).toBe(true);
    expect(tail.test('a')).toBe(false);
    expect(
      new RegExp(vocabularyPattern('verb_tick'), 'u').exec(
        'danh dau da xong',
      )?.[0],
    ).toBe('danh dau da xong');
  });

  it('keeps words that fold into content out of folded patterns', () => {
    expect(vocabularyWords('tail_marked_only')).toEqual([]);
    expect(vocabularyWords('verb_create_page')).toContain('lap');
  });
});
