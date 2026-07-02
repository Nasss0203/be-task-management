export const TASK_POSITION_CONTEXTS = [
  'kanban',
  'sprint',
  'backlog',
  'list',
] as const;

export type TaskPositionContext = (typeof TASK_POSITION_CONTEXTS)[number];
