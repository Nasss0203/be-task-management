import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { PageModel } from '../domain/models/page.model';
import { CreatePageDto } from '../dto/create-page.dto';
import { type PageRepository } from '../interfaces/repositories/page.repository.interface';
import { CreatePageService } from '../interfaces/services/create.page.service.interface';
import { PAGE_TYPES } from '../interfaces/types';

@Injectable()
export class CreatePageServiceImpl implements CreatePageService {
  constructor(
    @Inject(PAGE_TYPES.repositories.PageRepository)
    private readonly repo: PageRepository,
  ) {}
  async create(
    createWorkspaceDto: CreatePageDto,
    manager: EntityManager,
  ): Promise<PageModel> {
    const create = this.repo.save(createWorkspaceDto, manager);

    return create;
  }
}
