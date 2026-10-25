import {
  foldInstruction,
  maskQuotedText,
  stripCommandPrefix,
} from './ai-instruction-evidence';

// Positive grammar: affirmative insertion + a supported content/row object.
// Unknown commands fail closed. This is capability admission, never permission.
const INSERT = /^(?:them|chen|bo sung|ghi them|add|insert|append|prepend)\s+/u;
const OBJECT =
  /^(?:(?:mot|nhung|cac|a|an|the|new|moi|another|qa|\d+)\s+)*(?:heading|checklist|block|blocks|task|tasks|row|rows|dong|hang|muc|phan|ghi chu|noi dung|ket luan|release note|note|notes|text|paragraph|doan|tieu de|danh sach)\b/u;

// Fully consume the remaining clause, rather than accepting any suffix after
// "add heading". Free-form labels/content and titles must be quoted. This
// intentionally trades language coverage for a closed M0 admission boundary.
const SAFE_TAIL = new Set(
  'quoted qa qc sprint goal release plan demo tasks task heading checklist block blocks rows row dong hang muc phan bang database table tables note notes text paragraph doan tieu de danh sach ghi chu noi dung ket luan tong ket rui ro chi phi faq phu hop moi gom mot cuoc hop trong vao cho o tren tai to in on the a an this current page trang nay hien tai dang mo cuoi dau end start of nhe ke hoach backlog planning review'.split(
    ' ',
  ),
);

function isInsertionClause(part: string): boolean {
  const clause = part.replace(INSERT, '').trim();
  const object = OBJECT.exec(clause);
  if (!object) return false;
  const remainder = clause.slice(object[0].length).replace(/[.,]/gu, ' ');
  return remainder
    .split(/\s+/u)
    .filter(Boolean)
    .every((word) => SAFE_TAIL.has(word) || /^(?:\d+|q[1-4])$/u.test(word));
}

function isQuotedPayloadInsertion(source: string, command: string): boolean {
  // Keep this extension to single-line, unescaped quote pairs.
  if (/[\\\r\n]/u.test(source) || !INSERT.test(command)) return false;
  // The two pairs have distinct roles: explicit Page title, then payload.
  // Inspect the original strings: masking also turns empty quotes into tokens.
  const quotes = source.match(/"[^"]*"|'[^']*'|`[^`]*`|“[^”]*”|‘[^’]*’/gu);
  if (
    quotes?.length !== 2 ||
    quotes.some((quote) => !quote.slice(1, -1).trim())
  )
    return false;
  return /^(?:(?:mot|a|an|the|new|moi|another|\d+)\s+)*(?:block(?:\s+van\s+ban)?|text\s+block|checklist)\s+(?:vao|trong|o(?:\s+(?:cuoi|dau))?|to|in|on)\s+(?:trang|page)\s+quoted\s+(?:voi\s+noi\s+dung|with\s+content)\s*:\s*quoted\s*\.?$/u.test(
    command.replace(INSERT, ''),
  );
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}

/**
 * M1b: a known Page name right next to "trang"/"page" is data, exactly as if
 * it were quoted. Only the names the caller supplies are masked, and only in
 * that position; every other word stays inside the closed grammar.
 */
function maskPageNames(command: string, pageNames: readonly string[]): string {
  const names = [
    ...new Set(
      pageNames
        .map((name) => foldInstruction(name).replace(/\s+/gu, ' ').trim())
        .filter(Boolean),
    ),
  ].sort((a, b) => b.length - a.length);
  let masked = command;
  for (const name of names) {
    const escaped = escapeRegExp(name);
    masked = masked
      .replace(
        new RegExp(
          `(?<![\\p{L}\\p{N}])((?:trang|page)\\s+)(?:(?:co ten|ten|named|called)\\s+)?${escaped}(?![\\p{L}\\p{N}])`,
          'gu',
        ),
        '$1quoted',
      )
      .replace(
        new RegExp(
          `(?<![\\p{L}\\p{N}])${escaped}(\\s+page)(?![\\p{L}\\p{N}])`,
          'gu',
        ),
        'quoted$1',
      );
  }
  return masked;
}

const QUOTE_PAIRS: Record<string, string> = {
  '"': '"',
  "'": "'",
  '`': '`',
  '“': '”',
  '‘': '’',
};

/**
 * M1b: an opening quote that is never closed is a typo, not a data boundary.
 * Dropping it only exposes the following words to the closed grammar.
 */
function dropUnclosedQuotes(source: string): string {
  let result = '';
  for (let index = 0; index < source.length; index++) {
    const close = QUOTE_PAIRS[source[index]];
    if (!close) {
      result += source[index];
      continue;
    }
    const end = source.indexOf(close, index + 1);
    if (end < 0) continue;
    result += source.slice(index, end + 1);
    index = end;
  }
  return result;
}

/**
 * @param pageNames Page names to treat as data (M1b): a name the AI service
 *   took from this source, or a real Page title found in it. Never other text.
 */
export function isSupportedModification(
  source: string,
  pageNames: readonly string[] = [],
): boolean {
  const masked = maskQuotedText(dropUnclosedQuotes(source));
  if (masked === null) return false;
  let command = maskPageNames(
    stripCommandPrefix(foldInstruction(masked).replace(/\s+/gu, ' ')),
    pageNames,
  );
  // Match the entire command before stripping any Page-first target prefix.
  // Only this explicit payload grammar admits a colon; SAFE_TAIL stays closed.
  if (isQuotedPayloadInsertion(source, command)) return true;
  // A Page-first prefix is only a target; require a separate insertion clause.
  command = command.replace(
    /^(?:(?:cap nhat|update)\s+)?(?:trong\s+)?(?:trang|page)\s+(?:quoted|hien tai|nay|this|current)(?:\s*[:,]\s*|\s+)/u,
    '',
  );
  // Other operation verbs outside quotes cannot be disguised as insertion data.
  if (
    /\b(?:xoa|sua|chinh|doi|dich|viet lai|rut gon|di chuyen|sap xep|thay the|delete|remove|update|edit|rename|rewrite|translate|move|reorder|replace|archive|ignore|override|execute|drop|truncate)\b/u.test(
      command,
    )
  )
    return false;
  if (/[;:\n?!]/u.test(command)) return false;
  if (!INSERT.test(command)) return false;
  const body = command.replace(INSERT, '');
  // Every joined clause must itself name supported content or another insertion.
  // Arbitrary prose that contains verbs should be explicitly quoted as data.
  return body
    .split(/\s+(?:va|and|roi|then|sau do)\s+/u)
    .every(isInsertionClause);
}

export function hasSourceBackedCurrentPage(
  instruction: string,
  currentPageId?: string,
): boolean {
  const masked = maskQuotedText(instruction);
  if (masked === null) return false;
  const text = foldInstruction(masked);
  const markers = [...text.matchAll(/\b(?:trang|page)\b/gu)];
  // A named Page is never redirected to the current Page by model output.
  if (markers.length) {
    return (
      markers.length === 1 &&
      /\b(?:(?:trang|page)\s+(?:nay|hien tai|dang mo)|(?:this|current)\s+page)\b/u.test(
        text,
      )
    );
  }
  return !!currentPageId && isSupportedModification(instruction);
}
