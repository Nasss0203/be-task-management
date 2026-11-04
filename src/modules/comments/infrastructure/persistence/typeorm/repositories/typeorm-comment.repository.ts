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

  async countVisibleByPage(
    pageId: string,
    targetType: CommentTargetType,
    context?: PersistenceContext,
  ): Promise<Record<string, number>> {
    // Trả lời của comment gốc đã xóa không hiện nên cũng không đếm (khớp ListCommentsHandler).
    // Thread đã resolve (gốc có resolved_at) bị ẩn mặc định nên cũng không đếm.
    // withDeleted để join thấy được comment gốc đã xóa; tự lọc comment đã xóa ở dưới
    const rows = await this.getRepo(context)
      .createQueryBuilder('comment')
      .withDeleted()
      .leftJoin(
        CommentOrmEntity,
        'parent',
        'parent.id = comment.parent_comment_id',
      )
      .select('comment.target_id', 'targetId')
      .addSelect('COUNT(*)::int', 'count')
      .where('comment.page_id = :pageId', { pageId })
      .andWhere('comment.target_type = :targetType', { targetType })
      .andWhere('comment.deleted_at IS NULL')
      .andWhere(
        '(comment.parent_comment_id IS NULL OR parent.deleted_at IS NULL)',
      )
      // Gốc không có parent; trả lời không bao giờ có resolved_at
      .andWhere('comment.resolved_at IS NULL AND parent.resolved_at IS NULL')
      .groupBy('comment.target_id')
      .getRawMany<{ targetId: string; count: number }>();

    return Object.fromEntries(rows.map((row) => [row.targetId, row.count]));
  }
}
