import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, EntityManager, Repository } from 'typeorm';
import { Project } from '../domain/entities/project.entity';
import { ProjectModel } from '../domain/models/projects.model';
import {
  ProjectRestoreLookup,
  type FindProjectRepository,
} from '../interfaces/repositories/find.project.repository.interface';
import { ProjectMapper } from '../mapper/projects.mapper';
import { FindProjectFilter } from '../interfaces/find-project-filter.type';

@Injectable()
export class FindProjectRepositoryImpl implements FindProjectRepository {
  constructor(
    @InjectRepository(Project)
    private readonly repo: Repository<Project>,
  ) {}

  async findDeletedProjects(workspaceId: string): Promise<ProjectModel[]> {
    const entities = await this.repo
      .createQueryBuilder('project')
      .withDeleted()
      .innerJoin('project.workspace', 'workspace')
      .where('project.workspace_id = :workspaceId', { workspaceId })
      .andWhere('project.deleted_at IS NOT NULL')
      .andWhere('workspace.deleted_at IS NULL')
      .orderBy('project.deleted_at', 'DESC')
      .getMany();

    return entities.map((entity) => ProjectMapper.toModel(entity));
  }

  async findOneProjectForRestore(
    workspaceId: string,
    projectId: string,
  ): Promise<ProjectRestoreLookup | null> {
    const row = await this.repo
      .createQueryBuilder('project')
      .withDeleted()
      .innerJoin('project.workspace', 'workspace')
      .select([
        'project.id AS "id"',
        'project.workspace_id AS "workspaceId"',
        'project.name AS "name"',
        'project.key AS "key"',
        'project.deleted_at AS "deletedAt"',
        'workspace.deleted_at AS "workspaceDeletedAt"',
      ])
      .where('project.id = :projectId', { projectId })
      .andWhere('project.workspace_id = :workspaceId', { workspaceId })
      .getRawOne<ProjectRestoreLookup>();

    return row ?? null;
  }

  async existsActiveProjectKey(
    workspaceId: string,
    key: string,
    excludeProjectId?: string,
  ): Promise<boolean> {
    const qb = this.repo
      .createQueryBuilder('project')
      .where('project.workspace_id = :workspaceId', { workspaceId })
      .andWhere('project.key = :key', { key })
      .andWhere('project.deleted_at IS NULL');

    if (excludeProjectId) {
      qb.andWhere('project.id != :excludeProjectId', { excludeProjectId });
    }

    return qb.getExists();
  }

  private getRepo(manager?: EntityManager): Repository<Project> {
    return manager ? manager.getRepository(Project) : this.repo;
  }

  async findAllByWorkspaceId(
    workspaceId: string,
    filter?: FindProjectFilter,
    manager?: EntityManager,
  ): Promise<ProjectModel[]> {
    const qb = this.getRepo(manager)
      .createQueryBuilder('project')
      .where('project.workspace_id = :workspaceId', { workspaceId })
      .andWhere('project.deleted_at IS NULL')
      .orderBy('project.created_at', 'DESC');

    if (filter?.keyword?.trim()) {
      const keyword = `%${filter.keyword.trim()}%`;

      qb.andWhere(
        new Brackets((subQb) => {
          subQb
            .where('project.name ILIKE :keyword', { keyword })
            .orWhere('project.key ILIKE :keyword', { keyword });
        }),
      );
    }

    if (filter?.visibility) {
      qb.andWhere('project.visibility = :visibility', {
        visibility: filter.visibility,
      });
    }

    if (filter?.createdBy) {
      qb.andWhere('project.created_by = :createdBy', {
        createdBy: filter.createdBy,
      });
    }

    const rows = await qb.getMany();

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
