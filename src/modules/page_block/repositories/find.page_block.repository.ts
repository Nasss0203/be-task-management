import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { PageBlock } from '../domain/entities/page_block.entity';
import { PageBlockModel } from '../domain/models/page_block.model';
import { FindPageBlockRepository, PageBlockRestoreLookup } from '../interfaces/repositories/find.page_block.repository.interface';
import { PageBlockMapper } from '../mapper/page_block.mapper';


@Injectable()
export class FindPageBlockRepositoryImpl implements FindPageBlockRepository {
  constructor(
    @InjectRepository(PageBlock)
    private readonly repo: Repository<PageBlock>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<PageBlock> {
    return manager ? manager.getRepository(PageBlock) : this.repo;
  }
  async findAllById(
    blockId: string,
    manager?: EntityManager,
  ): Promise<PageBlockModel | null> {
    const row = await this.getRepo(manager).findOne({
      where: {
        id: blockId,
      },
    });

    if (!row) {
      return null;
    }

    return PageBlockMapper.toModel(row);
  }

  async findAllByPageId(
    pageId: string,
    manager?: EntityManager,
  ): Promise<PageBlockModel | null> {
    const row = await this.getRepo(manager).findOne({
      where: {
        page_id: pageId,
      },
    });

    if (!row) {
      return null;
    }

    return PageBlockMapper.toModel(row);
  }

  async getNextOrderIndex(
    pageId: string,
    manager?: EntityManager,
  ): Promise<number> {
    const repo = this.getRepo(manager);

    const result = await repo
      .createQueryBuilder('page_block')
      .select('MAX(page_block.order_index)', 'max')
      .where('page_block.page_id = :pageId', { pageId })
      .getRawOne<{ max: string | null }>();

    return Number(result?.max ?? 0) + 1;
  }

  async findDeletedPageBlocks(
    workspaceId: string,
    pageId?: string,
  ): Promise<PageBlockModel[]> {
    const qb = this.repo
      .createQueryBuilder('block')
      .withDeleted()
      .innerJoin('block.page', 'page')
      .innerJoin('page.workspace', 'workspace')
      .where('workspace.id = :workspaceId', { workspaceId })
      .andWhere('block.deleted_at IS NOT NULL')
      .andWhere('page.deleted_at IS NULL')
      .andWhere('workspace.deleted_at IS NULL')
      .orderBy('block.deleted_at', 'DESC');

    if (pageId) {
      qb.andWhere('block.page_id = :pageId', { pageId });
    }

    const entities = await qb.getMany();

    return entities.map((entity) => PageBlockMapper.toModel(entity));
  }

  async findOnePageBlockForRestore(
    workspaceId: string,
    blockId: string,
  ): Promise<PageBlockRestoreLookup | null> {
    const row = await this.repo
      .createQueryBuilder('block')
      .withDeleted()
      .innerJoin('block.page', 'page')
      .innerJoin('page.workspace', 'workspace')
      .select([
        'block.id AS "id"',
        'block.page_id AS "pageId"',
        'block.deleted_at AS "deletedAt"',
        'page.deleted_at AS "pageDeletedAt"',
        'workspace.deleted_at AS "workspaceDeletedAt"',
      ])
      .where('block.id = :blockId', { blockId })
      .andWhere('workspace.id = :workspaceId', { workspaceId })
      .getRawOne<PageBlockRestoreLookup>();

    return row ?? null;
  }
}
