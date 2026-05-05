import { SprintResponseDto } from '../../dto/response/sprint.response.dto';

export type StartSprintApplicationInput = {
  workspaceId: string;
  projectId: string;
  sprintId: string;
  userId: string;
};

export interface StartSprintApplication {
  start(input: StartSprintApplicationInput): Promise<SprintResponseDto>;
}
