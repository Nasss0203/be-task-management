import { SprintResponseDto } from '../../dto/response/sprint.response.dto';

export interface FindAllSprintApplicationInput {
  workspaceId: string;
  projectId: string;
  userId: string;
}

export interface FindTasksBySprintApplicationInput {
  workspaceId: string;
  projectId: string;
  sprintId: string;
  userId: string;
}

export interface FindSprintApplication {
  findAllSprintByProject(
    input: FindAllSprintApplicationInput,
  ): Promise<SprintResponseDto[]>;

  findTasksBySprint(
    input: FindTasksBySprintApplicationInput,
  ): Promise<SprintResponseDto>;
}
