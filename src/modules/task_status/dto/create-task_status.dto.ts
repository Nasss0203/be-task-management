export class CreateTaskStatusDto {
  workspaceId: string;

  projectId: string;

  name: string;

  position: number;

  color: string | null;

  isDone: boolean;
}
