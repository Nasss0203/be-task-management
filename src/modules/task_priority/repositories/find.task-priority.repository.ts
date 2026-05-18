import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { TaskPriority } from '../domain/entities/task_priority.entity';
import { TaskPriorityModel } from '../domain/models/task_priority.models';
import { FindTaskPriorityRepository } from '../interfaces/repositories/find.task-priority.repository.interface';
import { TaskPriorityMapper } from '../mapper/task_priority.mapper';

@Injectable()
export class FindTaskPriorityRepositoryImpl implements FindTaskPriorityRepository {
  constructor(
    @InjectRepository(TaskPriority)
    private readonly repo: Repository<TaskPriority>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<TaskPriority> {
    return manager ? manager.getRepository(TaskPriority) : this.repo;
  }

  async findAllTaskPriority(
    projectId: string,
    workspaceId: string,
    manager?: EntityManager,
  ): Promise<TaskPriorityModel[]> {
    const repo = this.getRepo(manager);

    const priorities = await repo.find({
      where: {
        projectId,
        workspaceId,
      },
    });

    return priorities.map((entity) => TaskPriorityMapper.toModel(entity));
  }

  async findDonePriority(
    projectId: string,
    workspaceId: string,
    manager?: EntityManager,
  ): Promise<TaskPriorityModel | null> {
    const repo = this.getRepo(manager);

    const priority = await repo
      .createQueryBuilder('priority')
      .where('priority.projectId = :projectId', { projectId })
      .andWhere('priority.workspaceId = :workspaceId', { workspaceId })
      .andWhere('LOWER(priority.name) = :name', { name: 'done' })
      .getOne();

    return priority ? TaskPriorityMapper.toModel(priority) : null;
  }
}
