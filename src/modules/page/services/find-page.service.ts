import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { PageModel } from '../domain/models/page.model';
import { type FindPageRepository } from '../interfaces/repositories/find-page.repository.interface';
import { FindPageService } from '../interfaces/services/find-page.service.interface';
import { PAGE_TYPES } from '../interfaces/types';

@Injectable()
export class FindPageServiceImpl implements FindPageService {
  constructor(
    @Inject(PAGE_TYPES.repositories.FindPageRepository)
    private readonly findPageRepository: FindPageRepository,
  ) {}
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
