export type AiExecutionContext = {
  workspaceId?: string | null;
  projectId?: string | null;
  boardId?: string | null;
  sprintId?: string | null;
  metadata?: Record<string, unknown> | null;
};
