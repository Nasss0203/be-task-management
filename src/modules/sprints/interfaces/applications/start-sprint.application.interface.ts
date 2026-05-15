import { SprintResponseDto } from '../../dto/response/sprint.response.dto';
import { StartSprintDto } from '../../dto/start-sprint.dto';

export type StartSprintApplicationInput = {
  workspaceId: string;
  projectId: string;
  sprintId: string;
  userId: string;
  dto: StartSprintDto;
};

export interface StartSprintApplication {
  start(input: StartSprintApplicationInput): Promise<SprintResponseDto>;
}
