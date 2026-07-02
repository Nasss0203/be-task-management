import { EntityManager } from 'typeorm';
import { ProjectModel } from '../../domain/models/projects.model';
import { CreateProjectDto } from '../../dto/create-project.dto';

export interface CreateProjectService {
  create(
    createProjectDto: CreateProjectDto & { created_by?: string },
    manager?: EntityManager,
  ): Promise<ProjectModel>;

  createProjectWithPageBlock(
    createProjectDto: CreateProjectDto & { created_by?: string },
    manager?: EntityManager,
  ): Promise<ProjectModel>;
}
