import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Repository } from 'typeorm';
import {
  paginateQb,
} from 'src/common/pagination/paginate-qb.util';
import {
  normalizePagination,
  buildPaginationMeta,
} from 'src/common/pagination/pagination.util';
import { TaskAssignee } from 'src/modules/task_assignee/domain/entities/task_assignee.entity';
import { Task } from '../domain/entities/task.entity';
import { TaskModel } from '../domain/models/task.model';
import {
  FindBacklogTasksFilters,
  PaginatedTaskModels,
  TaskFilterValue,
} from '../interfaces/find-backlog-tasks-filters.interface';
import {
  ParamTask,
  TaskDueSoonLookup,
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

  private getAssigneeRepo(manager?: EntityManager): Repository<TaskAssignee> {
    const em = manager ?? this.repo.manager;
    return em.getRepository(TaskAssignee);
  }

  private async loadAssigneesForTasks(
    taskIds: string[],
    manager?: EntityManager,
  ): Promise<Map<string, TaskAssignee[]>> {
    if (taskIds.length === 0) return new Map();

    const assignees = await this.getAssigneeRepo(manager)
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.user', 'user')
      .leftJoinAndSelect('a.assignedByUser', 'assignedByUser')
      .where('a.task_id IN (:...taskIds)', { taskIds })
      .getMany();

    const map = new Map<string, TaskAssignee[]>();
    for (const assignee of assignees) {
      const list = map.get(assignee.taskId) ?? [];
      list.push(assignee);
      map.set(assignee.taskId, list);
    }
    return map;
  }

  private parseProjectSeqSearch(search: string): number | null {
    const value = search.startsWith('#') ? search.slice(1) : search;

    if (!/^\d+$/.test(value)) {
      return null;
    }

    const sequence = Number(value);

    return Number.isSafeInteger(sequence) ? sequence : null;
  }

  private mapTasksWithPosition(
    entities: Task[],
    rawRows: Array<Record<string, unknown>>,
    assigneesByTaskId?: Map<string, TaskAssignee[]>,
  ): TaskModel[] {
    const positionByTaskId = new Map<string, string | null>();

    for (const row of rawRows) {
      const taskId = row.task_id;

      if (typeof taskId !== 'string' || positionByTaskId.has(taskId)) {
        continue;
      }

      const position = row.taskPosition_position ?? row.task_position_value;
      positionByTaskId.set(
        taskId,
        typeof position === 'string' ? position : null,
      );
    }

    return entities.map((entity) => {
      // Override entity.assignees with separately loaded assignees when provided
      if (assigneesByTaskId) {
        entity.assignees = assigneesByTaskId.get(entity.id) ?? [];
      }
      return TaskMapper.toModel(entity, positionByTaskId.get(entity.id) ?? null);
    });
  }

  async findAllTask(
    params: ParamTask,
    filters?: FindBacklogTasksFilters,
    manager?: EntityManager,
  ): Promise<PaginatedTaskModels> {
    const { projectId, workspaceId } = params;

    const search = filters?.search?.trim();
    const assigneeIds = this.normalizeFilterValues(filters?.assigneeId);
    const statusIds = this.normalizeFilterValues(filters?.statusId);
    const priorityIds = this.normalizeFilterValues(filters?.priorityId);
    const positionContext = filters?.context;
    const positionContextId = filters?.contextId;
    const { page, pageSize, skip, take } = normalizePagination(
      filters ?? {},
      20,
      100,
    );

    // ── Base query: WHERE conditions only (no 1-N JOINs) ──────────────────────
    const baseQb = this.getRepo(manager)
      .createQueryBuilder('task')
      .where('task.project_id = :projectId', { projectId })
      .andWhere('task.workspace_id = :workspaceId', { workspaceId })
      .andWhere('task.parent_task_id IS NULL')
      .andWhere('task.deleted_at IS NULL');

    if (search) {
      const projectSeq = this.parseProjectSeqSearch(search);
      baseQb.andWhere(
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
      baseQb.andWhere(
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
      baseQb.andWhere('task.status_id IN (:...statusIds)', { statusIds });
    }

    if (priorityIds.length > 0) {
      baseQb.andWhere('task.priority_id IN (:...priorityIds)', { priorityIds });
    }

    // ── Paginate: COUNT on baseQb, data query adds 1-1 JOINs only ─────────────
    const { entities, raw, total } = await paginateQb(
      baseQb,
      (qb) => {
        const dataQb = qb
          .leftJoinAndSelect('task.status', 'status')
          .leftJoinAndSelect('task.priority', 'priority')
          .leftJoinAndSelect('task.sprint', 'sprint');

        if (positionContext && positionContextId) {
          dataQb
            .leftJoin(
              'task_positions',
              'taskPosition',
              `taskPosition.task_id = task.id
                AND taskPosition.context = :positionContext
                AND taskPosition.context_id = :positionContextId`,
              { positionContext, positionContextId },
            )
            .addSelect('taskPosition.position', 'taskPosition_position')
            .orderBy('taskPosition.position', 'ASC', 'NULLS LAST')
            .addOrderBy('task.createdAt', 'DESC');
        } else {
          dataQb.orderBy('task.createdAt', 'DESC');
        }

        return dataQb;
      },
      skip,
      take,
    );

    // ── Load assignees in one separate IN query (avoids row multiplication) ────
    const taskIds = entities.map((t) => t.id);
    const assigneesByTaskId = await this.loadAssigneesForTasks(taskIds, manager);

    return {
      data: this.mapTasksWithPosition(entities, raw, assigneesByTaskId),
      ...buildPaginationMeta(page, pageSize, total),
    };
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
        subtasks: {
          status: true,
          priority: true,
          assignees: {
            user: true,
            assignedByUser: true,
          },
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
      .andWhere('task.parent_task_id IS NULL')
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
    const { page, pageSize, skip, take } = normalizePagination(
      filters ?? {},
      10,
      100,
    );

    // ── Base query: WHERE conditions only (no 1-N JOINs) ──────────────────────
    // Used for COUNT so PostgreSQL doesn't inflate row count from JOINed relations.
    const baseQb = this.getRepo(manager)
      .createQueryBuilder('task')
      .where('task.project_id = :projectId', { projectId })
      .andWhere('task.workspace_id = :workspaceId', { workspaceId })
      .andWhere('task.parent_task_id IS NULL')
      .andWhere('task.sprint_id IS NULL')
      .andWhere('task.completed_at IS NULL')
      .andWhere('task.deleted_at IS NULL');

    if (search) {
      const projectSeq = this.parseProjectSeqSearch(search);
      baseQb.andWhere(
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
      // EXISTS subquery keeps baseQb row-safe for COUNT
      baseQb.andWhere(
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
      baseQb.andWhere('task.status_id IN (:...statusIds)', { statusIds });
    }

    if (priorityIds.length > 0) {
      baseQb.andWhere('task.priority_id IN (:...priorityIds)', { priorityIds });
    }

    // ── Paginate: COUNT on baseQb, data query adds 1-1 JOINs only ─────────────
    const { entities, raw, total } = await paginateQb(
      baseQb,
      (qb) =>
        qb
          .leftJoin(
            'task_positions',
            'taskPosition',
            `taskPosition.task_id = task.id
              AND taskPosition.context = :positionContext
              AND taskPosition.context_id = :positionContextId`,
            { positionContext: 'backlog', positionContextId: projectId },
          )
          .addSelect('taskPosition.position', 'taskPosition_position')
          .leftJoinAndSelect('task.status', 'status')
          .leftJoinAndSelect('task.priority', 'priority')
          .leftJoinAndSelect('task.sprint', 'sprint')
          .orderBy('taskPosition.position', 'ASC', 'NULLS LAST')
          .addOrderBy('task.createdAt', 'DESC'),
      skip,
      take,
    );

    // ── Load assignees in one separate IN query (avoids row multiplication) ────
    const taskIds = entities.map((t) => t.id);
    const assigneesByTaskId = await this.loadAssigneesForTasks(taskIds, manager);

    return {
      data: this.mapTasksWithPosition(entities, raw, assigneesByTaskId),
      ...buildPaginationMeta(page, pageSize, total),
    };
  }

  async findTasksDueSoon(
    days: number,
    manager?: EntityManager,
  ): Promise<TaskDueSoonLookup[]> {
    const normalizedDays = Number.isFinite(days)
      ? Math.max(1, Math.floor(days))
      : 3;
    const now = new Date();
    const dueBefore = new Date(
      now.getTime() + normalizedDays * 24 * 60 * 60 * 1000,
    );

    const entities = await this.getRepo(manager)
      .createQueryBuilder('task')
      .innerJoinAndSelect('task.workspace', 'workspace')
      .innerJoinAndSelect('task.project', 'project')
      .leftJoinAndSelect('task.status', 'status')
      .leftJoinAndSelect('task.assignees', 'assignees')
      .leftJoinAndSelect('assignees.user', 'assigneeUser')
      .where('task.due_at IS NOT NULL')
      .andWhere('task.due_at >= :now', { now })
      .andWhere('task.due_at <= :dueBefore', { dueBefore })
      .andWhere('task.completed_at IS NULL')
      .andWhere('task.deleted_at IS NULL')
      .andWhere('workspace.deleted_at IS NULL')
      .andWhere('project.deleted_at IS NULL')
      .andWhere('status.is_done = false')
      .andWhere('LOWER(status.name) NOT IN (:...doneStatusNames)', {
        doneStatusNames: ['done', 'completed'],
      })
      .andWhere(
        `EXISTS (
          SELECT 1
          FROM task_assignees due_assignees
          WHERE due_assignees.task_id = task.id
        )`,
      )
      .orderBy('task.due_at', 'ASC')
      .addOrderBy('task.created_at', 'ASC')
      .getMany();

    return entities
      .filter((entity) => entity.dueAt !== null)
      .map((entity) => ({
        id: entity.id,
        workspaceId: entity.workspaceId,
        workspaceName: entity.workspace?.name ?? null,
        workspaceSlug: entity.workspace.slug,
        projectId: entity.projectId,
        projectName: entity.project?.name ?? null,
        projectSeq: entity.projectSeq,
        title: entity.title,
        statusName: entity.status?.name ?? null,
        dueAt: entity.dueAt as Date,
        assignees:
          entity.assignees?.map((assignee) => ({
            userId: assignee.userId,
            username: assignee.user?.username ?? null,
          })) ?? [],
      }));
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
      relations: {
        assignees: {
          user: true,
          assignedByUser: true,
        },
      },
    });

    return tasks.map((task) => TaskMapper.toModel(task));
  }
}
