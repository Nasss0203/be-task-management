import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Page } from '../domain/entities/page.entity';
import { PageModel } from '../domain/models/page.model';
import {
  type UpdatePageInput,
  type UpdatePageRepository,
} from '../interfaces/repositories/update-page.repository.interface';
import { PageMapper } from '../mapper/page.mapper';

@Injectable()
export class UpdatePageRepositoryImpl implements UpdatePageRepository {
  constructor(
    @InjectRepository(Page)
    private readonly repo: Repository<Page>,
  ) {}

  private resolveRepo(manager?: EntityManager): Repository<Page> {
    return manager ? manager.getRepository(Page) : this.repo;
  }

  async save(
    page: UpdatePageInput,
    manager?: EntityManager,
  ): Promise<PageModel> {
    const repo = this.resolveRepo(manager);
    const existing = await repo.findOne({
      where: { id: page.id },
      relations: { blocks: true },
    });

    if (!existing || existing.deletedAt) {
      throw new NotFoundException('Page not found');
    }

    const merged = repo.merge(existing, page);
    const saved = await repo.save(merged);

    return PageMapper.toModel(saved);
  }
}
