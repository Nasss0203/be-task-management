import { CreateProjectDto } from '../../dto/create-project.dto';
import { ProjectResponseDto } from '../../dto/reponse/project.response.dto';

export interface CreateProjectApplication {
  create(createProjectDto: CreateProjectDto): Promise<ProjectResponseDto>;
}
