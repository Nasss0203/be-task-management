import { vocabularyWords } from './ai-vi-vocabulary-words';
import { explainUnsupportedModification } from './ai-modification-operation.policy';

type Group = Parameters<typeof vocabularyWords>[0];

const CANONICAL: [string, Group[]][] = [
  ['them', ['state_insert', 'verb_insert_said']],
  ['xoa', ['state_delete', 'verb_delete_said']],
  ['tich', ['state_tick']],
  ['bo', ['state_untick', 'verb_untick_said']],
];
const CONNECTORS = ['vao', 'o'];

function tokens(text: string): string[] {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/đ/giu, 'd')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/u)
    .filter(Boolean);
}

/** D-87: the command is the sentence's own words, put verb first. */
export function isCommandFromSentence(
  command: string,
  sentence: string,
): boolean {
  const said = ` ${tokens(sentence).join(' ')} `;
  const available = new Set([...tokens(sentence), ...CONNECTORS]);
  for (const [verb, groups] of CANONICAL) {
    if (vocabularyWords(...groups).some((word) => said.includes(` ${word} `))) {
      available.add(verb);
      if (verb === 'bo') available.add('tich');
    }
  }
  const words = tokens(command);
  return words.length > 0 && words.every((word) => available.has(word));
}

/**
 * D-87: a sentence the closed grammar does not read only because its command
 * is not first. Any blocked word other than a misplaced verb still refuses it.
 */
export function onlyOrderDiffers(
  sentence: string,
  command: string,
  pageNames: readonly string[] = [],
): boolean {
  if (!isCommandFromSentence(command, sentence)) return false;
  const detail = explainUnsupportedModification(sentence, pageNames);
  return (
    detail.kind === 'GENERIC' ||
    (detail.kind === 'BLOCKED_WORD' && !!detail.misplaced && !detail.pageAction)
  );
}
