import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, IsNull, Repository } from 'typeorm';
import { Task } from '../domain/entities/task.entity';
import { TaskModel } from '../domain/models/task.model';
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

  async findAllTask(
    params: ParamTask,
    manager?: EntityManager,
  ): Promise<TaskModel[]> {
    const { projectId, workspaceId } = params;
    const entities = await this.getRepo(manager).find({
      where: {
        projectId,
        workspaceId,
        // sprintId: IsNull(),
        // completedAt: IsNull(),
        // deletedAt: IsNull(),
      },
      relations: {
        status: true,
        priority: true,
        // hiện thị người được thêm task
        assignees: {
          user: true,
          assignedByUser: true,
        },
        // sprint: true,
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
    manager?: EntityManager,
  ): Promise<TaskModel[]> {
    const entities = await this.getRepo(manager).find({
      where: {
        projectId,
        workspaceId,
        sprintId: IsNull(),
        completedAt: IsNull(),
        deletedAt: IsNull(),
      },
      relations: {
        status: true,
        priority: true,
        // hiện thị người được thêm task
        assignees: {
          user: true,
          assignedByUser: true,
        },
        // sprint: true,
      },
    });

    return entities.map((entity) => TaskMapper.toModel(entity));
  }
}
