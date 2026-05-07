import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { TaskAssignee } from '../domain/entities/task_assignee.entity';
import { TaskAssigneeModel } from '../domain/models/task_assignee.model';
import { FindTaskAssigneeRepository } from '../interfaces/repositories/find.task_assignee.repository.interface';
import { TaskAssigneeMapper } from '../mapper/task_assignee.mapper';

@Injectable()
export class FindTaskAssigneeRepositoryImpl implements FindTaskAssigneeRepository {
  constructor(
    @InjectRepository(TaskAssignee)
    private readonly repo: Repository<TaskAssignee>,
  ) {}
  private getRepo(manager?: EntityManager): Repository<TaskAssignee> {
    return manager ? manager.getRepository(TaskAssignee) : this.repo;
  }
  async findOneTaskAssignee(
    taskId: string,
    userId: string,
    manager?: EntityManager,
  ): Promise<TaskAssigneeModel | null> {
    const taskAssignee = await this.getRepo(manager).findOne({
      where: {
        taskId,
        userId,
      },
    });

    if (!taskAssignee) {
      return null;
    }

    return TaskAssigneeMapper.toModel(taskAssignee);
  }
}
