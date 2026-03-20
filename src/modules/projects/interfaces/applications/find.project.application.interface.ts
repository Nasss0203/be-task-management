import { ProjectResponseDto } from '../../dto/reponse/project.response.dto';

export interface FindProjectApplication {
  findAllByWorkspaceId(workspaceId: string): Promise<ProjectResponseDto[]>;
}
