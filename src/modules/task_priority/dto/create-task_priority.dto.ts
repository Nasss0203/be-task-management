export class CreateTaskPriorityDto {
  workspaceId: string;

  projectId: string;

  name: string;

  level: number;

  color: string | null;
}
