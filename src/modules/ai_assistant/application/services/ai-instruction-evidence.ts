import { vocabularyPattern } from './ai-vi-vocabulary-words';

/** Small M0 surface grammar. Quoted content is always data. */
export function foldInstruction(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/đ/giu, 'd')
    .toLowerCase();
}

export function maskQuotedText(value: string): string | null {
  let masked = '';
  const pairs: Record<string, string> = {
    '"': '"',
    "'": "'",
    '`': '`',
    '“': '”',
    '‘': '’',
  };
  for (let index = 0; index < value.length; index++) {
    const close = pairs[value[index]];
    if (!close) {
      masked += value[index];
      continue;
    }
    const end = value.indexOf(close, index + 1);
    if (end < 0) return null;
    masked += ' quoted ';
    index = end;
  }
  return masked;
}

const COMMAND_PREFIX = new RegExp(
  `^(?:${vocabularyPattern('lead')}\\s+)+`,
  'u',
);

export function stripCommandPrefix(value: string): string {
  return value.trim().replace(COMMAND_PREFIX, '');
}
