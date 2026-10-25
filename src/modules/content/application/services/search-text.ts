const VIETNAMESE_ACCENTED =
  'àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ';

export const VIETNAMESE_PLAIN = [...VIETNAMESE_ACCENTED]
  .map((char) =>
    char === 'đ' ? 'd' : char.normalize('NFD').replace(/[̀-ͯ]/g, ''),
  )
  .join('');

export { VIETNAMESE_ACCENTED };

export function foldSearchText(text: string): string {
  return [...text.toLowerCase()]
    .map((char) => {
      const index = VIETNAMESE_ACCENTED.indexOf(char);
      return index === -1 ? char : VIETNAMESE_PLAIN[index];
    })
    .join('');
}

export function normalizeSearchText(text: string): string {
  return foldSearchText(text.trim()).replace(/\s+/g, ' ');
}

export function buildSnippet(
  text: string,
  normalizedQuery: string,
  radius = 60,
): string {
  const folded = foldSearchText(text);
  const index = normalizedQuery ? folded.indexOf(normalizedQuery) : -1;

  const collapse = (value: string) => value.replace(/\s+/g, ' ').trim();

  if (index === -1 || text.length <= radius * 2) {
    return text.length > radius * 2
      ? `${collapse(text.slice(0, radius * 2))}…`
      : collapse(text);
  }

  const start = Math.max(0, index - radius);
  const end = Math.min(text.length, index + normalizedQuery.length + radius);

  return `${start > 0 ? '…' : ''}${collapse(text.slice(start, end))}${end < text.length ? '…' : ''}`;
}

export function escapeLikePattern(text: string): string {
  return text.replace(/[\\%_]/g, (char) => `\\${char}`);
}
