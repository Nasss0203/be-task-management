import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { PageBlock } from '../domain/entities/page_block.entity';
import { DeletePageBlockRepository } from '../interfaces/repositories/delete.page-block.repository.interface';


@Injectable()
export class DeletePageBlockRepositoryImpl implements DeletePageBlockRepository {
  constructor(
    @InjectRepository(PageBlock)
    private readonly repo: Repository<PageBlock>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<PageBlock> {
    return manager ? manager.getRepository(PageBlock) : this.repo;
  }

  async softDeletePageBlock(
    input: {
      blockId: string;
      deletedBy: string;
    },
    manager?: EntityManager,
  ): Promise<void> {
    const repo = this.getRepo(manager);

    await repo.update(
      { id: input.blockId },
      {
        deleted_at: new Date(),
        deleted_by: input.deletedBy,
      },
    );
  }

  async restorePageBlock(
    input: {
      blockId: string;
    },
    manager?: EntityManager,
  ): Promise<void> {
    const repo = this.getRepo(manager);

    await repo.update(
      { id: input.blockId },
      {
        deleted_at: null,
        deleted_by: null,
      },
    );
  }
}
