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

  private resolveRepo(
    context?: PersistenceContext,
  ): Repository<PageBlockOrmEntity> {
    if (context) {
      return (context as EntityManager).getRepository(PageBlockOrmEntity);
    }
    return this.repo;
  }

  async findById(
    id: string,
    context?: PersistenceContext,
  ): Promise<PageBlock | null> {
    const orm = await this.resolveRepo(context).findOne({
      where: { id },
    });
    return orm ? PageBlockMapper.toDomain(orm) : null;
  }

  async findByPageId(
    pageId: string,
    context?: PersistenceContext,
  ): Promise<PageBlock[]> {
    const orms = await this.resolveRepo(context)
      .createQueryBuilder('block')
      .where('block.page_id = :pageId', { pageId })
      .andWhere('block.deleted_at IS NULL')
      .orderBy(
        'CASE WHEN block.parent_block_id IS NULL THEN 0 ELSE 1 END',
        'ASC',
      )
      .addOrderBy('block.parent_block_id', 'ASC', 'NULLS FIRST')
      .addOrderBy('block.order_index', 'ASC')
      .addOrderBy('block.created_at', 'ASC')
      .getMany();

    return orms.map((orm) => PageBlockMapper.toDomain(orm));
  }

  async findActiveSiblings(
    pageId: string,
    parentBlockId: string | null,
    context?: PersistenceContext,
  ): Promise<PageBlock[]> {
    const qb = this.resolveRepo(context)
      .createQueryBuilder('block')
      .where('block.page_id = :pageId', { pageId })
      .andWhere('block.deleted_at IS NULL');

    if (parentBlockId === null) {
      qb.andWhere('block.parent_block_id IS NULL');
    } else {
      qb.andWhere('block.parent_block_id = :parentBlockId', {
        parentBlockId,
      });
    }

    const orms = await qb
      .orderBy('block.order_index', 'ASC')
      .addOrderBy('block.created_at', 'ASC')
      .getMany();

    return orms.map((orm) => PageBlockMapper.toDomain(orm));
  }

  async findLastSibling(
    pageId: string,
    parentBlockId: string | null,
    context?: PersistenceContext,
  ): Promise<PageBlock | null> {
    const qb = this.resolveRepo(context)
      .createQueryBuilder('block')
      .where('block.page_id = :pageId', { pageId })
      .andWhere('block.deleted_at IS NULL');

    if (parentBlockId === null) {
      qb.andWhere('block.parent_block_id IS NULL');
    } else {
      qb.andWhere('block.parent_block_id = :parentBlockId', {
        parentBlockId,
      });
    }

    const orm = await qb
      .orderBy('block.order_index', 'DESC')
      .addOrderBy('block.created_at', 'DESC')
      .getOne();

    return orm ? PageBlockMapper.toDomain(orm) : null;
  }

  async findActiveChildren(
    parentBlockId: string,
    context?: PersistenceContext,
  ): Promise<PageBlock[]> {
    const orms = await this.resolveRepo(context)
      .createQueryBuilder('block')
      .where('block.parent_block_id = :parentBlockId', { parentBlockId })
      .andWhere('block.deleted_at IS NULL')
      .orderBy('block.order_index', 'ASC')
      .addOrderBy('block.created_at', 'ASC')
      .getMany();

    return orms.map((orm) => PageBlockMapper.toDomain(orm));
  }

  async findDeletedById(
    id: string,
    context?: PersistenceContext,
  ): Promise<PageBlock | null> {
    const orm = await this.resolveRepo(context).findOne({
      where: { id },
      withDeleted: true,
    });

    return orm && orm.deleted_at !== null
      ? PageBlockMapper.toDomain(orm)
      : null;
  }

  async findDeletedByWorkspace(
    workspaceId: string,
    pageId?: string,
    context?: PersistenceContext,
  ): Promise<PageBlock[]> {
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
    return orms.map((orm) => PageBlockMapper.toDomain(orm));
  }

  async save(
    pageBlock: PageBlock,
    context?: PersistenceContext,
  ): Promise<PageBlock> {
    const orm = PageBlockMapper.toOrm(pageBlock);
    const saved = await this.resolveRepo(context).save(orm);
    return PageBlockMapper.toDomain(saved);
  }

  async saveMany(
    pageBlocks: PageBlock[],
    context?: PersistenceContext,
  ): Promise<PageBlock[]> {
    if (pageBlocks.length === 0) return [];
    const orms = pageBlocks.map((pageBlock) =>
      PageBlockMapper.toOrm(pageBlock),
    );
    const saved = await this.resolveRepo(context).save(orms);
    return saved.map((orm) => PageBlockMapper.toDomain(orm));
  }
}
