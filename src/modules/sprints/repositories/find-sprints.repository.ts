import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Sprint, SprintStatus } from '../domain/entities/sprint.entity';
import { SprintsModel } from '../domain/models/sprints.model';
import { SprintProgressResponseDto } from '../dto/sprint-progress.response.dto';
import { FindSprintQuery } from '../interfaces/find-sprint-query.interface';
import {
  FindSprintRepository,
  SprintRestoreLookup,
} from '../interfaces/repositories/find-sprint.repository.interface';
import { SprintsMapper } from '../mapper/sprints.mapper';

@Injectable()
export class FindSprintRepositoryImpl implements FindSprintRepository {
  constructor(
    @InjectRepository(Sprint)
    private readonly repo: Repository<Sprint>,
  ) {}

  async findDeletedSprints(
    workspaceId: string,
    projectId?: string,
  ): Promise<SprintsModel[]> {
    const qb = this.repo
      .createQueryBuilder('sprint')
      .withDeleted()
      .innerJoin('sprint.project', 'project')
      .innerJoin('sprint.workspace', 'workspace')
      .where('sprint.workspace_id = :workspaceId', { workspaceId })
      .andWhere('sprint.deleted_at IS NOT NULL')
      .andWhere('project.deleted_at IS NULL')
      .andWhere('workspace.deleted_at IS NULL')
      .orderBy('sprint.deleted_at', 'DESC');

    if (projectId) {
      qb.andWhere('sprint.project_id = :projectId', { projectId });
    }

    const entities = await qb.getMany();

    return entities.map((entity) => SprintsMapper.toModel(entity));
  }

  async findOneSprintForRestore(
    workspaceId: string,
    projectId: string,
    sprintId: string,
  ): Promise<SprintRestoreLookup | null> {
    const row = await this.repo
      .createQueryBuilder('sprint')
      .withDeleted()
      .innerJoin('sprint.project', 'project')
      .innerJoin('sprint.workspace', 'workspace')
      .select([
        'sprint.id AS "id"',
        'sprint.workspace_id AS "workspaceId"',
        'sprint.project_id AS "projectId"',
        'sprint.status AS "status"',
        'sprint.deleted_at AS "deletedAt"',
        'workspace.deleted_at AS "workspaceDeletedAt"',
        'project.deleted_at AS "projectDeletedAt"',
      ])
      .where('sprint.id = :sprintId', { sprintId })
      .andWhere('sprint.workspace_id = :workspaceId', { workspaceId })
      .andWhere('sprint.project_id = :projectId', { projectId })
      .andWhere('project.workspace_id = :workspaceId', { workspaceId })
      .getRawOne<SprintRestoreLookup>();

    return row ?? null;
  }

  private getRepo(manager?: EntityManager): Repository<Sprint> {
    return manager ? manager.getRepository(Sprint) : this.repo;
  }

  async existsByProjectIdAndName(
    projectId: string,
    name: string,
    manager?: EntityManager,
  ): Promise<boolean> {
    return await this.getRepo(manager).exists({
      where: {
        projectId,
        name,
      },
    });
  }

  async getNextDefaultSprintName(
    projectId: string,
    manager?: EntityManager,
  ): Promise<string> {
    const rows = await this.getRepo(manager)
      .createQueryBuilder('sprint')
      .withDeleted()
      .select('sprint.name', 'name')
      .where('sprint.project_id = :projectId', { projectId })
      .andWhere('sprint.name ~ :pattern', { pattern: '^Sprint [0-9]+$' })
      .getRawMany<{ name: string }>();

    const maxNumber = rows.reduce((max, row) => {
      const match = row.name.match(/^Sprint (\d+)$/);
      const sprintNumber = match ? Number(match[1]) : 0;

      return Number.isNaN(sprintNumber) ? max : Math.max(max, sprintNumber);
    }, 0);

    return `Sprint ${maxNumber + 1}`;
  }

  async findOneSprint(
    sprintId: string,
    manager?: EntityManager,
  ): Promise<SprintsModel | null> {
    const sprint = await this.getRepo(manager).findOne({
      where: {
        id: sprintId,
      },
      relations: {
        tasks: {
          assignees: {
            user: true,
            assignedByUser: true,
          },
          status: true,
          priority: true,
        },
      },
    });

    if (!sprint) {
      return null;
    }

    return SprintsMapper.toModel(sprint);
  }

  async findAllSprintByProject(
    workspaceId: string,
    projectId: string,
    query?: FindSprintQuery,
    manager?: EntityManager,
  ): Promise<SprintsModel[]> {
    const repo = this.getRepo(manager);

    const qb = repo
      .createQueryBuilder('sprint')
      .leftJoinAndSelect('sprint.tasks', 'task', 'task.deleted_at IS NULL')
      .leftJoin(
        'task_positions',
        'taskPosition',
        `taskPosition.task_id = task.id
          AND taskPosition.context = :taskPositionContext
          AND taskPosition.context_id = sprint.id`,
        {
          taskPositionContext: 'sprint',
        },
      )
      .leftJoinAndSelect('task.assignees', 'assignees')
      .leftJoinAndSelect('assignees.user', 'user')
      .leftJoinAndSelect('assignees.assignedByUser', 'assignedByUser')
      .leftJoinAndSelect('task.status', 'status')
      .leftJoinAndSelect('task.priority', 'priority')
      .where('sprint.workspace_id = :workspaceId', { workspaceId })
      .andWhere('sprint.project_id = :projectId', { projectId })
      .andWhere('sprint.deleted_at IS NULL')
      .andWhere('sprint.status IN (:...statuses)', {
        statuses: [SprintStatus.PLANNED, SprintStatus.ACTIVE],
      });

    const keyword = query?.keyword?.trim();

    if (keyword) {
      qb.andWhere(
        '(sprint.name ILIKE :keyword OR sprint.goal ILIKE :keyword)',
        {
          keyword: `%${keyword}%`,
        },
      );
    }

    if (query?.status) {
      qb.andWhere('sprint.status = :status', {
        status: query.status,
      });
    }

    if (query?.from) {
      qb.andWhere('sprint.start_at >= :from', {
        from: query.from,
      });
    }

    if (query?.to) {
      qb.andWhere('sprint.start_at <= :to', {
        to: query.to,
      });
    }

    const sprints = await qb
      .orderBy('sprint.start_at', 'ASC')
      .addOrderBy('sprint.created_at', 'ASC')
      .addOrderBy('taskPosition.position', 'ASC', 'NULLS LAST')
      .addOrderBy('task.createdAt', 'DESC')
      .getMany();

    return sprints.map(SprintsMapper.toModel);
  }

  async findTasksBySprint(
    workspaceId: string,
    projectId: string,
    sprintId: string,
    manager?: EntityManager,
  ): Promise<SprintsModel | null> {
    const sprint = await this.getRepo(manager)
      .createQueryBuilder('sprint')
      .leftJoinAndSelect('sprint.tasks', 'task', 'task.deleted_at IS NULL')
      .leftJoin(
        'task_positions',
        'taskPosition',
        `taskPosition.task_id = task.id
          AND taskPosition.context = :taskPositionContext
          AND taskPosition.context_id = sprint.id`,
        {
          taskPositionContext: 'sprint',
        },
      )
      .leftJoinAndSelect('task.assignees', 'assignees')
      .leftJoinAndSelect('assignees.user', 'user')
      .leftJoinAndSelect('assignees.assignedByUser', 'assignedByUser')
      .leftJoinAndSelect('task.status', 'status')
      .leftJoinAndSelect('task.priority', 'priority')
      .where('sprint.workspace_id = :workspaceId', { workspaceId })
      .andWhere('sprint.project_id = :projectId', { projectId })
      .andWhere('sprint.id = :sprintId', { sprintId })
      .andWhere('sprint.deleted_at IS NULL')
      .orderBy('taskPosition.position', 'ASC', 'NULLS LAST')
      .addOrderBy('task.createdAt', 'DESC')
      .getOne();

    if (!sprint) {
      return null;
    }

    return SprintsMapper.toModel(sprint);
  }

  async getSprintProgress(
    workspaceId: string,
    projectId: string,
    sprintId: string,
    manager?: EntityManager,
  ): Promise<SprintProgressResponseDto | null> {
    const repo = this.getRepo(manager);

    const row = await repo
      .createQueryBuilder('sprint')
      .leftJoin('sprint.tasks', 'task')
      .leftJoin('task.status', 'status')
      .select('sprint.id', 'sprintId')
      .addSelect('COUNT(task.id)::int', 'totalTasks')
      .addSelect(
        `COALESCE(SUM(CASE WHEN status.is_done = true THEN 1 ELSE 0 END), 0)::int`,
        'doneTasks',
      )
      .where('sprint.workspace_id = :workspaceId', { workspaceId })
      .andWhere('sprint.project_id = :projectId', { projectId })
      .andWhere('sprint.id = :sprintId', { sprintId })
      .andWhere('sprint.deleted_at IS NULL')
      .groupBy('sprint.id')
      .getRawOne<{
        sprintId: string;
        totalTasks: number | string;
        doneTasks: number | string;
      }>();

    if (!row) {
      return null;
    }

    const totalTasks = Number(row.totalTasks);
    const doneTasks = Number(row.doneTasks);
    const notDoneTasks = totalTasks - doneTasks;
    const progressPercent =
      totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);

    return {
      sprintId: row.sprintId,
      totalTasks,
      doneTasks,
      notDoneTasks,
      progressPercent,
    };
  }
}
