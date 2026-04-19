import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { PageBlock } from '../domain/entities/page_block.entity';
import { PageBlockModel } from '../domain/models/page_block.model';
import { FindPageBlockRepository } from '../interfaces/repositories/find.page_block.repository.interface';
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
}
