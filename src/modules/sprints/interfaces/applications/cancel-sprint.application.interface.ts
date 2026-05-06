import { SprintResponseDto } from '../../dto/response/sprint.response.dto';

export type CancelSprintApplicationInput = {
  workspaceId: string;
  projectId: string;
  sprintId: string;
};

export interface CancelSprintApplication {
  cancelSprint(input: CancelSprintApplicationInput): Promise<SprintResponseDto>;
}
