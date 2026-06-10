import { UpdateProjectDto } from '../../dto/update-project.dto';

export interface UpdateProjectRepository {
  update(
    projectId: string,
    workspaceId: string,
    updateProjectDto: UpdateProjectDto,
  ): Promise<void>;
}
