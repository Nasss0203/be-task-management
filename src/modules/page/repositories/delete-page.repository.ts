import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Page } from '../domain/entities/page.entity';
import { DeletePageRepository } from '../interfaces/repositories/delete-page.repository.interface';

@Injectable()
export class DeletePageRepositoryImpl implements DeletePageRepository {
  constructor(
    @InjectRepository(Page)
    private readonly repo: Repository<Page>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<Page> {
    return manager ? manager.getRepository(Page) : this.repo;
  }

  async softDeletePage(
    input: {
      pageId: string;
      deletedBy: string;
    },
    manager?: EntityManager,
  ): Promise<void> {
    const repo = this.getRepo(manager);

    await repo.update(
      { id: input.pageId },
      {
        deletedAt: new Date(),
        deletedBy: input.deletedBy,
      },
    );
  }

  async restorePage(
    input: {
      pageId: string;
    },
    manager?: EntityManager,
  ): Promise<void> {
    const repo = this.getRepo(manager);

    await repo.update(
      { id: input.pageId },
      {
        deletedAt: null,
        deletedBy: null,
      },
    );
  }
}
