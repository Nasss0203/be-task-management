import {
  AiTaskDraft,
  AiTaskDraftItem,
  AiTaskDraftPriority,
  AiTaskDraftSubtask,
} from '../interfaces/types/ai-task-draft.type';

type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: string[] };

const TASK_DRAFT_PRIORITIES: AiTaskDraftPriority[] = [
  'LOW',
  'MEDIUM',
  'HIGH',
  'URGENT',
];

const FORBIDDEN_OUTPUT_KEYS = [
  'id',
  'assignee',
  'assigneeId',
  'dueDate',
  'deadline',
  'workspaceId',
  'projectId',
  'boardId',
  'sprintId',
];

export function validateAiTaskDraftOutput(
  value: unknown,
): ValidationResult<AiTaskDraft> {
  const errors: string[] = [];

  if (!isRecord(value)) {
    return {
      success: false,
      errors: ['Task draft output must be an object'],
    };
  }

  if (!Array.isArray(value.tasks)) {
    return {
      success: false,
      errors: ['tasks must be an array'],
    };
  }

  const tasks: AiTaskDraftItem[] = [];

  // Limit max tasks generated to 30
  if (value.tasks.length > 30) {
    errors.push('Total tasks in task draft exceeds limit of 30');
  }

  for (let index = 0; index < value.tasks.length; index++) {
    const item = value.tasks[index];
    if (!isRecord(item)) {
      errors.push(`tasks[${index}] must be an object`);
      continue;
    }

    collectForbiddenKeys(item, `tasks[${index}]`, errors);

    const title = readString(item.title, `tasks[${index}].title`, 3, 180, errors);
    const description = readString(
      item.description,
      `tasks[${index}].description`,
      10,
      4000,
      errors,
    );
    const priority = readPriority(item.priority, errors);
    const estimatedHours = readInteger(
      item.estimatedHours,
      `tasks[${index}].estimatedHours`,
      1,
      160,
      errors,
    );
    const subtasks = readSubtasks(item.subtasks, errors);
    const acceptanceCriteria = readStringArray(
      item.acceptanceCriteria,
      `tasks[${index}].acceptanceCriteria`,
      1,
      8,
      3,
      500,
      errors,
    );
    const risks = readStringArray(
      item.risks,
      `tasks[${index}].risks`,
      0,
      5,
      3,
      500,
      errors,
    );

    tasks.push({
      title,
      description,
      priority,
      estimatedHours,
      subtasks,
      acceptanceCriteria,
      risks,
    });
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      tasks,
    },
  };
}

export function taskDraftToOutputData(
  taskDraft: AiTaskDraft,
): Record<string, unknown> {
  return {
    tasks: taskDraft.tasks.map((task) => ({
      title: task.title,
      description: task.description,
      priority: task.priority,
      estimatedHours: task.estimatedHours,
      subtasks: task.subtasks.map((subtask) => ({
        title: subtask.title,
        description: subtask.description,
        estimatedHours: subtask.estimatedHours,
      })),
      acceptanceCriteria: [...task.acceptanceCriteria],
      risks: [...task.risks],
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

function readPriority(value: unknown, errors: string[]): AiTaskDraftPriority {
  if (
    typeof value !== 'string' ||
    !TASK_DRAFT_PRIORITIES.includes(value as AiTaskDraftPriority)
  ) {
    errors.push('priority must be LOW, MEDIUM, HIGH, or URGENT');
    return 'MEDIUM';
  }

  return value as AiTaskDraftPriority;
}

function readInteger(
  value: unknown,
  field: string,
  minimum: number,
  maximum: number,
  errors: string[],
): number {
  let parsedValue: number;

  if (typeof value === 'number') {
    parsedValue = Math.round(value);
  } else if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    parsedValue = isNaN(parsed) ? minimum : parsed;
  } else {
    parsedValue = minimum;
  }

  if (parsedValue < minimum) return minimum;
  if (parsedValue > maximum) return maximum;

  return parsedValue;
}

function readSubtasks(value: unknown, errors: string[]): AiTaskDraftSubtask[] {
  if (!Array.isArray(value)) {
    errors.push('subtasks must be an array');
    return [];
  }

  if (value.length < 1 || value.length > 8) {
    errors.push('subtasks must have 1 to 8 items');
  }

  return value.map((item, index) => {
    if (!isRecord(item)) {
      errors.push(`subtasks.${index} must be an object`);
      return {
        title: '',
        description: '',
        estimatedHours: 1,
      };
    }

    collectForbiddenKeys(item, `subtasks.${index}`, errors);

    return {
      title: readString(item.title, `subtasks.${index}.title`, 3, 180, errors),
      description: readString(
        item.description,
        `subtasks.${index}.description`,
        10,
        1000,
        errors,
      ),
      estimatedHours: readInteger(
        item.estimatedHours,
        `subtasks.${index}.estimatedHours`,
        1,
        160,
        errors,
      ),
    };
  });
}

function readStringArray(
  value: unknown,
  field: string,
  minItems: number,
  maxItems: number,
  minLength: number,
  maxLength: number,
  errors: string[],
): string[] {
  if (!Array.isArray(value)) {
    errors.push(`${field} must be an array`);
    return [];
  }

  if (value.length < minItems || value.length > maxItems) {
    errors.push(`${field} must have ${minItems} to ${maxItems} items`);
  }

  return value.map((item, index) =>
    readString(item, `${field}.${index}`, minLength, maxLength, errors),
  );
}

function collectForbiddenKeys(
  value: Record<string, unknown>,
  path: string,
  errors: string[],
): void {
  const forbiddenKeys = new Set(
    FORBIDDEN_OUTPUT_KEYS.map((key) => key.toLowerCase()),
  );

  for (const key of Object.keys(value)) {
    if (forbiddenKeys.has(key.toLowerCase())) {
      errors.push(`${path}.${key} is not allowed in AI task draft output`);
    }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
