import { SprintResponseDto } from '../../dto/response/sprint.response.dto';

export type UpdateSprintApplicationInput = {
  sprintId: string;
  workspaceId: string;
  projectId: string;

  name?: string;
  goal?: string | null;
  startAt?: Date | null;
  endAt?: Date | null;
};

export interface UpdateSprintApplication {
  updateSprint(input: UpdateSprintApplicationInput): Promise<SprintResponseDto>;
}
