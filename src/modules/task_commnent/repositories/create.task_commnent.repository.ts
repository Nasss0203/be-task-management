import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { TaskComment } from '../domain/entities/task_commnent.entity';
import { TaskCommentModel } from '../domain/models/task_comment.model';
import { CreateTaskCommentRepository } from '../interfaces/repositories/create.task_commnent.repository.interface';
import {
  SaveTaskCommentInput,
  TaskCommentMapper,
} from '../mapper/task_commnent.mapper';

@Injectable()
export class CreateTaskCommentRepositoryImpl implements CreateTaskCommentRepository {
  constructor(
    @InjectRepository(TaskComment)
    private readonly repo: Repository<TaskComment>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<TaskComment> {
    return manager ? manager.getRepository(TaskComment) : this.repo;
  }

  async create(
    input: SaveTaskCommentInput,
    manager?: EntityManager,
  ): Promise<TaskCommentModel> {
    const repo = this.getRepo(manager);
    const entity = TaskCommentMapper.toEntity(input);
    const saved = await repo.save(entity);
    return TaskCommentMapper.toModel(saved);
  }
}
