import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Page } from '../domain/entities/page.entity';
import { PageModel } from '../domain/models/page.model';
import {
  FindPageRepository,
  PageRestoreLookup,
} from '../interfaces/repositories/find-page.repository.interface';
import { PageMapper } from '../mapper/page.mapper';

@Injectable()
export class FindPageRepositoryImpl implements FindPageRepository {
  constructor(
    @InjectRepository(Page)
    private readonly repoPage: Repository<Page>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<Page> {
    return manager ? manager.getRepository(Page) : this.repoPage;
  }

  async findDeletedPages(
    workspaceId: string,
    manager?: EntityManager,
  ): Promise<PageModel[]> {
    const repo = this.getRepo(manager);

    const entities = await repo
      .createQueryBuilder('page')
      .withDeleted()
      .innerJoin('page.workspace', 'workspace')
      .leftJoinAndSelect('page.blocks', 'blocks', 'blocks.deleted_at IS NULL')
      .where('page.workspace_id = :workspaceId', { workspaceId })
      .andWhere('page.deleted_at IS NOT NULL')
      .andWhere('workspace.deleted_at IS NULL')
      .orderBy('page.deleted_at', 'DESC')
      .getMany();

    return entities.map((entity) => PageMapper.toModel(entity));
  }

  async findOnePageForRestore(
    workspaceId: string,
    pageId: string,
    manager?: EntityManager,
  ): Promise<PageRestoreLookup | null> {
    const repo = this.getRepo(manager);

    const row = await repo
      .createQueryBuilder('page')
      .withDeleted()
      .innerJoin('page.workspace', 'workspace')
      .select([
        'page.id AS "id"',
        'page.workspace_id AS "workspaceId"',
        'page.deleted_at AS "deletedAt"',
        'workspace.deleted_at AS "workspaceDeletedAt"',
      ])
      .where('page.id = :pageId', { pageId })
      .andWhere('page.workspace_id = :workspaceId', { workspaceId })
      .getRawOne<PageRestoreLookup>();

    return row ?? null;
  }

  async findPageByWorkspaceId(
    userId: string,
    workspaceId: string,
    manager?: EntityManager,
  ): Promise<PageModel> {
    const pages = await this.getRepo(manager).findOne({
      where: {
        created_by: userId,
        workspace_id: workspaceId,
      },
      relations: {
        blocks: true,
      },
    });

    if (!pages) {
      throw new HttpException('Page not found', HttpStatus.NOT_FOUND);
    }

    return PageMapper.toModel(pages);
  }
}
