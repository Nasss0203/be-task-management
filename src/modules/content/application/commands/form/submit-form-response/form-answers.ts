import { BadRequestException } from '@nestjs/common';
import { PropertyType } from 'src/modules/database/domain/enums/property-type.enum';

export interface FormQuestion {
  propertyId: string;
  label: string;
  required: boolean;
  type: PropertyType;
  showWhen?: { propertyId: string; optionId: string } | null;
  optionIds?: string[];
  optionConditions?: {
    propertyId: string;
    options: Record<string, string>;
  } | null;
}

const MAX_TEXT_LENGTH = 5000;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isEmpty(value: unknown, type: PropertyType): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (type === PropertyType.CHECKBOX) return value !== true;
  if (type === PropertyType.DATE) {
    const start = (value as { start?: unknown }).start;
    return typeof start !== 'string' || start === '';
  }
  return false;
}

function isWebUrl(value: string): boolean {
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

function assertFormat(question: FormQuestion, value: unknown): void {
  const fail = (rule: string) => {
    throw new BadRequestException(`"${question.label}" ${rule}`);
  };

  switch (question.type) {
    case PropertyType.EMAIL:
      if (typeof value !== 'string' || !EMAIL.test(value.trim())) {
        fail('must be an email address');
      }
      return;
    case PropertyType.URL:
      if (typeof value !== 'string' || !isWebUrl(value.trim())) {
        fail('must be a web link');
      }
      return;
    case PropertyType.NUMBER:
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        fail('must be a number');
      }
      return;
    case PropertyType.TITLE:
    case PropertyType.TEXT:
    case PropertyType.PHONE:
      if (typeof value !== 'string' || value.length > MAX_TEXT_LENGTH) {
        fail(`must be text of at most ${MAX_TEXT_LENGTH} characters`);
      }
  }
}

export function cleanFormAnswers(
  questions: FormQuestion[],
  answers: Record<string, unknown>,
): Record<string, unknown> {
  const known = new Set(questions.map((question) => question.propertyId));
  if (Object.keys(answers).some((propertyId) => !known.has(propertyId))) {
    throw new BadRequestException('The answers include an unknown question');
  }

  const cleaned: Record<string, unknown> = {};
  const earlier = new Set<string>();

  for (const question of questions) {
    const condition = question.showWhen;
    // A condition on a later question can never be met, so it is ignored.
    const applies = condition && earlier.has(condition.propertyId);
    const optionRule = question.optionConditions;
    const optionRuleApplies = optionRule && earlier.has(optionRule.propertyId);
    earlier.add(question.propertyId);

    if (applies && cleaned[condition.propertyId] !== condition.optionId) {
      continue;
    }

    let value = answers[question.propertyId];

    if (optionRuleApplies) {
      const sourceAnswer = cleaned[optionRule.propertyId];
      const allowed = (question.optionIds ?? []).filter((id) =>
        [undefined, sourceAnswer].includes(optionRule.options[id]),
      );

      if (sourceAnswer === undefined || allowed.length === 0) continue;

      if (Array.isArray(value)) {
        value = value.filter((id) => allowed.includes(id as string));
      }
    }

    if (isEmpty(value, question.type)) {
      if (question.required) {
        throw new BadRequestException(`"${question.label}" is required`);
      }
      continue;
    }

    assertFormat(question, value);
    cleaned[question.propertyId] =
      typeof value === 'string' ? value.trim() : value;
  }

  return cleaned;
}
