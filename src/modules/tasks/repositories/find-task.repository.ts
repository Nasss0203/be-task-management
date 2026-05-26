import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Repository } from 'typeorm';
import { Task } from '../domain/entities/task.entity';
import { TaskModel } from '../domain/models/task.model';
import {
  FindBacklogTasksFilters,
  PaginatedTaskModels,
  PaginationQueryValue,
  TaskFilterValue,
} from '../interfaces/find-backlog-tasks-filters.interface';
import {
  ParamTask,
  TaskRestoreLookup,
  type FindTaskRepository,
} from '../interfaces/repositories/find-task.repository.interface';
import { TaskMapper } from '../mapper/tasks.mapper';

@Injectable()
export class FindTaskRepositoryImpl implements FindTaskRepository {
  constructor(
    @InjectRepository(Task)
    private readonly repo: Repository<Task>,
  ) {}

  async findOneTaskForRestore(
    workspaceId: string,
    taskId: string,
  ): Promise<TaskRestoreLookup | null> {
    const row = await this.repo
      .createQueryBuilder('task')
      .withDeleted()
      .innerJoin('task.project', 'project')
      .innerJoin('task.workspace', 'workspace')
      .select([
        'task.id AS "id"',
        'task.workspace_id AS "workspaceId"',
        'task.project_id AS "projectId"',
        'task.deleted_at AS "deletedAt"',
        'workspace.deleted_at AS "workspaceDeletedAt"',
        'project.deleted_at AS "projectDeletedAt"',
      ])
      .where('task.id = :taskId', { taskId })
      .andWhere('task.workspace_id = :workspaceId', { workspaceId })
      .getRawOne<TaskRestoreLookup>();

    return row ?? null;
  }

  private getRepo(manager?: EntityManager): Repository<Task> {
    return manager ? manager.getRepository(Task) : this.repo;
  }

  private normalizeFilterValues(value?: TaskFilterValue): string[] {
    if (!value) {
      return [];
    }

    const values = Array.isArray(value) ? value : [value];

    return values
      .flatMap((item) => item.split(','))
      .map((item) => item.trim())
      .filter(Boolean);
  }

  private normalizePaginationValue(
    value: PaginationQueryValue | undefined,
    defaultValue: number,
    maxValue?: number,
  ): number {
    const numericValue = Number(value);

    if (!Number.isInteger(numericValue) || numericValue < 1) {
      return defaultValue;
    }

    if (maxValue !== undefined) {
      return Math.min(numericValue, maxValue);
    }

    return numericValue;
  }

  private parseProjectSeqSearch(search: string): number | null {
    const value = search.startsWith('#') ? search.slice(1) : search;

    if (!/^\d+$/.test(value)) {
      return null;
    }

    const sequence = Number(value);

    return Number.isSafeInteger(sequence) ? sequence : null;
  }

  async findAllTask(
    params: ParamTask,
    manager?: EntityManager,
  ): Promise<TaskModel[]> {
    const { projectId, workspaceId } = params;
    const entities = await this.getRepo(manager).find({
      where: {
        projectId,
        workspaceId,
      },
      relations: {
        status: true,
        priority: true,
        // hiện thị người được thêm task
        assignees: {
          user: true,
          assignedByUser: true,
        },
        sprint: true,
      },
    });

    return entities.map((entity) => TaskMapper.toModel(entity));
  }

  async findAllTaskByWorkspace(
    workspaceId: string,
    manager?: EntityManager,
  ): Promise<TaskModel[]> {
    const entities = await this.getRepo(manager).find({
      where: {
        workspaceId,
      },
      relations: {
        status: true,
        priority: true,
      },
    });

    return entities.map((entity) => TaskMapper.toModel(entity));
  }

  async findOneTask(
    taskId: string,
    manager?: EntityManager,
  ): Promise<TaskModel | null> {
    const entities = await this.getRepo(manager).findOne({
      where: {
        id: taskId,
      },
      relations: {
        status: true,
        priority: true,
        assignees: {
          user: true,
          assignedByUser: true,
        },
      },
    });

    if (!entities) {
      return null;
    }

    return TaskMapper.toModel(entities);
  }

  async findDeletedTasks(
    workspaceId: string,
    projectId?: string,
  ): Promise<TaskModel[]> {
    const qb = this.repo
      .createQueryBuilder('task')
      .withDeleted()
      .innerJoin('task.project', 'project')
      .innerJoin('task.workspace', 'workspace')
      .leftJoinAndSelect('task.status', 'status')
      .leftJoinAndSelect('task.priority', 'priority')
      .leftJoinAndSelect('task.assignees', 'assignees')
      .leftJoinAndSelect('assignees.user', 'assigneeUser')
      .where('task.workspace_id = :workspaceId', {
        workspaceId,
      })
      .andWhere('task.deleted_at IS NOT NULL')
      .andWhere('project.deleted_at IS NULL')
      .andWhere('workspace.deleted_at IS NULL')
      .orderBy('task.deleted_at', 'DESC');

    if (projectId) {
      qb.andWhere('task.project_id = :projectId', {
        projectId,
      });
    }

    const entities = await qb.getMany();

    return entities.map((entity) => TaskMapper.toModel(entity));
  }

  async findAllBacklogTasks(
    projectId: string,
    workspaceId: string,
    filters?: FindBacklogTasksFilters,
    manager?: EntityManager,
  ): Promise<PaginatedTaskModels> {
    const search = filters?.search?.trim();
    const assigneeIds = this.normalizeFilterValues(filters?.assigneeId);
    const statusIds = this.normalizeFilterValues(filters?.statusId);
    const priorityIds = this.normalizeFilterValues(filters?.priorityId);
    const page = this.normalizePaginationValue(filters?.page, 1);
    const pageSize = this.normalizePaginationValue(filters?.pageSize, 10, 100);

    const qb = this.getRepo(manager)
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.status', 'status')
      .leftJoinAndSelect('task.priority', 'priority')
      .leftJoinAndSelect('task.sprint', 'sprint')
      .leftJoinAndSelect('task.assignees', 'assignees')
      .leftJoinAndSelect('assignees.user', 'assigneeUser')
      .leftJoinAndSelect('assignees.assignedByUser', 'assignedByUser')
      .where('task.project_id = :projectId', { projectId })
      .andWhere('task.workspace_id = :workspaceId', { workspaceId })
      .andWhere('task.sprint_id IS NULL')
      .andWhere('task.completed_at IS NULL')
      .andWhere('task.deleted_at IS NULL');

    if (search) {
      const projectSeq = this.parseProjectSeqSearch(search);

      qb.andWhere(
        projectSeq === null
          ? 'task.title ILIKE :keyword'
          : '(task.title ILIKE :keyword OR task.project_seq = :projectSeq)',
        {
          keyword: `%${search}%`,
          ...(projectSeq === null ? {} : { projectSeq }),
        },
      );
    }

    if (assigneeIds.length > 0) {
      qb.andWhere(
        `EXISTS (
          SELECT 1
          FROM task_assignees filter_assignees
          WHERE filter_assignees.task_id = task.id
          AND filter_assignees.user_id IN (:...assigneeIds)
        )`,
        { assigneeIds },
      );
    }

    if (statusIds.length > 0) {
      qb.andWhere('task.status_id IN (:...statusIds)', { statusIds });
    }

    if (priorityIds.length > 0) {
      qb.andWhere('task.priority_id IN (:...priorityIds)', { priorityIds });
    }

    const [entities, total] = await qb
      .orderBy('task.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return {
      data: entities.map((entity) => TaskMapper.toModel(entity)),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findByIds(
    taskIds: string[],
    manager?: EntityManager,
  ): Promise<TaskModel[]> {
    const repo = this.getRepo(manager);

    const tasks = await repo.find({
      where: {
        id: In(taskIds),
      },
    });

    return tasks.map(TaskMapper.toModel);
  }
}
