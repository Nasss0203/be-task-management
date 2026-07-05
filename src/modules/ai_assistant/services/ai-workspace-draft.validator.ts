import { AiWorkspaceDraft } from '../interfaces/types/ai-workspace-draft.type';

type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: string[] };

export function validateAiWorkspaceDraftOutput(
  value: unknown,
): ValidationResult<AiWorkspaceDraft> {
  const errors: string[] = [];

  if (!isRecord(value)) {
    return {
      success: false,
      errors: ['Workspace draft output must be an object'],
    };
  }

  const name = readString(value.name, 'name', 2, 180, errors);
  const slug = readSlug(value.slug, errors);

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      name,
      slug,
    },
  };
}

export function workspaceDraftToOutputData(
  draft: AiWorkspaceDraft,
): Record<string, unknown> {
  return {
    name: draft.name,
    slug: draft.slug,
  };
}

function readString(
  value: unknown,
  field: string,
  minLength: number,
  maxLength: number,
  errors: string[],
): string {
  if (typeof value !== 'string') {
    errors.push(`${field} must be a string`);
    return '';
  }

  const normalized = value.trim();

  if (normalized.length < minLength || normalized.length > maxLength) {
    errors.push(
      `${field} must be between ${minLength} and ${maxLength} characters`,
    );
  }

  return normalized;
}

function readSlug(value: unknown, errors: string[]): string {
  if (typeof value !== 'string') {
    errors.push('slug must be a string');
    return '';
  }

  const normalized = value.trim().toLowerCase();

  if (normalized.length < 2 || normalized.length > 50) {
    errors.push('slug must be between 2 and 50 characters');
  }

  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  if (!slugRegex.test(normalized)) {
    errors.push(
      'slug must contain only lowercase letters, numbers, and dashes without consecutive dashes',
    );
  }

  return normalized;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
