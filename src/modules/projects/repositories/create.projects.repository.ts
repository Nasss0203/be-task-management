import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Project } from '../domain/entities/project.entity';
import { ProjectModel } from '../domain/models/projects.model';
import {
  CreateProjectRepository,
  SaveProjectInput,
} from '../interfaces/repositories/create.project.repository.interface';
import { ProjectMapper } from '../mapper/projects.mapper';

@Injectable()
export class CreateProjectRepositoryImpl implements CreateProjectRepository {
  constructor(
    @InjectRepository(Project)
    private readonly repo: Repository<Project>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<Project> {
    return manager ? manager.getRepository(Project) : this.repo;
  }
  async save(
    project: ProjectModel | SaveProjectInput,
    manager?: EntityManager,
  ): Promise<ProjectModel> {
    const repo = this.getRepo(manager);
    const entity = ProjectMapper.toEntity(project as ProjectModel);
    const saved = await repo.save(entity);
    return ProjectMapper.toModel(saved);
  }
}
