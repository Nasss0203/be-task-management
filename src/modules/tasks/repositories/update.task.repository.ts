import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Repository } from 'typeorm';
import { Task } from '../domain/entities/task.entity';
import { TaskModel } from '../domain/models/task.model';
import { UpdateManyTasksDto } from '../dto/update-many-tasks.dto';
import { UpdateTaskInput } from '../interfaces/applications/update-task.application.interface';
import { UpdateTaskRepository } from '../interfaces/repositories/update-task.repository.interface';
import { TaskMapper } from '../mapper/tasks.mapper';

@Injectable()
export class UpdateTaskRepositoryImpl implements UpdateTaskRepository {
  constructor(
    @InjectRepository(Task)
    private readonly repoTask: Repository<Task>,
  ) { }

  private getRepo(manager?: EntityManager): Repository<Task> {
    return manager ? manager.getRepository(Task) : this.repoTask;
  }

  async updateTask(
    updateTaskDto: UpdateTaskInput,
    manager?: EntityManager,
  ): Promise<TaskModel> {
    const repo = this.getRepo(manager);

    const { actorId: _actorId, ...entityFields } = updateTaskDto;
    const payload = Object.fromEntries(
      Object.entries(entityFields).filter(([, value]) => value !== undefined),
    );

    const task = await repo.preload({
      ...payload,
    });

    if (!task) {
      throw new HttpException('Task not found', HttpStatus.NOT_FOUND);
    }

    const saved = await repo.save(task);
    return TaskMapper.toModel(saved);
  }

  async updateManyTasks(
    input: {
      workspaceId: string;
      projectId: string;
      dto: UpdateManyTasksDto;
    },
    manager?: EntityManager,
  ): Promise<TaskModel[]> {
    const repo = this.getRepo(manager);
    const { workspaceId, projectId, dto } = input;

    const taskIds = [...new Set(dto.taskIds)];

    const updatePayload = Object.fromEntries(
      Object.entries({
        statusId: dto.statusId,
        priorityId: dto.priorityId,
        startAt: dto.startAt ? new Date(dto.startAt) : dto.startAt,
        dueAt: dto.dueAt ? new Date(dto.dueAt) : dto.dueAt,
        estimateMinutes: dto.estimateMinutes,
      }).filter(([, value]) => value !== undefined),
    );

    if (!Object.keys(updatePayload).length) {
      throw new HttpException('No fields to update', HttpStatus.BAD_REQUEST);
    }

    const existingTasks = await repo.find({
      where: {
        id: In(taskIds),
        workspaceId,
        projectId,
      },
    });

    if (existingTasks.length !== taskIds.length) {
      throw new HttpException(
        'Some tasks were not found or do not belong to this workspace/project',
        HttpStatus.NOT_FOUND,
      );
    }

    await repo.update(
      {
        id: In(taskIds),
        workspaceId,
        projectId,
      },
      updatePayload,
    );

    const updatedTasks = await repo.find({
      where: {
        id: In(taskIds),
        workspaceId,
        projectId,
      },
    });

    return updatedTasks.map(TaskMapper.toModel);
  }
}
