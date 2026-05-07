import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, IsNull, Repository } from 'typeorm';
import { TaskComment } from '../domain/entities/task_commnent.entity';
import { TaskCommentModel } from '../domain/models/task_comment.model';
import { FindTaskCommentReposiroty } from '../interfaces/repositories/find.task_comment.reposiroty.interface';
import { TaskCommentMapper } from '../mapper/task_commnent.mapper';

@Injectable()
export class FindTaskCommentReposirotyImpl implements FindTaskCommentReposiroty {
  constructor(
    @InjectRepository(TaskComment)
    private readonly repo: Repository<TaskComment>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<TaskComment> {
    return manager ? manager.getRepository(TaskComment) : this.repo;
  }

  async findByTaskId(
    workspaceId: string,
    projectId: string,
    taskId: string,
    manager?: EntityManager,
  ): Promise<TaskCommentModel[]> {
    const repo = this.getRepo(manager);

    const comments = await repo.find({
      where: {
        workspaceId,
        projectId,
        taskId,
        deletedAt: IsNull(),
      },
      relations: {
        author: true,
      },
      order: {
        createdAt: 'ASC',
      },
    });

    return comments.map((comment) => TaskCommentMapper.toModel(comment));
  }
}
