import { SprintStatus } from '../../domain/entities/sprint.entity';
import { SprintResponseDto } from '../../dto/response/sprint.response.dto';
import { SprintProgressResponseDto } from '../../dto/sprint-progress.response.dto';

export interface FindAllSprintApplicationInput {
  workspaceId: string;
  projectId: string;
  userId: string;
  keyword?: string;
  status?: SprintStatus;
  from?: string;
  to?: string;
}

export interface FindTasksBySprintApplicationInput {
  workspaceId: string;
  projectId: string;
  sprintId: string;
  userId: string;
}

export interface GetSprintProgressApplicationInput {
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

  getSprintProgress(
    input: GetSprintProgressApplicationInput,
  ): Promise<SprintProgressResponseDto>;
}
