import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { TaskPosition } from '../domain/entities/task_position.entity';
import { CreateTaskPositionRepository } from '../interfaces/repositories/create-task-position.repository.interface';
import type { CreateTaskPositionRecordInput } from '../interfaces/task-position.input';

@Injectable()
export class CreateTaskPositionRepositoryImpl implements CreateTaskPositionRepository {
  constructor(
    @InjectRepository(TaskPosition)
    private readonly repo: Repository<TaskPosition>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<TaskPosition> {
    return manager ? manager.getRepository(TaskPosition) : this.repo;
  }

  async create(
    input: CreateTaskPositionRecordInput,
    manager?: EntityManager,
  ): Promise<TaskPosition> {
    const repo = this.getRepo(manager);
    const entity = repo.create(input);

    return repo.save(entity);
  }
}
