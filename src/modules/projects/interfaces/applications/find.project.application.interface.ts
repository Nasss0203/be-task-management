import { ProjectResponseDto } from '../../dto/reponse/project.response.dto';
import { FindProjectFilter } from '../find-project-filter.type';

export interface FindProjectApplication {
  findAllByWorkspaceId(
    workspaceId: string,
    filter?: FindProjectFilter,
  ): Promise<ProjectResponseDto[]>;

  findDeletedProjects(workspaceId: string): Promise<ProjectResponseDto[]>;
}
