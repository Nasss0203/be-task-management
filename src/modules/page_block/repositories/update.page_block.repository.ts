import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { PageBlock } from '../domain/entities/page_block.entity';
import { PageBlockModel } from '../domain/models/page_block.model';
import { ReorderPageBlockItemDto } from '../dto/reorder-page_block.dto';
import {
  UpdatePageBlockInput,
  UpdatePageBlockRepository,
} from '../interfaces/repositories/update.page_block.repository.interface';
import { PageBlockMapper } from '../mapper/page_block.mapper';

@Injectable()
export class UpdatePageBlockRepositoryImpl implements UpdatePageBlockRepository {
  constructor(
    @InjectRepository(PageBlock)
    private readonly repo: Repository<PageBlock>,
  ) {}

  private resolveRepo(manager?: EntityManager): Repository<PageBlock> {
    return manager ? manager.getRepository(PageBlock) : this.repo;
  }

  async save(
    pageBlock: UpdatePageBlockInput,
    manager: EntityManager,
  ): Promise<PageBlockModel> {
    const repo = this.resolveRepo(manager);

    const existing = await repo.findOne({
      where: { id: pageBlock.id },
    });

    if (!existing) {
      throw new NotFoundException('Page block not found');
    }

    const merged = repo.merge(existing, pageBlock);
    const saved = await repo.save(merged);

    return PageBlockMapper.toModel(saved);
  }

  async reorder(
    pageId: string,
    items: ReorderPageBlockItemDto[],
    manager?: EntityManager,
  ): Promise<PageBlockModel[]> {
    const repo = this.resolveRepo(manager);

    if (!items.length) {
      return [];
    }

    const ids = items.map((item) => item.id);
    const uniqueIds = new Set(ids);
    const uniqueOrderIndexes = new Set(items.map((item) => item.order_index));

    if (uniqueIds.size !== items.length) {
      throw new BadRequestException('Duplicate page block ids are not allowed');
    }

    if (uniqueOrderIndexes.size !== items.length) {
      throw new BadRequestException(
        'Duplicate page block order indexes are not allowed',
      );
    }

    const existing = await repo
      .createQueryBuilder('block')
      .where('block.page_id = :pageId', { pageId })
      .andWhere('block.id IN (:...ids)', { ids })
      .getMany();

    if (existing.length !== items.length) {
      throw new BadRequestException(
        'All reordered blocks must belong to the requested page',
      );
    }

    for (const [index, item] of items.entries()) {
      await repo.update(
        { id: item.id, page_id: pageId },
        { order_index: -(index + 1) },
      );
    }

    for (const item of items) {
      await repo.update(
        { id: item.id, page_id: pageId },
        { order_index: item.order_index },
      );
    }

    const rows = await repo.find({
      where: { page_id: pageId },
      order: {
        order_index: 'ASC',
        created_at: 'ASC',
      },
    });

    return rows.map((row) => PageBlockMapper.toModel(row));
  }
}
