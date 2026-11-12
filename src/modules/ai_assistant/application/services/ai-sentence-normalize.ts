/**
 * Everyday wording into the forms the admission grammar reads (kế hoạch sửa lỗi
 * người dùng giả lập, S2–S5). Mirrors ai-taskmanly `sentence_normalize.py`; both
 * are checked against the shared `ai-sentence-normalize.cases.json`.
 *
 * Input and output are folded text (no marks, lower case) with quoted parts
 * already masked; only wrapping words, separators and word order change. Data
 * words are kept, so they still pass every check that follows.
 */

import { vocabularyPattern as words } from './ai-vi-vocabulary-words';

const EDIT_VERB = words('verb_edit');
const DELETE_VERB = words('verb_delete');
const TICK_VERB = words('verb_tick');
// Kế hoạch sửa tính năng viết (V1): writing verbs ("dịch giúp tôi …").
const WRITE_VERB = words('verb_write');
const INSERT_VERB = words('verb_insert');
const CREATE_VERB = words('verb_create_page');
const VERB = `(?:${INSERT_VERB}|${EDIT_VERB}|${DELETE_VERB}|${TICK_VERB}|${WRITE_VERB})`;
const KIND =
  '(?:to-do|todo|to-dos|todos|heading|tieu de|checklist|doan van|doan|dong|trich dan|ghi chu|viec|task|tasks|muc)';
const LET_ME_WORDS = words('let_me');

const LEAD = new RegExp(`^(?:${words('lead', 'lead_short')}\\s*,?\\s+)+`, 'u');
// "mình cần / tôi muốn thêm …": only before a verb ("mình cần một trang" creates a Page).
const WANT = new RegExp(`^${words('want')} (?=${VERB}\\b)`, 'u');
const LET_ME = new RegExp(
  `^${LET_ME_WORDS} (?=(?:${EDIT_VERB}|${DELETE_VERB}|${TICK_VERB}|${INSERT_VERB}|${CREATE_VERB})\\b)`,
  'u',
);
const GIVE_PAGE = new RegExp(
  `^${LET_ME_WORDS} (?:mot (?:trang|page)(?: moi)?(?: (?:co ten|ten))?|(?:trang|page) (?:moi(?: (?:co ten|ten))?|co ten|ten)) (?=\\S)`,
  'u',
);
const DONE_SHORT = /(?<=\bxong) r(?=[\s.!?]*$)/u;
const TICK_WORD =
  /(?:^|(?<=, ))(?:(?<untick>untick|bo tick)|tick off|check off|tick)(?= )/u;
const GIVE_ME = new RegExp(
  // "cho mình" may already be gone (withoutLeadingTarget drops it as polite).
  `^(?:${LET_ME_WORDS}(?: (?:cai|mot|them))?|cai|mot cai) (?=${KIND}\\b)`,
  'u',
);
const TAIL = new RegExp(`(?:[\\s,]+${words('tail')})+[\\s.!?]*$`, 'u');
// "đi", "với", "nữa", "cảm ơn" also end content ("bữa trưa mang đi"): dropped
// only when the sentence adds nothing ("xoá cái X đi", "giúp mình với").
const LOOSE = words('loose_tail');
const LOOSE_TAIL = new RegExp(`(?:[\\s,]+${LOOSE})+[\\s.!?]*$`, 'u');
const TARGET_BEFORE_TAIL = new RegExp(
  `\\b(?:vao|o|trong|tai|tren|cua|cho|cuoi|dau)\\s+(?:trang|page|bang|table)\\s+[^,]+?(?=(?:[\\s,]+${LOOSE})+[\\s.!?]*$)`,
  'u',
);
const TRAILING_WITH = new RegExp(
  `[\\s,]+${words('trailing_with')}[\\s.!?]*$`,
  'u',
);
const LIST_MARK = new RegExp(`,|\\s${words('list_joiners')}\\s`, 'u');
const INSERTS = new RegExp(
  `^(?:${INSERT_VERB}|${LET_ME_WORDS}|${words('want')}|${words('verb_create_page', 'verb_create_page_en', 'verb_create_page_loose')})\\b`,
  'u',
);
const CREATE_PAGE = new RegExp(
  `^${words('verb_create_page', 'verb_create_page_loose')}(?: (?:giup|gium|cho))?(?: (?:minh|toi|em))?(?: (?:mot|cai))* (?=(?:trang|page)\\b)`,
  'u',
);
const CREATE_START = new RegExp(
  `^${words('verb_create_page', 'verb_create_page_en')}(?: (?:mot|a|an|new))? (?:trang|page)\\b`,
  'u',
);
const LIST_OPENER_LONG = new RegExp(`\\b${words('list_opener_long')}\\b`, 'u');
const HELP_AFTER_VERB = new RegExp(
  `^(${VERB}) ${words('help_after_verb')}(?= |:|,)`,
  'u',
);
const THING_AFTER_VERB = new RegExp(`^(${DELETE_VERB}|${TICK_VERB}) cai `, 'u');
const COUNT = new RegExp(
  `^(${DELETE_VERB}|${TICK_VERB}) (\\d+) (?:viec|dong|to-do|todo|muc|cai|block|items?|tasks?) `,
  'u',
);
const EN_ITEM = new RegExp(
  `^(${DELETE_VERB}|${TICK_VERB}) the (.+?) (?:item|task|to-do|todo)$`,
  'u',
);
const PLACE_FIRST = new RegExp(
  // The Page named first moves to the end, where a target is read.
  `^(?:((?:o|trong|tai|tren) (?:trang|page) [^,]+),\\s*)?(?:(?:o|trong|tai) )?phan (.+?),? (?:(?:hay|ban) )*(them .+)$`,
  'u',
);
const UNTICK_AFTER =
  /^(?:viec |to-do )?(.+?),? chua xong,? (?:bo danh dau|bo tich)$/u;
const WRITE_INTO = /^ghi them vao ([^:]+?)\s*:\s*(.+)$/u;
// Bước 4 (bỏ dấu hai chấm): "ghi chú dời họp sang thứ Năm" needs no ":".
const NOTE =
  /^ghi chu(?: lai)?(?: (?:giup|gium)(?: (?:minh|toi))?)?(?:\s*:\s*|\s+)(.+)$/u;
const ADD_INTO = /^them vao (phan [^:]+?)\s*:\s*(.+)$/u;
const PAGE_TAIL =
  /\s+(?:o|trong|tai|vao|cua|tren|on|in)\s+(?:the\s+)?(?:trang|page)\s+.+$/u;
// Without ":" only the AI service knows where the section name ends (it has the
// Page); admission reads the words as data of one insertion.
// A place with nothing to add ("thêm vào phần Môn Sinh") stays refused: a list
// needs a comma, a paragraph at least 5 words after "vào".
const WRITE_INTO_LOOSE = /^ghi them vao ((?:\S+ ){4,}[^:\s]+)$/u;
const ADD_INTO_LOOSE = /^them vao ((?:phan|muc) [^:]+,[^:]+)$/u;
// P6: "thêm vào bảng Tasks dòng X (với trạng thái Done)" puts the table first.
const TABLE_FIRST =
  /^them vao bang (\S+(?: \S+)??) ((?:\d+ )?(?:dong|hang|tasks?|rows?|sach|cuon)\b.+)$/u;

const NAME_SPLIT = new RegExp(
  `\\s*(?:,|\\b${words('list_joiners')}\\b)\\s*`,
  'u',
);

function namesCount(rest: string): number {
  return rest.split(NAME_SPLIT).filter((part) => part.trim()).length;
}

export function normalizeCommand(folded: string): string {
  let text = folded.replace(/\s+/gu, ' ').trim();
  for (let previous = ''; previous !== text; ) {
    previous = text;
    text = text.replace(LEAD, '').replace(TAIL, '');
    if (!INSERTS.test(text) || TARGET_BEFORE_TAIL.test(text))
      text = text.replace(LOOSE_TAIL, '');
    const trailing = TRAILING_WITH.exec(text);
    if (trailing && LIST_MARK.test(text.slice(0, trailing.index)))
      text = text.slice(0, trailing.index);
  }
  text = text
    .replace(WANT, '')
    .replace(LET_ME, '')
    .replace(GIVE_PAGE, 'tao trang ')
    .replace(DONE_SHORT, ' roi')
    .replace(TICK_WORD, (...match: unknown[]) =>
      (match[match.length - 1] as { untick?: string }).untick
        ? 'bo tich'
        : 'tich',
    )
    .replace(GIVE_ME, 'them ')
    .replace(CREATE_PAGE, 'tao ');
  if (CREATE_START.test(text)) {
    text = text.replace(LIST_OPENER_LONG, (found) => found.split(' ')[0]);
  }
  text = text
    .replace(HELP_AFTER_VERB, '$1')
    .replace(THING_AFTER_VERB, '$1 ')
    .replace(/\bto do\b/gu, 'to-do')
    .replace(/\bvo\b/gu, 'vao');
  if (new RegExp(`^${EDIT_VERB} `, 'u').test(text)) {
    text = text.replace(/\s*(?:->|→|=>)\s*/gu, ' thanh ');
  }
  // "xoá 2 việc A với B": the number must be the number of names.
  const count = COUNT.exec(text);
  if (count && Number(count[2]) === namesCount(text.slice(count[0].length))) {
    text = text.replace(COUNT, '$1 ');
  }
  if (new RegExp(`^(?:${DELETE_VERB}|${TICK_VERB}) `, 'u').test(text)) {
    text = text.replace(/ voi /gu, ' va ').replace(EN_ITEM, '$1 $2');
  }
  return text
    .replace(
      PLACE_FIRST,
      (_all, page: string | undefined, name: string, rest: string) =>
        [rest, 'vao phan', name, page].filter(Boolean).join(' '),
    )
    .replace(HELP_AFTER_VERB, '$1')
    .replace(UNTICK_AFTER, 'bo tich $1')
    .replace(WRITE_INTO, 'them doan van $2 vao $1')
    .replace(NOTE, 'them ghi chu $1')
    .replace(TABLE_FIRST, (_all, table: string, rest: string) => {
      // A Page named at the end stays at the end, where a target is read.
      const target = PAGE_TAIL.exec(rest);
      const page = target ? ` ${target[0].trim()}` : '';
      const body = target ? rest.slice(0, target.index).trim() : rest;
      if (!body.includes(':')) return `them ${body} vao bang ${table}${page}`;
      const [kind, items] = [
        body.slice(0, body.indexOf(':')),
        body.slice(body.indexOf(':') + 1),
      ];
      return `them ${kind.trim()} vao bang ${table}: ${items.trim()}${page}`;
    })
    .replace(ADD_INTO, (_all, place: string, items: string) =>
      items.includes(',')
        ? `them checklist gom ${items} vao ${place}`
        : `them doan van ${items} vao ${place}`,
    )
    .replace(WRITE_INTO_LOOSE, 'them doan van $1')
    .replace(ADD_INTO_LOOSE, 'them checklist gom $1');
}
