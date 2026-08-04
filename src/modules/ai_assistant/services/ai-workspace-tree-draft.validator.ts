import { AiWorkspaceTreeDraft } from '../interfaces/types/ai-workspace-tree-draft.type';
import { AiProjectDraftVisibility } from '../interfaces/types/ai-project-draft.type';
import { AiTaskDraftPriority } from '../interfaces/types/ai-task-draft.type';

type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: string[] };

export const MAX_TOTAL_ENTITIES = 30;

export function validateAiWorkspaceTreeDraftOutput(
  value: unknown,
): ValidationResult<AiWorkspaceTreeDraft> {
  const errors: string[] = [];

  if (!isRecord(value)) {
    return {
      success: false,
      errors: ['Workspace tree draft output must be an object'],
    };
  }

  if (!Array.isArray(value.workspaces)) {
    return {
      success: false,
      errors: ['workspaces must be an array'],
    };
  }

  const workspaces: any[] = [];
  let totalEntities = 0;

  totalEntities += value.workspaces.length;

  for (let wIndex = 0; wIndex < value.workspaces.length; wIndex++) {
    const ws = value.workspaces[wIndex];
    if (!isRecord(ws)) {
      errors.push(`workspaces[${wIndex}] must be an object`);
      continue;
    }

    const name = readString(
      ws.name,
      `workspaces[${wIndex}].name`,
      2,
      180,
      errors,
    );
    const slug = readSlug(ws.slug, wIndex, errors);

    if (!Array.isArray(ws.projects)) {
      errors.push(`workspaces[${wIndex}].projects must be an array`);
      continue;
    }

    totalEntities += ws.projects.length;

    const projects: any[] = [];
    for (let pIndex = 0; pIndex < ws.projects.length; pIndex++) {
      const proj = ws.projects[pIndex];
      if (!isRecord(proj)) {
        errors.push(
          `workspaces[${wIndex}].projects[${pIndex}] must be an object`,
        );
        continue;
      }

      const pName = readString(
        proj.name,
        `workspaces[${wIndex}].projects[${pIndex}].name`,
        2,
        180,
        errors,
      );
      const pKey = readString(
        proj.key,
        `workspaces[${wIndex}].projects[${pIndex}].key`,
        2,
        10,
        errors,
      ).toUpperCase();
      const pVisibility = readVisibility(
        proj.visibility,
        wIndex,
        pIndex,
        errors,
      );
      const pDescription = readString(
        proj.description,
        `workspaces[${wIndex}].projects[${pIndex}].description`,
        10,
        1000,
        errors,
      );

      if (!Array.isArray(proj.tasks)) {
        errors.push(
          `workspaces[${wIndex}].projects[${pIndex}].tasks must be an array`,
        );
        continue;
      }

      totalEntities += proj.tasks.length;

      const tasks: any[] = [];
      for (let tIndex = 0; tIndex < proj.tasks.length; tIndex++) {
        const task = proj.tasks[tIndex];
        if (!isRecord(task)) {
          errors.push(
            `workspaces[${wIndex}].projects[${pIndex}].tasks[${tIndex}] must be an object`,
          );
          continue;
        }

        const tTitle = readString(
          task.title,
          `workspaces[${wIndex}].projects[${pIndex}].tasks[${tIndex}].title`,
          3,
          180,
          errors,
        );
        const tDescription = readString(
          task.description,
          `workspaces[${wIndex}].projects[${pIndex}].tasks[${tIndex}].description`,
          10,
          4000,
          errors,
        );
        const tPriority = readPriority(
          task.priority,
          wIndex,
          pIndex,
          tIndex,
          errors,
        );
        const tEstimatedHours = readInteger(
          task.estimatedHours,
          `workspaces[${wIndex}].projects[${pIndex}].tasks[${tIndex}].estimatedHours`,
          1,
          160,
          errors,
        );

        tasks.push({
          title: tTitle,
          description: tDescription,
          priority: tPriority,
          estimatedHours: tEstimatedHours,
        });
      }

      projects.push({
        name: pName,
        key: pKey,
        visibility: pVisibility,
        description: pDescription,
        tasks,
      });
    }

    workspaces.push({
      name,
      slug,
      projects,
    });
  }

  // Backend total entities check
  if (totalEntities > MAX_TOTAL_ENTITIES) {
    errors.push(
      `Total entities in workspace tree draft exceeds limit of ${MAX_TOTAL_ENTITIES} (got ${totalEntities})`,
    );
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      workspaces,
    },
  };
}

export function workspaceTreeDraftToOutputData(
  draft: AiWorkspaceTreeDraft,
): Record<string, unknown> {
  return {
    workspaces: draft.workspaces.map((ws) => ({
      name: ws.name,
      slug: ws.slug,
      projects: ws.projects.map((proj) => ({
        name: proj.name,
        key: proj.key,
        visibility: proj.visibility,
        description: proj.description,
        tasks: proj.tasks.map((task) => ({
          title: task.title,
          description: task.description,
          priority: task.priority,
          estimatedHours: task.estimatedHours,
        })),
      })),
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

function readSlug(value: unknown, index: number, errors: string[]): string {
  if (typeof value !== 'string') {
    errors.push(`workspaces[${index}].slug must be a string`);
    return '';
  }

  const normalized = value.trim().toLowerCase();

  if (normalized.length < 2 || normalized.length > 50) {
    errors.push(
      `workspaces[${index}].slug must be between 2 and 50 characters`,
    );
  }

  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  if (!slugRegex.test(normalized)) {
    errors.push(
      `workspaces[${index}].slug must contain only lowercase letters, numbers, and dashes without consecutive dashes`,
    );
  }

  return normalized;
}

function readVisibility(
  value: unknown,
  wIndex: number,
  pIndex: number,
  errors: string[],
): AiProjectDraftVisibility {
  const allowed: AiProjectDraftVisibility[] = ['PRIVATE', 'INTERNAL'];

  if (typeof value !== 'string' || !allowed.includes(value as any)) {
    errors.push(
      `workspaces[${wIndex}].projects[${pIndex}].visibility must be PRIVATE or INTERNAL`,
    );
    return 'PRIVATE';
  }

  return value as AiProjectDraftVisibility;
}

function readPriority(
  value: unknown,
  wIndex: number,
  pIndex: number,
  tIndex: number,
  errors: string[],
): AiTaskDraftPriority {
  const allowed: AiTaskDraftPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

  if (typeof value !== 'string' || !allowed.includes(value as any)) {
    errors.push(
      `workspaces[${wIndex}].projects[${pIndex}].tasks[${tIndex}].priority must be LOW, MEDIUM, HIGH, or URGENT`,
    );
    return 'MEDIUM';
  }

  return value as AiTaskDraftPriority;
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
