import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { PageBlock } from '../domain/entities/page_block.entity';
import { PageBlockModel } from '../domain/models/page_block.model';
import {
  CreatePageBlockRepository,
  SavePageBlockInput,
} from '../interfaces/repositories/create.page_block.repository.interface';
import { PageBlockMapper } from '../mapper/page_block.mapper';

@Injectable()
export class CreatePageBlockRepositoryImpl implements CreatePageBlockRepository {
  constructor(
    @InjectRepository(PageBlock)
    private readonly repo: Repository<PageBlock>,
  ) {}

  private resolveRepo(manager?: EntityManager): Repository<PageBlock> {
    return manager ? manager.getRepository(PageBlock) : this.repo;
  }
  async save(
    page: PageBlockModel | SavePageBlockInput,
    manager: EntityManager,
  ): Promise<PageBlockModel> {
    const repo = this.resolveRepo(manager);
    const entity = PageBlockMapper.toEntity(page);
    const saved = await repo.save(entity);

    return PageBlockMapper.toModel(saved);
  }
}
