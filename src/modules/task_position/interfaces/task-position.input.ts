import type { TaskPositionContext } from '../constants/task-position-context.constant';

export interface PositionContextRef {
  context: TaskPositionContext;
  contextId: string;
}

export interface TaskPositionRef extends PositionContextRef {
  taskId: string;
}

export interface CreateTaskPositionRecordInput extends TaskPositionRef {
  position: string;
}

export interface CreateTaskPositionAtEndInput extends TaskPositionRef {}

export interface ReorderTaskPositionInput extends TaskPositionRef {
  previousTaskId: string | null;
  nextTaskId: string | null;
}

export interface RemoveTaskPositionInput extends TaskPositionRef {}

export interface NormalizeTaskPositionContextInput extends PositionContextRef {}

export interface InitializeTaskPositionsInput extends PositionContextRef {
  taskIds: string[];
}

export interface MoveKanbanTaskInput {
  taskId: string;
  sourceKanbanContextId: string;
  targetKanbanContextId: string;
  targetSprintId: string | null;
  targetStatusId: string;
  previousTaskId: string | null;
  nextTaskId: string | null;
}

export interface AddTasksToSprintInput {
  taskIds: string[];
  targetSprintId: string;
  targetStatusId: string;
  targetKanbanContextId: string;
}
