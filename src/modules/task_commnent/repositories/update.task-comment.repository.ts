import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { TaskComment } from '../domain/entities/task_commnent.entity';
import { UpdateTaskCommentRepository } from '../interfaces/repositories/update.task-comment.repository.interface';

@Injectable()
export class UpdateTaskCommentRepositoryImpl implements UpdateTaskCommentRepository {
  constructor(
    @InjectRepository(TaskComment)
    private readonly repo: Repository<TaskComment>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<TaskComment> {
    return manager ? manager.getRepository(TaskComment) : this.repo;
  }

  async update(
    id: string,
    content: string,
    manager?: EntityManager,
  ): Promise<void> {
    const repo = this.getRepo(manager);
    await repo.update(id, { content, isEdited: true });
  }
}
