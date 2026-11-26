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
) as {
  admit: AdmissionCase[];
  refuse: AdmissionCase[];
  admit_natural: AdmissionCase[];
  refuse_natural: AdmissionCase[];
  admit_content: AdmissionCase[];
  refuse_content: AdmissionCase[];
  admit_place: AdmissionCase[];
  refuse_place: AdmissionCase[];
};

// Kế hoạch câu tự nhiên: the Page name is a real Page (M1b).
const PAGE_NAMES = ['Hội họp tuần'];

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

  it.each(cases.admit_natural.map((item) => [item.id, item.text]))(
    'admits natural %s: %s',
    (_id, text) => {
      expect(isSupportedModification(text, PAGE_NAMES)).toBe(true);
    },
  );

  it.each(cases.refuse_natural.map((item) => [item.id, item.text]))(
    'refuses natural %s: %s',
    (_id, text) => {
      expect(isSupportedModification(text, PAGE_NAMES)).toBe(false);
    },
  );

  it.each(cases.admit_content.map((item) => [item.id, item.text]))(
    'admits content %s: %s',
    (_id, text) => {
      expect(isSupportedModification(text, PAGE_NAMES)).toBe(true);
    },
  );

  it.each(cases.refuse_content.map((item) => [item.id, item.text]))(
    'refuses content %s: %s',
    (_id, text) => {
      expect(isSupportedModification(text, PAGE_NAMES)).toBe(false);
    },
  );

  it.each(cases.admit_place.map((item) => [item.id, item.text]))(
    'admits place %s: %s',
    (_id, text) => {
      expect(isSupportedModification(text, PAGE_NAMES)).toBe(true);
    },
  );

  it.each(cases.refuse_place.map((item) => [item.id, item.text]))(
    'refuses place %s: %s',
    (_id, text) => {
      expect(isSupportedModification(text, PAGE_NAMES)).toBe(false);
    },
  );

  it('still asks for the items of a bare "thêm to-do"', () => {
    expect(isBareChecklistRequest('thêm to-do')).toBe(true);
    expect(isBareChecklistRequest('thêm checklist ôn tập môn Anh')).toBe(false);
  });
});
