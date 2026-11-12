import vocabulary from './ai-vi-vocabulary.json';

type Group = Exclude<keyof typeof vocabulary, '_note'>;

const MARKED_ONLY: Group = 'tail_marked_only';

function fold(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/đ/giu, 'd')
    .toLowerCase();
}

export function sameVocabulary(
  first: Record<string, unknown>,
  second: Record<string, unknown>,
): boolean {
  const groups = (data: Record<string, unknown>) =>
    JSON.stringify(
      Object.keys(data)
        .filter((name) => !name.startsWith('_'))
        .sort()
        .map((name) => [name, data[name]]),
    );
  return groups(first) === groups(second);
}

export function vocabularyWords(...groups: Group[]): string[] {
  const found: string[] = [];
  for (const group of groups) {
    if (group === MARKED_ONLY) continue;
    for (const word of vocabulary[group]) {
      const folded = fold(word);
      if (!found.includes(folded)) found.push(folded);
    }
  }
  return found;
}

export function vocabularyPattern(...groups: Group[]): string {
  const ordered = vocabularyWords(...groups).sort(
    (a, b) => b.length - a.length || a.localeCompare(b),
  );
  return `(?:${ordered
    .map((word) =>
      word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /gu, '\\s+'),
    )
    .join('|')})`;
}
