import { SprintResponseDto } from '../../dto/response/sprint.response.dto';
<<<<<<< HEAD
import { StartSprintDto } from '../../dto/start-sprint.dto';
=======
>>>>>>> admin

export type StartSprintApplicationInput = {
  workspaceId: string;
  projectId: string;
  sprintId: string;
  userId: string;
<<<<<<< HEAD
  dto: StartSprintDto;
=======
>>>>>>> admin
};

export interface StartSprintApplication {
  start(input: StartSprintApplicationInput): Promise<SprintResponseDto>;
}
