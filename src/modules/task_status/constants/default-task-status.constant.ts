export const DEFAULT_TASK_STATUSES = [
  {
    name: 'Todo',
    position: 0,
    color: '#94A3B8',
    isDone: false,
  },
  {
    name: 'In Progress',
    position: 1,
    color: '#3B82F6',
    isDone: false,
  },
  {
    name: 'Done',
    position: 2,
    color: '#22C55E',
    isDone: true,
  },
] as const;
