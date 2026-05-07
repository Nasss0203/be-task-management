import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Project } from '../domain/entities/project.entity';
import { DeleteProjectRepository } from '../interfaces/repositories/delete-project.repository.interface';

@Injectable()
export class DeleteProjectRepositoryImpl implements DeleteProjectRepository {
  constructor(
    @InjectRepository(Project)
    private readonly repo: Repository<Project>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<Project> {
    return manager ? manager.getRepository(Project) : this.repo;
  }

  async softDeleteProject(
    input: {
      projectId: string;
      deletedBy: string;
    },
    manager?: EntityManager,
  ): Promise<void> {
    const repo = this.getRepo(manager);

    await repo.update(
      { id: input.projectId },
      {
        deleted_at: new Date(),
        deleted_by: input.deletedBy,
      },
    );
  }

  async restoreProject(
    input: {
      projectId: string;
    },
    manager?: EntityManager,
  ): Promise<void> {
    const repo = this.getRepo(manager);

    await repo.update(
      { id: input.projectId },
      {
        deleted_at: null,
        deleted_by: null,
      },
    );
  }
}
