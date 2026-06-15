import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { TaskComment } from '../domain/entities/task_commnent.entity';
import { DeleteTaskCommentRepository } from '../interfaces/repositories/delete.task-comment.repository.interface';

@Injectable()
export class DeleteTaskCommentRepositoryImpl implements DeleteTaskCommentRepository {
  constructor(
    @InjectRepository(TaskComment)
    private readonly repo: Repository<TaskComment>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<TaskComment> {
    return manager ? manager.getRepository(TaskComment) : this.repo;
  }

  async delete(id: string, manager?: EntityManager): Promise<void> {
    const repo = this.getRepo(manager);
    await repo.delete(id);
  }
}
