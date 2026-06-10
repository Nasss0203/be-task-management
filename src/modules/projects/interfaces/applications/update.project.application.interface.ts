import { UpdateProjectDto } from '../../dto/update-project.dto';
import { ProjectModel } from '../../domain/models/projects.model';

export interface UpdateProjectApplication {
  execute(
    projectId: string,
    workspaceId: string,
    updateProjectDto: UpdateProjectDto,
  ): Promise<ProjectModel>;
}
