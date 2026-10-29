import {
  foldInstruction,
  maskQuotedText,
  stripCommandPrefix,
} from './ai-instruction-evidence';

// Folding drops the marks that tell a verb from data: "đội" (team), "chính"
// (main) and "bộ" (set) are not "đổi", "chỉnh" or "bỏ". A word written with
// other marks than the verb's keeps a "_" so no verb pattern matches it.
const VERB_SPELLINGS: Record<string, readonly string[]> = {
  xoa: ['xoá', 'xóa'],
  sua: ['sửa'],
  chinh: ['chỉnh'],
  doi: ['đổi'],
  dich: ['dịch'],
  bo: ['bỏ', 'bổ'],
  go: ['gỡ'],
  thay: ['thay'],
  them: ['thêm'],
  chen: ['chèn'],
  tich: ['tích'],
};

function foldCommand(text: string): string {
  return text.replace(/[\p{L}\p{M}]+/gu, (word) => {
    const folded = foldInstruction(word);
    const spellings = VERB_SPELLINGS[folded];
    const written = word.normalize('NFC').toLowerCase();
    return spellings && written !== folded && !spellings.includes(written)
      ? `${folded}_`
      : folded;
  });
}

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

// Hướng A: a heading's name and the items after "checklist gồm" are data and
// need no quotes. They still pass the whole-command verb and punctuation checks,
// and may not mention a Page: a target must be recognized (quoted or M1b).
const LABEL_OBJECT = /\b(?:heading|tieu de)$/u;

const LIST_OBJECT = /\bchecklist$/u;

const LIST_ITEMS = /^(?:bao gom|gom)\s+/u;

const TARGET_SUFFIX =
  /\s*\b(?:vao|trong|o|tai|cua|to|in|on)(?:\s+(?:cuoi|dau))?(?:\s+the)?\s+(?:(?:trang|page)(?:\s+(?:quoted|nay|hien tai|dang mo))?|(?:quoted|this|current)\s+page)$/u;

// Kế hoạch tích to-do: ticking / unticking existing to-dos. Like "checklist
// gồm" items the names are data, but one kind of work per sentence (D4).
const TODO_VERB =
  /^(?:tich(?!\s+(?:hop|cuc)\b)|danh dau|bo tich|bo danh dau|hoan thanh|lam xong|check(?!\s+list\b)|uncheck|mark|complete|finish)\b/u;

const STATUS = '(?:xong|hoan thanh|done|complete|completed)';

const NOT_DONE = '(?:chua xong|chua hoan thanh|not done|incomplete)';

// Same order as ai-taskmanly todo_status.py: untick forms before tick forms.
const TODO_STATUS = [
  '(?:bo tich|bo danh dau|uncheck)\\s+(?<items>.+)',
  `(?:danh dau|mark)\\s+(?<items>.+?)\\s+(?:(?:la|as)\\s+)?${NOT_DONE}`,
  `(?<items>.+?)\\s+${NOT_DONE}`,
  `(?:danh dau|mark)\\s+(?:(?:la|as)\\s+)?(?:da\\s+)?${STATUS}\\s+(?<items>.+)`,
  `(?:danh dau|mark)\\s+(?<items>.+?)\\s+(?:(?:la|as)\\s+)?(?:da\\s+)?${STATUS}(?:\\s+roi)?`,
  '(?:hoan thanh|lam xong|complete|finish)\\s+(?<items>.+)',
  '(?:tich(?!\\s+(?:hop|cuc)\\b)|check(?!\\s+list\\b))\\s+(?<items>.+)',
  `(?<items>.+?)\\s+(?:da\\s+)?${STATUS}(?:\\s+roi)?`,
].map((pattern) => new RegExp(`^(?:${pattern})$`, 'u'));

const TODO_FILLER = /^(?:(?:phan|muc|viec|cong viec|to-do|todo|task)\s+)+/u;

function isFreeData(text: string): boolean {
  const data = text.replace(TARGET_SUFFIX, '').trim();
  return !!data && !/\b(?:trang|page)\b/u.test(data);
}

// "items": a "checklist gồm" list, which may continue after "và".
type InsertionClause = 'closed' | 'items';

function insertionClause(
  part: string,
  allowFreeData: boolean,
  afterItems: boolean,
): InsertionClause | null {
  const clause = part.replace(INSERT, '').trim();
  const object = OBJECT.exec(clause);
  const remainder = object
    ? clause.slice(object[0].length).replace(/[.,]/gu, ' ').trim()
    : '';
  if (
    object &&
    remainder
      .split(/\s+/u)
      .filter(Boolean)
      .every((word) => SAFE_TAIL.has(word) || /^(?:\d+|q[1-4])$/u.test(word))
  )
    return 'closed';
  if (!allowFreeData) return null;
  const objectName = object?.[0].trim() ?? '';
  if (object && LABEL_OBJECT.test(objectName) && isFreeData(remainder))
    return 'closed';
  if (
    object &&
    LIST_OBJECT.test(objectName) &&
    LIST_ITEMS.test(remainder) &&
    isFreeData(remainder.replace(LIST_ITEMS, ''))
  )
    return 'items';

  // "checklist gồm a, b và c": the last item follows "và" — but "và tích x"
  // is a second kind of work, not an item (D4).
  return afterItems && isFreeData(clause) && !TODO_VERB.test(clause)
    ? 'items'
    : null;
}

const BLOCKED_VERB =
  /\b(?:xoa|sua|chinh|doi|dich(?!\s+vu\b)|viet lai|rut gon|di chuyen|sap xep|thay the|chia se|cap quyen|phan quyen|thu hoi|xuat ban|cong khai|nhan ban|khoi phuc|delete|remove|update|edit|rename|rewrite|translate|move|reorder|replace|archive|ignore|override|execute|drop|truncate|publish|unpublish|share|grant|revoke|invite|export|restore|duplicate)\b/u;

// Kế hoạch sửa chữ block: "đổi / sửa / thay … X thành / bằng / to Y".
const TEXT_EDIT =
  /^(?:chinh sua|thay doi|doi|sua|thay|chinh|cap nhat|change|update|edit|replace|rename)\s+(?<change>.+?\s+(?:thanh|sang|bang|to|with|into)\s+.+)$/u;

// One kind of work per sentence (D4): no second command after và / rồi.
const SECOND_COMMAND =
  /\b(?:va|and|roi|then|sau do)\s+(?:them|chen|bo sung|ghi them|add|insert|append|prepend|tich|danh dau|bo tich|hoan thanh|lam xong|check|uncheck|mark|thay|cap nhat|change|xoa|bo|go|delete|remove)\b/u;

// Kế hoạch xoá block: "xoá / bỏ / gỡ / delete / remove X, Y và Z".
// "bỏ tích" (untick), "bỏ qua" (override) and "bổ sung" (add) are not deletes.
const BLOCK_DELETE =
  /^(?:xoa(?:\s+bo)?|bo(?!\s+(?:tich|danh dau|qua|sung)\b)|go(?:\s+bo)?|delete|remove)\s+(?<names>.+)$/u;

const DELETE_VERB = /^(?:xoa|delete|remove)$/u;

// "xoá hết / tất cả …" deletes in bulk; only named blocks are deleted.
const BULK = /^(?:het|tat ca|moi|toan bo_?|all|everything)\b/u;

// Words that only say which kind of block; a name must remain after them.
const BLOCK_KIND =
  /^(?:(?:to-do|todo|muc|dong|block|heading|tieu de|doan|cau|toggle|phan|viec|task|text|checklist|danh sach)\s*)+/u;

/** Named blocks to delete; every name is plain data. */
function isBlockDelete(command: string): boolean {
  const body = command
    .replace(
      /(?:[\s,.]+(?:nhe|nha|di|giup toi|giup minh|please))*[\s,.]*$/u,
      '',
    )
    .replace(TARGET_SUFFIX, '')
    .replace(/[\s,.]+$/u, '');
  const names = BLOCK_DELETE.exec(body)?.groups?.names;
  if (!names || SECOND_COMMAND.test(names)) return false;
  return names.split(/\s*(?:,|\bva\b|\band\b)\s*/u).every((name) => {
    const named = name.replace(BLOCK_KIND, '').trim();
    return (
      !!named &&
      isFreeData(name) &&
      !BULK.test(name) &&
      !BLOCKED_VERB.test(name) &&
      !INSERT.test(`${name} `) &&
      !TODO_VERB.test(name)
    );
  });
}

/** One block's text change; the old and new text are plain data. */
function isBlockTextChange(command: string): boolean {
  const body = command
    .replace(
      /(?:[\s,.]+(?:nhe|nha|di|giup toi|giup minh|please))*[\s,.]*$/u,
      '',
    )
    .replace(TARGET_SUFFIX, '')
    .replace(/[\s,.]+$/u, '');
  const change = TEXT_EDIT.exec(body)?.groups?.change;

  // "đổi tên trang X thành Y" renames a Page: data never mentions a Page.
  return (
    !!change &&
    isFreeData(change) &&
    !BLOCKED_VERB.test(change) &&
    !SECOND_COMMAND.test(change)
  );
}

/** Tick / untick sentences (kế hoạch tích to-do); names must be plain data. */
function isTodoStatusChange(command: string): boolean {
  const body = command
    .replace(
      /(?:[\s,.]+(?:nhe|nha|di|giup toi|giup minh|please))*[\s,.]*$/u,
      '',
    )
    .replace(TARGET_SUFFIX, '')
    .replace(/[\s,.]+$/u, '');
  const items = TODO_STATUS.map((pattern) => pattern.exec(body)).find(Boolean)
    ?.groups?.items;
  if (!items) return false;
  return items.split(/\s*(?:,|\bva\b|\band\b)\s*/u).every((item) => {
    const name = item.replace(TODO_FILLER, '').trim();

    // "thêm logo xong rồi" or "tích a và thêm b" mix in another kind of work.
    return (
      isFreeData(name) && !INSERT.test(`${name} `) && !TODO_VERB.test(name)
    );
  });
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
        .map((name) => foldCommand(name).replace(/\s+/gu, ' ').trim())
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

const PAGE_FIRST_TARGET =
  /^(?:(?:cap nhat|update)\s+)?(?:trong\s+)?(?:trang|page)\s+(?:quoted|hien tai|nay|this|current)(?:\s*[:,]\s*|\s+)/u;

const BARE_CHECKLIST =
  /^(?:(?:mot|a|an|the|new|moi|another|\d+)\s+)*(?:checklist|check list|task list|todo|to-do)(?:\s+(?:moi|new))?$/u;

/**
 * gp02: "thêm checklist" with neither items nor a topic. The planner would
 * invent items or copy the Page, so the user is asked for the items instead.
 * Only a recognized target (quoted, M1b name, this Page) may follow.
 */
export function isBareChecklistRequest(
  source: string,
  pageNames: readonly string[] = [],
): boolean {
  const masked = maskQuotedText(dropUnclosedQuotes(source));
  if (masked === null) return false;
  const command = maskPageNames(
    stripCommandPrefix(foldCommand(masked).replace(/\s+/gu, ' ')),
    pageNames,
  ).replace(PAGE_FIRST_TARGET, '');
  if (!INSERT.test(command)) return false;
  const body = command
    .replace(INSERT, '')
    .replace(/[.!]+$/u, '')
    .replace(/\s+(?:nhe|nha|di|giup toi|giup minh|please)$/u, '')
    .replace(TARGET_SUFFIX, '')
    .trim();
  return BARE_CHECKLIST.test(body);
}

/**
 * @param pageNames Page names to treat as data (M1b): a name the AI service
 *   took from this source, or a real Page title found in it. Never other text.
 */
export function isSupportedModification(
  source: string,
  pageNames: readonly string[] = [],
): boolean {
  const quotesClosed = dropUnclosedQuotes(source);
  const masked = maskQuotedText(quotesClosed);
  if (masked === null) return false;
  let command = maskPageNames(
    stripCommandPrefix(foldCommand(masked).replace(/\s+/gu, ' ')),
    pageNames,
  );
  // Match the entire command before stripping any Page-first target prefix.
  // Only this explicit payload grammar admits a colon; SAFE_TAIL stays closed.
  if (isQuotedPayloadInsertion(source, command)) return true;
  // A Page-first prefix is only a target; require a separate insertion clause.
  command = command.replace(PAGE_FIRST_TARGET, '');
  if (/[;:\n?!]/u.test(command)) return false;
  // A stray quote is tolerated as a typo, but then free data stays closed.
  const allowFreeData = quotesClosed === source;

  // "đổi X thành Y" leads with a verb from the list below; X and Y then pass
  // that same list as data (kế hoạch sửa chữ block).
  if (allowFreeData && isBlockTextChange(command)) return true;

  // "xoá X, Y" leads with a blocked verb too; the names then pass the list.
  if (allowFreeData && isBlockDelete(command)) return true;

  // Other operation verbs outside quotes cannot be disguised as insertion data.
  if (BLOCKED_VERB.test(command)) return false;
  if (!INSERT.test(command)) {
    return allowFreeData && isTodoStatusChange(command);
  }
  const body = command.replace(INSERT, '');
  // Every joined clause must itself name supported content or another insertion.
  // Arbitrary prose that contains verbs should be explicitly quoted as data.
  let previous: InsertionClause | null = 'closed';
  for (const part of body.split(/\s+(?:va|and|roi|then|sau do)\s+/u)) {
    previous = insertionClause(part, allowFreeData, previous === 'items');
    if (!previous) return false;
  }
  return true;
}

// M2 (kế hoạch tìm theo hoạt động, B7): "… vào trang [gợi ý] tôi sửa hôm qua".
// The same grammar as the AI service's rules, checked again on the folded text.
const ACTIVITY_TARGET_VI =
  /^ (?:vao|trong|o|tren|tai|cho) (?:trang|page) (?:\S+ ){0,6}?(?:(?:ma|do) )?(?:toi|minh|em) (?:(?:vua|moi|da) )*(?:chinh sua|sua|chinh|cap nhat|viet)(?: (?:gan day nhat|gan nhat|lan cuoi|lan gan nhat|moi nhat|cuoi cung|hom nay|hom qua|hom kia|tuan truoc|gan day|dao nay|\d{1,2} ngay truoc))?$/u;
const ACTIVITY_TARGET_EN =
  /^ (?:to|in|on|into) (?:the )?(?:\S+ ){0,6}?page (?:that )?i (?:(?:last|just|recently) )*(?:edited|updated|changed|modified|worked on)(?: (?:most recently|last|today|yesterday|last week|recently|lately|\d{1,2} days? ago))?$/u;

/**
 * "… nhé", "… ạ", "… please" with their marks: "ạ" folds to "a", which would
 * otherwise cut the last word of a name such as "Dự án A".
 */
function withoutPoliteTail(source: string): string {
  return source
    .normalize('NFC')
    .replace(/(?:[\s,]+(?:nhé|nha|ạ|please))*[\s.!?]*$/iu, '');
}

/**
 * The sentence is exactly the edit clause plus "trang … tôi sửa <time>". The
 * activity words name the Page (they hold "sửa", which is no edit here); the
 * edit clause passes the usual admission.
 */
export function isSupportedActivityModification(
  source: string,
  instruction: string,
): boolean {
  const fold = (text: string) =>
    foldInstruction(text).replace(/\s+/gu, ' ').trim();
  const text = fold(withoutPoliteTail(source));
  const edit = fold(instruction);
  if (!edit || !text.startsWith(edit)) return false;
  const target = text.slice(edit.length);
  if ((target.match(/\b(?:trang|page)\b/gu) ?? []).length !== 1) return false;
  return (
    (ACTIVITY_TARGET_VI.test(target) || ACTIVITY_TARGET_EN.test(target)) &&
    isSupportedModification(instruction)
  );
}

// M6 (kế hoạch tìm theo mô tả, G1, G5): "… vào trang về <mô tả>", "Sửa trang
// dùng để <mô tả>: <việc>". The same cues as the AI service's rules, folded.
const DESCRIPTION_CUE_VI =
  '(?:dung de|dung cho|de|noi ve|viet ve|ve|ghi lai|ghi chep|ghi|theo doi|lien quan (?:den|toi)|chuyen ve)';
const DESCRIPTION_CUE_EN =
  '(?:about|for|on|covering|used for|that (?:covers|tracks|is about)|where (?:we|i) (?:track|keep|write down|write))';

/**
 * The sentence is exactly the edit clause and "trang <cue> <mô tả>", in either
 * order. The description names the Page (it may hold "xoá", which is no edit
 * here); the edit clause passes the usual admission.
 */
export function isSupportedDescriptionModification(
  source: string,
  instruction: string,
  description: string,
): boolean {
  const fold = (text: string) =>
    foldInstruction(text).replace(/\s+/gu, ' ').trim();
  const text = fold(withoutPoliteTail(source));
  const edit = escapeRegExp(fold(withoutPoliteTail(instruction)));
  const named = fold(description);
  if (!edit || !named || /\b(?:trang|page)\b/u.test(named)) return false;
  const what = escapeRegExp(named);
  const shapes = [
    `^${edit} (?:vao|trong|o|tren|tai|cho) trang ${DESCRIPTION_CUE_VI} ${what}$`,
    `^(?:(?:hay|vui long) )?(?:sua|chinh sua|chinh|cap nhat) trang ${DESCRIPTION_CUE_VI} ${what} ?[:,;] ${edit}$`,
    `^${edit} (?:to|in|on|into) the page ${DESCRIPTION_CUE_EN} ${what}$`,
    `^(?:please )?(?:edit|update) the page ${DESCRIPTION_CUE_EN} ${what} ?[:,;] ${edit}$`,
  ];
  return (
    shapes.some((shape) => new RegExp(shape, 'u').test(text)) &&
    isSupportedModification(instruction)
  );
}

/**
 * M4 (kế hoạch lọc theo cấu trúc, E4): the sentence without its place
 * ("… trong trang Dự án A", "… thuộc Dự án A", "… in the Marketing
 * teamspace"). The place names an ancestor Page or a teamspace, never an
 * edit. Null when the sentence does not end with that place.
 */
export function withoutPageScope(
  source: string,
  scope: { parentTitle: string | null; teamspaceName: string | null },
): string | null {
  const name = scope.parentTitle ?? scope.teamspaceName;
  if (!name) return null;
  const fold = (text: string) =>
    foldInstruction(text).replace(/\s+/gu, ' ').trim();
  const text = fold(withoutPoliteTail(source));
  const quote = '["\'“”‘’`]?';
  const place = new RegExp(
    ` (?:(?:trong|cua|thuoc) (?:(?:trang|du an|teamspace) )?|(?:in|of|under|inside) (?:the )?(?:(?:project|teamspace) )?)${quote}${escapeRegExp(fold(name))}${quote}(?: (?:page|project|teamspace))?$`,
    'u',
  );
  const match = place.exec(text);
  return match ? text.slice(0, match.index) : null;
}

/** Why a request was refused; it never changes what is refused (kế hoạch sửa nhỏ, D3). */
export type UnsupportedModificationDetail =
  // pageAction: the word acts on a whole Page ("xoá trang", "đổi tên trang").
  | { kind: 'BLOCKED_WORD'; term: string; pageAction: boolean }
  | { kind: 'PUNCTUATION'; term: string }
  | { kind: 'MIXED' }

  // "xoá hết / tất cả": only named blocks are deleted (kế hoạch xoá block).
  | { kind: 'BULK' }
  | { kind: 'GENERIC' };

const MAX_TERM_LENGTH = 30;

const PAGE_OBJECT =
  /^(?:(?:ten|toan bo_?|het|ca|noi dung|cua)\s+)*(?:trang|page)\b/u;

const SUPPORTED_VERB =
  /^(?:them|chen|bo sung|ghi them|add|insert|append|prepend|tich|danh dau|bo tich|bo danh dau|hoan thanh|lam xong|check|uncheck|mark|chinh sua|thay doi|doi|sua|thay|chinh|cap nhat|change|update|edit|replace|xoa|bo|go|delete|remove)\b/u;

const SECOND_KIND =
  /\b(?:va|and|roi|then|sau do)\s+(?:them|chen|bo sung|ghi them|add|insert|append|prepend|tich|danh dau|bo tich|hoan thanh|lam xong|check|uncheck|mark|doi|sua|thay|chinh|cap nhat|change|update|edit|replace|xoa|delete|remove|go)\b/u;

/** The user's own words (with their marks) for a folded word sequence. */
function originalWords(
  words: readonly string[],
  folded: readonly string[],
  term: string,
): string {
  const wanted = term.split(' ');
  // Keep the "_" of a folded non-verb ("bộ" is "bo_"): it is part of the word.
  const bare = folded.map((word) =>
    word.replace(/^[^\p{L}\p{N}_]+|[^\p{L}\p{N}_]+$/gu, ''),
  );
  for (let start = 0; start + wanted.length <= bare.length; start++) {
    if (wanted.every((word, offset) => bare[start + offset] === word)) {
      const text = words
        .slice(start, start + wanted.length)
        .join(' ')
        .replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
      return text.length > MAX_TERM_LENGTH
        ? `${text.slice(0, MAX_TERM_LENGTH - 1)}…`
        : text;
    }
  }
  return term;
}

export function explainUnsupportedModification(
  source: string,
  pageNames: readonly string[] = [],
): UnsupportedModificationDetail {
  const masked = maskQuotedText(dropUnclosedQuotes(source));
  if (masked === null) return { kind: 'GENERIC' };
  const words = masked.split(/\s+/u).filter(Boolean);
  const folded = words.map((word) => foldCommand(word));
  const command = maskPageNames(
    stripCommandPrefix(folded.join(' ')),
    pageNames,
  ).replace(PAGE_FIRST_TARGET, '');
  const punctuation = /[;?!\n]/u.exec(command);
  if (punctuation) return { kind: 'PUNCTUATION', term: punctuation[0] };
  const blocked = (area: string): UnsupportedModificationDetail | null => {
    const verbs = new RegExp(BLOCKED_VERB.source, 'gu');
    for (const match of area.matchAll(verbs)) {
      const after = area.slice(match.index + match[0].length).trim();
      const page = PAGE_OBJECT.exec(after);
      const leading =
        match.index === 0 ||
        /\b(?:va|and|roi|then|sau do)\s+$/u.test(area.slice(0, match.index));

      // A leading "xoá" is a supported delete: only its object is wrong.
      if (DELETE_VERB.test(match[0]) && leading && !page) {
        if (match.index === 0 && BULK.test(after)) return { kind: 'BULK' };
        continue;
      }
      const term = page ? `${match[0]} ${page[0]}` : match[0];
      return {
        kind: 'BLOCKED_WORD',
        term: originalWords(words, folded, term),
        pageAction: !!page,
      };
    }
    return null;
  };

  // "đổi X thành Y": the leading verb is allowed; look inside X and Y only.
  const edit = TEXT_EDIT.exec(command.replace(TARGET_SUFFIX, ''));
  if (edit?.groups?.change) {
    const verb = command
      .slice(0, command.length - command.replace(/^\S+\s+/u, '').length)
      .trim();
    const page = PAGE_OBJECT.exec(edit.groups.change);
    if (page) {
      return {
        kind: 'BLOCKED_WORD',
        term: originalWords(words, folded, `${verb} ${page[0]}`),
        pageAction: true,
      };
    }
    const inChange = blocked(edit.groups.change);
    if (inChange) return inChange;
  } else {
    const anywhere = blocked(command);
    if (anywhere) return anywhere;
  }
  if (SUPPORTED_VERB.test(command) && SECOND_KIND.test(command)) {
    return { kind: 'MIXED' };
  }
  return { kind: 'GENERIC' };
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
