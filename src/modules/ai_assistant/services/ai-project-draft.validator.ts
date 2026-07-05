import {
  AiProjectDraft,
  AiProjectDraftVisibility,
} from '../interfaces/types/ai-project-draft.type';

type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: string[] };

const PROJECT_VISIBILITIES: AiProjectDraftVisibility[] = [
  'PRIVATE',
  'INTERNAL',
];

export function validateAiProjectDraftOutput(
  value: unknown,
): ValidationResult<AiProjectDraft> {
  const errors: string[] = [];

  if (!isRecord(value)) {
    return {
      success: false,
      errors: ['Project draft output must be an object'],
    };
  }

  const name = readString(value.name, 'name', 2, 180, errors);
  const key = readKey(value.key, errors);
  const visibility = readVisibility(value.visibility, errors);
  const description = readString(
    value.description,
    'description',
    10,
    1000,
    errors,
  );

  let tasks: any[] | undefined = undefined;
  if (value.tasks !== undefined) {
    if (!Array.isArray(value.tasks)) {
      errors.push('tasks must be an array');
    } else {
      tasks = [];
      for (let tIndex = 0; tIndex < value.tasks.length; tIndex++) {
        const task = value.tasks[tIndex];
        if (!isRecord(task)) {
          errors.push(`tasks[${tIndex}] must be an object`);
          continue;
        }

        const tTitle = readString(task.title, `tasks[${tIndex}].title`, 3, 180, errors);
        const tDescription = readString(task.description, `tasks[${tIndex}].description`, 10, 4000, errors);
        const tPriority = readPriority(task.priority, tIndex, errors);
        const tEstimatedHours = readInteger(task.estimatedHours, `tasks[${tIndex}].estimatedHours`, 1, 160, errors);

        tasks.push({
          title: tTitle,
          description: tDescription,
          priority: tPriority,
          estimatedHours: tEstimatedHours,
        });
      }
    }
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      name,
      key,
      visibility,
      description,
      tasks,
    },
  };
}

export function projectDraftToOutputData(
  draft: AiProjectDraft,
): Record<string, unknown> {
  return {
    name: draft.name,
    key: draft.key,
    visibility: draft.visibility,
    description: draft.description,
    tasks: draft.tasks?.map((task) => ({
      title: task.title,
      description: task.description,
      priority: task.priority,
      estimatedHours: task.estimatedHours,
    })),
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

function readKey(value: unknown, errors: string[]): string {
  if (typeof value !== 'string') {
    errors.push('key must be a string');
    return '';
  }

  const normalized = value.trim().toUpperCase();

  if (normalized.length < 2 || normalized.length > 10) {
    errors.push('key must be between 2 and 10 characters');
  }

  const keyRegex = /^[A-Z][A-Z0-9]*$/;
  if (!keyRegex.test(normalized)) {
    errors.push(
      'key must start with a letter and contain only letters and numbers',
    );
  }

  return normalized;
}

function readVisibility(
  value: unknown,
  errors: string[],
): AiProjectDraftVisibility {
  if (
    typeof value !== 'string' ||
    !PROJECT_VISIBILITIES.includes(value as AiProjectDraftVisibility)
  ) {
    errors.push('visibility must be PRIVATE or INTERNAL');
    return 'PRIVATE';
  }

  return value as AiProjectDraftVisibility;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readPriority(
  value: unknown,
  tIndex: number,
  errors: string[],
): 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' {
  const allowed: Array<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'> = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

  if (typeof value !== 'string' || !allowed.includes(value as any)) {
    errors.push(
      `tasks[${tIndex}].priority must be LOW, MEDIUM, HIGH, or URGENT`,
    );
    return 'MEDIUM';
  }

  return value as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}

function readInteger(
  value: unknown,
  field: string,
  min: number,
  max: number,
  errors: string[],
): number {
  let parsedValue: number;

  if (typeof value === 'number') {
    parsedValue = Math.round(value);
  } else if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    parsedValue = isNaN(parsed) ? min : parsed;
  } else {
    parsedValue = min;
  }

  if (parsedValue < min) return min;
  if (parsedValue > max) return max;

  return parsedValue;
}
