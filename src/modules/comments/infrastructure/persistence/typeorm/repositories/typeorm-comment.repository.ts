import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import { EntityManager, Repository } from 'typeorm';
import { Comment } from '../../../../domain/aggregates/comment/comment.aggregate';
import { CommentTargetType } from '../../../../domain/enums/comment-target-type.enum';
import { CommentRepository } from '../../../../domain/repositories/comment.repository';
import { CommentOrmEntity } from '../entities/comment.orm-entity';
import { CommentMapper } from '../mappers/comment.mapper';

@Injectable()
export class TypeOrmCommentRepository implements CommentRepository {
  constructor(
    @InjectRepository(CommentOrmEntity)
    private readonly repo: Repository<CommentOrmEntity>,
  ) {}

  private getRepo(context?: PersistenceContext): Repository<CommentOrmEntity> {
    return context
      ? (context as EntityManager).getRepository(CommentOrmEntity)
      : this.repo;
  }

  async save(comment: Comment, context?: PersistenceContext): Promise<Comment> {
    const saved = await this.getRepo(context).save(
      CommentMapper.toOrm(comment),
    );

    return CommentMapper.toDomain(saved);
  }

  async findById(
    id: string,
    context?: PersistenceContext,
  ): Promise<Comment | null> {
    const orm = await this.getRepo(context).findOne({ where: { id } });

    return orm ? CommentMapper.toDomain(orm) : null;
  }

  async findByTarget(
    targetType: CommentTargetType,
    targetId: string,
    context?: PersistenceContext,
  ): Promise<Comment[]> {
    const rows = await this.getRepo(context).find({
      where: { targetType, targetId },
      order: { createdAt: 'ASC' },
    });

    return rows.map((row) => CommentMapper.toDomain(row));
  }
}
