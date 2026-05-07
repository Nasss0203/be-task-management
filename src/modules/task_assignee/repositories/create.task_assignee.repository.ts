import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { TaskAssignee } from '../domain/entities/task_assignee.entity';
import { TaskAssigneeModel } from '../domain/models/task_assignee.model';
import {
  CreateTaskAssigneeRepository,
  SaveTaskAssigneeInput,
} from '../interfaces/repositories/create.task_assignee.repository.interface';
import { TaskAssigneeMapper } from '../mapper/task_assignee.mapper';

@Injectable()
export class CreateTaskAssigneeRepositoryImpl implements CreateTaskAssigneeRepository {
  constructor(
    @InjectRepository(TaskAssignee)
    private readonly repo: Repository<TaskAssignee>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<TaskAssignee> {
    return manager ? manager.getRepository(TaskAssignee) : this.repo;
  }

  async save(
    input: SaveTaskAssigneeInput,
    manager?: EntityManager,
  ): Promise<TaskAssigneeModel> {
    const repo = this.getRepo(manager);

    const entity = TaskAssigneeMapper.toEntity(input);

    const saved = await repo.save(entity);

    const result = await repo.findOne({
      where: { id: saved.id },
      relations: {
        user: true,
        assignedByUser: true,
      },
    });

    if (!result) {
      throw new NotFoundException('Task assignee not found after save');
    }

    return TaskAssigneeMapper.toModel(result);
  }
}
