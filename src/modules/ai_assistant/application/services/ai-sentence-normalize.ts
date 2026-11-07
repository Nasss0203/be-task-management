/**
 * Everyday wording into the forms the admission grammar reads (kế hoạch sửa lỗi
 * người dùng giả lập, S2–S5). Mirrors ai-taskmanly `sentence_normalize.py`; both
 * are checked against the shared `ai-sentence-normalize.cases.json`.
 *
 * Input and output are folded text (no marks, lower case) with quoted parts
 * already masked; only wrapping words, separators and word order change. Data
 * words are kept, so they still pass every check that follows.
 */

const EDIT_VERB =
  '(?:chinh sua|thay doi|doi|sua|thay|cap nhat|change|update|edit|rename)';
const DELETE_VERB = '(?:xoa(?: bo)?|go(?: bo)?|delete|remove)';
const TICK_VERB =
  '(?:bo tich|bo danh dau|danh dau(?: (?:da )?(?:xong|hoan thanh))?|tich(?: (?:da )?xong)?|hoan thanh|check|uncheck|mark)';
const VERB = `(?:them|chen|bo sung|ghi them|add|insert|${EDIT_VERB}|${DELETE_VERB}|${TICK_VERB})`;
const KIND =
  '(?:to-do|todo|to-dos|todos|heading|tieu de|checklist|doan van|doan|dong|trich dan|ghi chu|viec|task|tasks|muc)';

const LEAD =
  /^(?:(?:nho ban|phien ban|ban oi|ban co the|ban giup (?:minh|toi)|ban hay|ban|lam on|vui long|giup (?:minh|toi)|hay|pls|plz|please|can you|could you|would you)\s*,?\s+)+/u;
// "mình cần / tôi muốn thêm …": only before a verb ("mình cần một trang" creates a Page).
const WANT = new RegExp(`^(?:minh|toi|em) (?:can|muon) (?=${VERB}\\b)`, 'u');
const GIVE_ME = new RegExp(
  // "cho mình" may already be gone (withoutLeadingTarget drops it as polite).
  `^(?:cho (?:minh|toi|em)(?: (?:cai|mot|them))?|cai|mot cai) (?=${KIND}\\b)`,
  'u',
);
const TAIL =
  /(?:[\s,]+(?:duoc khong|duoc ko|dc ko|dc khong|duoc chu|nhe ban|nhe|nha|giup (?:minh|toi)|gium(?: (?:minh|toi))?|please|pls|plz|thanks))+[\s.!?]*$/u;
// "đi", "với", "nữa", "cảm ơn" also end content ("bữa trưa mang đi"): dropped
// only when the sentence adds nothing ("xoá cái X đi", "giúp mình với").
const LOOSE_TAIL = /(?:[\s,]+(?:di|voi|nua|giup|cam on))+[\s.!?]*$/u;
const INSERTS =
  /^(?:them|chen|bo sung|ghi them|add|insert|append|cho (?:minh|toi|em)|minh can|toi can)\b/u;
const HELP_AFTER_VERB = new RegExp(
  `^(${VERB}) (?:giup|gium)(?: (?:minh|toi))? `,
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
// Without ":" only the AI service knows where the section name ends (it has the
// Page); admission reads the words as data of one insertion.
// A place with nothing to add ("thêm vào phần Môn Sinh") stays refused: a list
// needs a comma, a paragraph at least 5 words after "vào".
const WRITE_INTO_LOOSE = /^ghi them vao ((?:\S+ ){4,}[^:\s]+)$/u;
const ADD_INTO_LOOSE = /^them vao ((?:phan|muc) [^:]+,[^:]+)$/u;
// P6: "thêm vào bảng Tasks dòng X (với trạng thái Done)" puts the table first.
const TABLE_FIRST =
  /^them vao bang (\S+(?: \S+)??) ((?:\d+ )?(?:dong|hang|tasks?|rows?|sach|cuon)\b.+)$/u;

function namesCount(rest: string): number {
  return rest
    .split(/\s*(?:,|\bva\b|\bvoi\b|\band\b)\s*/u)
    .filter((part) => part.trim()).length;
}

export function normalizeCommand(folded: string): string {
  let text = folded.replace(/\s+/gu, ' ').trim();
  for (let previous = ''; previous !== text; ) {
    previous = text;
    text = text.replace(LEAD, '').replace(TAIL, '');
    if (!INSERTS.test(text)) text = text.replace(LOOSE_TAIL, '');
  }
  text = text
    .replace(WANT, '')
    .replace(GIVE_ME, 'them ')
    .replace(HELP_AFTER_VERB, '$1 ')
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
    .replace(UNTICK_AFTER, 'bo tich $1')
    .replace(WRITE_INTO, 'them doan van $2 vao $1')
    .replace(NOTE, 'them ghi chu $1')
    .replace(TABLE_FIRST, (_all, table: string, rest: string) => {
      if (!rest.includes(':')) return `them ${rest} vao bang ${table}`;
      const [kind, items] = [
        rest.slice(0, rest.indexOf(':')),
        rest.slice(rest.indexOf(':') + 1),
      ];
      return `them ${kind.trim()} vao bang ${table}: ${items.trim()}`;
    })
    .replace(ADD_INTO, (_all, place: string, items: string) =>
      items.includes(',')
        ? `them checklist gom ${items} vao ${place}`
        : `them doan van ${items} vao ${place}`,
    )
    .replace(WRITE_INTO_LOOSE, 'them doan van $1')
    .replace(ADD_INTO_LOOSE, 'them checklist gom $1');
}
