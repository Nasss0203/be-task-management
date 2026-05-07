import { SprintResponseDto } from '../../dto/response/sprint.response.dto';

export type GetSprintDetailApplicationInput = {
  workspaceId: string;
  projectId: string;
  sprintId: string;
};

export interface GetSprintDetailApplication {
  getSprintDetail(
    input: GetSprintDetailApplicationInput,
  ): Promise<SprintResponseDto>;
}
