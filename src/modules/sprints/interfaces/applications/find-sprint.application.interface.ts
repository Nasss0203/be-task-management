import { SprintResponseDto } from '../../dto/response/sprint.response.dto';

export interface FindAllSprintApplicationInput {
  workspaceId: string;
  projectId: string;
  userId: string;
}

export interface FindSprintApplication {
  findAllSprintByProject(
    input: FindAllSprintApplicationInput,
  ): Promise<SprintResponseDto[]>;
}
