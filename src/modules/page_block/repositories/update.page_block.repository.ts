import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { PageBlock } from '../domain/entities/page_block.entity';
import { PageBlockModel } from '../domain/models/page_block.model';
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
}
