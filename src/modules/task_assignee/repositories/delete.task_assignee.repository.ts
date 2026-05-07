import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { TaskAssignee } from '../domain/entities/task_assignee.entity';
import { DeleteTaskAssigneeRepository } from '../interfaces/repositories/delete.task_assignee.repository.interface';

@Injectable()
export class DeleteTaskAssigneeRepositoryImpl implements DeleteTaskAssigneeRepository {
  constructor(
    @InjectRepository(TaskAssignee)
    private readonly repo: Repository<TaskAssignee>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<TaskAssignee> {
    return manager ? manager.getRepository(TaskAssignee) : this.repo;
  }

  async deleteByTaskAndUser(
    taskId: string,
    userId: string,
    manager?: EntityManager,
  ): Promise<void> {
    const repo = this.getRepo(manager);

    const result = await repo.delete({
      taskId,
      userId,
    });

    if (!result.affected) {
      throw new NotFoundException('Task assignee not found');
    }
  }
}
