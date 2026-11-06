import { readFileSync } from 'fs';
import { join } from 'path';

import {
  isBareChecklistRequest,
  isSupportedModification,
} from './ai-modification-operation.policy';

/**
 * Kế hoạch mở ngữ pháp câu "thêm" (D6): the planner sentences of
 * ai-taskmanly/evaluation/generation_cases.jsonl must reach the AI service,
 * and the refused sentences must stay refused.
 */
interface AdmissionCase {
  id: string;
  text: string;
  why?: string;
}

const cases = JSON.parse(
  readFileSync(join(__dirname, 'ai-modification-admission.cases.json'), 'utf8'),
) as { admit: AdmissionCase[]; refuse: AdmissionCase[] };

describe('admission cases shared with the planner evaluation', () => {
  it.each(cases.admit.map((item) => [item.id, item.text]))(
    'admits %s: %s',
    (_id, text) => {
      expect(isSupportedModification(text)).toBe(true);
    },
  );

  it.each(cases.refuse.map((item) => [item.id, item.text]))(
    'refuses %s: %s',
    (_id, text) => {
      expect(isSupportedModification(text)).toBe(false);
    },
  );

  it('still asks for the items of a bare "thêm to-do"', () => {
    expect(isBareChecklistRequest('thêm to-do')).toBe(true);
    expect(isBareChecklistRequest('thêm checklist ôn tập môn Anh')).toBe(false);
  });
});
