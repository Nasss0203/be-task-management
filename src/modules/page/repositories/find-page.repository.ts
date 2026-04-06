import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Page } from '../domain/entities/page.entity';
import { PageModel } from '../domain/models/page.model';
import { FindPageRepository } from '../interfaces/repositories/find-page.repository.interface';
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
