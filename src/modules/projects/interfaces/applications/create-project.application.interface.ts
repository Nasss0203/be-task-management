import { CreateProjectDto } from '../../dto/create-project.dto';
import { ProjectResponseDto } from '../../dto/reponse/project.response.dto';

export interface CreateProjectApplication {
  create(
    createProjectDto: CreateProjectDto & { created_by?: string },
  ): Promise<ProjectResponseDto>;

  createProjectWithPageBlock(
    createProjectDto: CreateProjectDto & { created_by?: string },
  ): Promise<ProjectResponseDto>;
}
