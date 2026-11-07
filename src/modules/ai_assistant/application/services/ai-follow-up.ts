import { foldInstruction } from './ai-instruction-evidence';
import { normalizeCommand } from './ai-sentence-normalize';

/**
 * Kế hoạch chat nhiều lượt — hiểu câu nhắc lại lượt trước (M2, M3).
 *
 * "xoá nó đi", "sửa cái vừa thêm thành Gọi khách hàng", "đổi lại như cũ": the
 * words name the previous turn of the same PAGE conversation, never a block of
 * their own. The sentence is resolved here into an explicit one ("xoá \"Gọi
 * khách\"") that then goes through every check a typed sentence does
 * (admission, K0, planner, review of the draft). Only the latest turn counts
 * (DM3); anything unsure is asked back.
 */
export type FollowUpVerb =
  | 'DELETE'
  | 'EDIT'
  | 'TICK'
  | 'UNTICK'
  | 'UNDO'
  | 'MORE'
  | 'DISCARD';

export interface FollowUp {
  verb: FollowUpVerb;
  /** EDIT: the new text, in the user's own words. */
  newText?: string;
}

const PRONOUN =
  // "cái" may already be gone: normalizeCommand reads "xoá cái A" as "xoá A".
  '(?:no|chung|chung no|(?:cai )?do|(?:cai )?nay|(?:cai )?vua (?:them|sua|tao|roi)|may cai do|may cai vua them|cac cai do|cac cai vua them|it|them|that|that one|those)';

const PATTERNS: [FollowUpVerb, RegExp][] = [
  ['UNTICK', new RegExp(`^(?:bo tich|bo danh dau|uncheck) ${PRONOUN}$`, 'u')],
  [
    'TICK',
    new RegExp(
      `^(?:tich|danh dau|check|mark)(?: xong)? ${PRONOUN}(?: (?:xong|la xong|da xong|done|as done))?$`,
      'u',
    ),
  ],
  [
    'DELETE',
    new RegExp(`^(?:xoa|bo|go|delete|remove)(?: bo)?(?: ${PRONOUN})?$`, 'u'),
  ],
  [
    'EDIT',
    new RegExp(
      `^(?:sua|doi|thay|change|edit|rename) ${PRONOUN} (?:thanh|sang|to) .+$`,
      'u',
    ),
  ],
  [
    'UNDO',
    /^(?:(?:doi|tra|lam|quay|de) lai nhu cu|hoan tac|undo|quay lai|revert)$/u,
  ],
  [
    'MORE',
    /^(?:them|add)(?: (?:\d+|mot vai|vai|mot it|mot so|some))?(?: (?:viec|cai|to-do|todo|dong|muc|items?|tasks?))? (?:nua|more|khac)(?: di)?$/u,
  ],
  [
    'DISCARD',
    /^(?:thoi|thoi khoi|khong can nua|khong can|huy|huy ban nhap|bo ban nhap|cancel|never mind)$/u,
  ],
];

const NEW_TEXT = /\s(?:thành|thanh|sang|to)\s+(.+)$/iu;

export function detectFollowUp(instruction: string): FollowUp | null {
  const folded = normalizeCommand(
    foldInstruction(instruction)
      .toLowerCase()
      .replace(/[.!?]+$/u, ''),
  );
  for (const [verb, pattern] of PATTERNS) {
    if (!pattern.test(folded)) continue;
    if (verb !== 'EDIT') return { verb };
    const newText = NEW_TEXT.exec(
      instruction.trim().replace(/[.!]+$/u, ''),
    )?.[1]
      ?.replace(/^["'“”‘’]+|["'“”‘’]+$/gu, '')
      .trim();
    return newText ? { verb, newText } : null;
  }
  return null;
}

/** One operation of the previous draft, as stored in its output data. */
interface PlanOperation {
  type: string;
  blockId?: string;
  text?: string;
  oldText?: string;
  newText?: string;
  checked?: boolean;
  blocks?: { type?: string; content?: { text?: string } }[];
}

export interface PreviousTurn {
  generationId: string;
  /** PENDING: a draft not applied yet; APPLIED; OTHER: discarded / failed. */
  state: 'PENDING' | 'APPLIED' | 'OTHER';
  instruction: string;
  summary: string;
  operations: PlanOperation[];
  appliedAt: Date | null;
}

export interface PageBlockView {
  id: string;
  type: string;
  text: string;
  createdAt: Date;
}

export type FollowUpResolution =
  | {
      kind: 'SENTENCE';
      instruction: string;
      understood: string;
      /** DM1: the pending draft the new one replaces. */
      replaces?: string;
    }
  | { kind: 'DISCARD'; generationId: string; message: string }
  | { kind: 'ASK'; message: string };

const ASK_WHICH =
  'Mình chưa biết "nó" là block nào. Hãy ghi rõ tên block, ví dụ: xoá to-do Gọi khách.';
// Blocks created by one Apply share its moment (as Undo reads deleted blocks).
const APPLY_TOLERANCE_MS = 60_000;

const quote = (text: string): string => `"${text.replace(/"/gu, '')}"`;
const listed = (texts: string[]): string => texts.map(quote).join(' và ');

/** Blocks the previous turn now stands for on the Page, with their kind. */
function targets(
  turn: PreviousTurn,
  blocks: PageBlockView[],
): { id: string; type: string; text: string }[] | null {
  const found: { id: string; type: string; text: string }[] = [];
  for (const operation of turn.operations) {
    if (operation.type === 'INSERT_BLOCKS') {
      for (const inserted of operation.blocks ?? []) {
        const text = inserted.content?.text?.trim();
        if (!text || !turn.appliedAt) return null;
        const at = turn.appliedAt.getTime();
        const match = blocks.find(
          (block) =>
            block.text.trim() === text &&
            !found.some((item) => item.id === block.id) &&
            block.createdAt.getTime() >= at - APPLY_TOLERANCE_MS &&
            block.createdAt.getTime() <= at + 5_000,
        );
        if (!match) return null; // edited or removed by hand since
        found.push(match);
      }
    } else if (
      operation.type === 'SET_BLOCK_TEXT' ||
      operation.type === 'SET_TODO_CHECKED'
    ) {
      const block = blocks.find((item) => item.id === operation.blockId);
      if (!block) return null;
      found.push(block);
    } else {
      return null; // rows, deletes: not "it" on the Page
    }
  }
  return found.length ? found : null;
}

export function resolveFollowUp(
  followUp: FollowUp,
  turn: PreviousTurn | null,
  blocks: PageBlockView[],
): FollowUpResolution {
  if (followUp.verb === 'MORE') {
    const texts = (turn?.operations ?? [])
      .flatMap((operation) => operation.blocks ?? [])
      .map((block) => block.content?.text)
      .filter((text): text is string => !!text);
    const example = texts.length
      ? ` Lượt trước đã thêm: ${texts.slice(0, 3).join(', ')}.`
      : '';
    return {
      kind: 'ASK',
      message: `Bạn muốn thêm việc gì? Hãy ghi rõ, ví dụ: thêm to-do Gửi báo cáo.${example}`,
    };
  }
  if (!turn || turn.state === 'OTHER')
    return { kind: 'ASK', message: ASK_WHICH };

  // DM1: a draft not applied yet is changed or dropped, the Page is not touched.
  if (turn.state === 'PENDING') {
    if (followUp.verb === 'DELETE' || followUp.verb === 'DISCARD')
      return {
        kind: 'DISCARD',
        generationId: turn.generationId,
        message: `Đã bỏ bản nháp: ${turn.summary}`,
      };
    if (followUp.verb === 'EDIT' && followUp.newText) {
      const inserted = turn.operations
        .filter((operation) => operation.type === 'INSERT_BLOCKS')
        .flatMap((operation) => operation.blocks ?? [])
        .map((block) => block.content?.text?.trim())
        .filter((text): text is string => !!text);
      const old = inserted.length === 1 ? inserted[0] : null;
      const at = old
        ? turn.instruction.toLowerCase().indexOf(old.toLowerCase())
        : -1;
      if (old && at >= 0)
        return {
          kind: 'SENTENCE',
          instruction:
            turn.instruction.slice(0, at) +
            followUp.newText +
            turn.instruction.slice(at + old.length),
          understood: old,
          replaces: turn.generationId,
        };
    }
    return {
      kind: 'ASK',
      message:
        'Bản nháp trước chưa được áp dụng. Hãy bấm Apply trước, hoặc ghi rõ việc cần làm.',
    };
  }

  // APPLIED.
  if (followUp.verb === 'DISCARD') return { kind: 'ASK', message: ASK_WHICH };
  const deletes = turn.operations.filter(
    (operation) => operation.type === 'DELETE_BLOCK',
  );
  if (followUp.verb === 'UNDO' && deletes.length) {
    return {
      kind: 'ASK',
      message:
        'Để khôi phục các block vừa xoá, hãy bấm Hoàn tác (Undo) ở bản nháp vừa áp dụng.',
    };
  }
  const found = targets(turn, blocks);
  if (!found) return { kind: 'ASK', message: ASK_WHICH };
  const texts = found.map((block) => block.text);
  const understood = texts.join(', ');

  switch (followUp.verb) {
    case 'DELETE':
      return {
        kind: 'SENTENCE',
        instruction: `xoá ${listed(texts)}`,
        understood,
      };
    case 'EDIT':
      if (found.length !== 1 || !followUp.newText)
        return {
          kind: 'ASK',
          message: `Lượt trước có ${found.length} block (${understood}). Bạn muốn sửa block nào?`,
        };
      return {
        kind: 'SENTENCE',
        instruction: `sửa ${quote(texts[0])} thành ${quote(followUp.newText)}`,
        understood,
      };
    case 'TICK':
    case 'UNTICK': {
      if (found.some((block) => block.type !== 'TODO'))
        return { kind: 'ASK', message: 'Chỉ tích / bỏ tích được to-do.' };
      const verb = followUp.verb === 'TICK' ? 'tích' : 'bỏ tích';
      return {
        kind: 'SENTENCE',
        instruction: `${verb} ${listed(texts)}`,
        understood,
      };
    }
    case 'UNDO': {
      // DM4: a draft doing the opposite, for the user to review.
      const operation = turn.operations[0];
      if (turn.operations.every((op) => op.type === 'INSERT_BLOCKS'))
        return {
          kind: 'SENTENCE',
          instruction: `xoá ${listed(texts)}`,
          understood,
        };
      if (
        turn.operations.length === 1 &&
        operation.type === 'SET_BLOCK_TEXT' &&
        operation.oldText
      )
        return {
          kind: 'SENTENCE',
          instruction: `sửa ${quote(texts[0])} thành ${quote(operation.oldText)}`,
          understood,
        };
      if (turn.operations.every((op) => op.type === 'SET_TODO_CHECKED')) {
        const checked = turn.operations[0].checked;
        return {
          kind: 'SENTENCE',
          instruction: `${checked ? 'bỏ tích' : 'tích'} ${listed(texts)}`,
          understood,
        };
      }
      return { kind: 'ASK', message: ASK_WHICH };
    }
    default:
      return { kind: 'ASK', message: ASK_WHICH };
  }
}
