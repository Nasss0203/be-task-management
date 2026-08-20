import { EntityManager } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { PageBlock } from 'src/modules/content/domain/entities/page-block.entity';
import type { PageBlockRepository } from 'src/modules/content/domain/repositories/page-block.repository';
import { PageBlockOrmEntity } from '../entities/page-block.orm-entity';
import { PageBlockMapper } from '../mappers/page-block.mapper';
import { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';

@Injectable()
export class TypeOrmPageBlockRepository implements PageBlockRepository {
  constructor(
    @InjectRepository(PageBlockOrmEntity)
    private readonly repo: Repository<PageBlockOrmEntity>,
  ) {}

  private resolveRepo(context?: PersistenceContext): Repository<PageBlockOrmEntity> {
    if (context) {
      return (context as EntityManager).getRepository(PageBlockOrmEntity);
    }
    return this.repo;
  }

  async findById(id: string, context?: PersistenceContext): Promise<PageBlock | null> {
    const orm = await this.resolveRepo(context).findOne({
      where: { id, },
    });
    return orm ? PageBlockMapper.toDomain(orm) : null;
  }

  async findByPageId(pageId: string, context?: PersistenceContext): Promise<PageBlock[]> {
    const orms = await this.resolveRepo(context).find({
      where: { page_id: pageId, },
      order: { order_index: 'ASC', created_at: 'ASC' },
    });
    return orms.map(PageBlockMapper.toDomain);
  }

  async findDeletedByWorkspace(workspaceId: string, pageId?: string, context?: PersistenceContext): Promise<PageBlock[]> {
    const qb = this.resolveRepo(context)
      .createQueryBuilder('block')
      .withDeleted()
      .innerJoin('block.page', 'page')
      .where('page.workspace_id = :workspaceId', { workspaceId })
      .andWhere('block.deleted_at IS NOT NULL');

    if (pageId) {
      qb.andWhere('block.page_id = :pageId', { pageId });
    }
    qb.orderBy('block.deleted_at', 'DESC');
    const orms = await qb.getMany();
    return orms.map(PageBlockMapper.toDomain);
  }

  async save(pageBlock: PageBlock, context?: PersistenceContext): Promise<PageBlock> {
    const orm = PageBlockMapper.toOrm(pageBlock);
    const saved = await this.resolveRepo(context).save(orm);
    return PageBlockMapper.toDomain(saved);
  }

  async saveMany(pageBlocks: PageBlock[], context?: PersistenceContext): Promise<PageBlock[]> {
    if (pageBlocks.length === 0) return [];
    const orms = pageBlocks.map(PageBlockMapper.toOrm);
    const saved = await this.resolveRepo(context).save(orms);
    return saved.map(PageBlockMapper.toDomain);
  }

  async delete(id: string, context?: PersistenceContext): Promise<void> {
    await this.resolveRepo(context).softDelete(id);
  }

  async shiftOrderIndexesForInsert(pageId: string, fromOrderIndex: number, context?: PersistenceContext): Promise<void> {
    const repo = this.resolveRepo(context);
    const rows = await repo.find({
      where: { page_id: pageId, },
      order: { order_index: 'DESC' },
    });

    const affectedRows = rows.filter((row) => row.order_index >= fromOrderIndex);
    for (const row of affectedRows) {
      await repo.update({ id: row.id }, { order_index: row.order_index + 1 });
    }
  }
}
