import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Page } from '../domain/entities/page.entity';
import { PageModel } from '../domain/models/page.model';
import {
  PageRepository,
  SavePageInput,
} from '../interfaces/repositories/page.repository.interface';
import { PageMapper } from '../mapper/page.mapper';

@Injectable()
export class PageRepositoryImpl implements PageRepository {
  constructor(
    @InjectRepository(Page)
    private readonly repo: Repository<Page>,
  ) {}

  private resolveRepo(manager?: EntityManager): Repository<Page> {
    return manager ? manager.getRepository(Page) : this.repo;
  }
  async save(
    page: PageModel | SavePageInput,
    manager: EntityManager,
  ): Promise<PageModel> {
    const repo = this.resolveRepo(manager);
    const entity = PageMapper.toEntity(page);
    const saved = await repo.save(entity);

    return PageMapper.toModel(saved);
  }
}
