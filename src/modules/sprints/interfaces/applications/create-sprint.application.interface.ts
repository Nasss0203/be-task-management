import { CreateSprintDto } from '../../dto/create-sprint.dto';
import { SprintResponseDto } from '../../dto/response/sprint.response.dto';

export type CreateSprintApplicationInput = {
  workspaceId: string;
  projectId: string;
  userId: string;
  dto: CreateSprintDto;
};

export interface CreateSprintApplication {
  create(input: CreateSprintApplicationInput): Promise<SprintResponseDto>;
}
