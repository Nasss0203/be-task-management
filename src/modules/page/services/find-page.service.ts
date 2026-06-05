import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { PageModel } from '../domain/models/page.model';
import {
  PageRestoreLookup,
  type FindPageRepository,
} from '../interfaces/repositories/find-page.repository.interface';
import { FindPageService } from '../interfaces/services/find-page.service.interface';
import { PAGE_TYPES } from '../interfaces/types';

@Injectable()
export class FindPageServiceImpl implements FindPageService {
  constructor(
    @Inject(PAGE_TYPES.repositories.FindPageRepository)
    private readonly findPageRepository: FindPageRepository,
  ) {}

  findPageById(pageId: string, manager?: EntityManager): Promise<PageModel> {
    return this.findPageRepository.findPageById(pageId, manager);
  }

  findDeletedPages(
    workspaceId: string,
    manager?: EntityManager,
  ): Promise<PageModel[]> {
    return this.findPageRepository.findDeletedPages(workspaceId, manager);
  }
  findOnePageForRestore(
    workspaceId: string,
    pageId: string,
    manager?: EntityManager,
  ): Promise<PageRestoreLookup | null> {
    return this.findPageRepository.findOnePageForRestore(
      workspaceId,
      pageId,
      manager,
    );
  }
  async findPageByWorkspaceId(
    userId: string,
    workspaceId: string,
    manager?: EntityManager,
  ): Promise<PageModel> {
    const pages = await this.findPageRepository.findPageByWorkspaceId(
      userId,
      workspaceId,
      manager,
    );

    return pages;
  }
}
