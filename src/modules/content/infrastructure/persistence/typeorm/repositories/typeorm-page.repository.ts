import { EntityManager } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { Page } from 'src/modules/content/domain/aggregates/page/page.aggregate';
import type { PageRepository } from 'src/modules/content/domain/repositories/page.repository';
import { PageOrmEntity } from '../entities/page.orm-entity';
import { PageMapper } from '../mappers/page.mapper';
import { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';

@Injectable()
export class TypeOrmPageRepository implements PageRepository {
  constructor(
    @InjectRepository(PageOrmEntity)
    private readonly repo: Repository<PageOrmEntity>,
  ) {}

  private resolveRepo(context?: PersistenceContext): Repository<PageOrmEntity> {
    if (context) {
      return (context as EntityManager).getRepository(PageOrmEntity);
    }
    return this.repo;
  }

  async findById(id: string, context?: PersistenceContext): Promise<Page | null> {
    const orm = await this.resolveRepo(context).findOne({
      where: { id, },
    });
    return orm ? PageMapper.toDomain(orm) : null;
  }

  async findByWorkspace(workspaceId: string, context?: PersistenceContext): Promise<Page[]> {
    const orms = await this.resolveRepo(context).find({
      where: { workspace_id: workspaceId, },
      order: { createdAt: 'ASC' },
    });
    return orms.map(PageMapper.toDomain);
  }

  async findDeletedByWorkspace(workspaceId: string, context?: PersistenceContext): Promise<Page[]> {
    const qb = this.resolveRepo(context)
      .createQueryBuilder('page')
      .withDeleted()
      .where('page.workspace_id = :workspaceId', { workspaceId })
      .andWhere('page.deleted_at IS NOT NULL')
      .orderBy('page.deleted_at', 'DESC');
    const orms = await qb.getMany();
    return orms.map(PageMapper.toDomain);
  }

  async save(page: Page, context?: PersistenceContext): Promise<Page> {
    const repo = this.resolveRepo(context);
    const orm = PageMapper.toOrm(page);
    const saved = await repo.save(orm);
    return PageMapper.toDomain(saved);
  }

  async delete(id: string, context?: PersistenceContext): Promise<void> {
    await this.resolveRepo(context).softDelete(id);
  }

  async existsBySlug(workspaceId: string, slug: string, context?: PersistenceContext): Promise<boolean> {
    const count = await this.resolveRepo(context).count({
      where: { workspace_id: workspaceId, slug },
    });
    return count > 0;
  }
}
