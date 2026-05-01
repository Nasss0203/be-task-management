import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Project } from '../domain/entities/project.entity';
import { ProjectModel } from '../domain/models/projects.model';
import { type FindProjectRepository } from '../interfaces/repositories/find.project.repository.interface';
import { ProjectMapper } from '../mapper/projects.mapper';

@Injectable()
export class FindProjectRepositoryImpl implements FindProjectRepository {
  constructor(
    @InjectRepository(Project)
    private readonly repo: Repository<Project>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<Project> {
    return manager ? manager.getRepository(Project) : this.repo;
  }

  async findAllByWorkspaceId(
    workspaceId: string,
    manager?: EntityManager,
  ): Promise<ProjectModel[]> {
    const rows = await this.getRepo(manager).find({
      where: { workspace_id: workspaceId },
      order: { created_at: 'DESC' },
    });

    return rows.map(ProjectMapper.toModel);
  }

  async findOneProjectById(
    projectId: string,
    manager?: EntityManager,
  ): Promise<ProjectModel | null> {
    const rows = await this.getRepo(manager).findOne({
      where: { id: projectId },
    });

    if (!rows) {
      return null;
    }

    return ProjectMapper.toModel(rows);
  }
}
