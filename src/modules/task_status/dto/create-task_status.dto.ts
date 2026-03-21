export class CreateTaskStatusDto {
  workspaceId: string;

  projectId: string;

  boardId: string;

  name: string;

  position: number;

  color: string | null;

  isDone: boolean;
}
