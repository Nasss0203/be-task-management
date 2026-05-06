import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { type DeletePageRepository } from '../interfaces/repositories/delete-page.repository.interface';
import { DeletePageService } from '../interfaces/services/delete-page.service.interface';
import { PAGE_TYPES } from '../interfaces/types';

@Injectable()
export class DeletePageServiceImpl implements DeletePageService {
  constructor(
    @Inject(PAGE_TYPES.repositories.DeletePageRepository)
    private readonly deletePageRepository: DeletePageRepository,
  ) {}

  softDeletePage(
    input: {
      pageId: string;
      deletedBy: string;
    },
    manager?: EntityManager,
  ): Promise<void> {
    return this.deletePageRepository.softDeletePage(input, manager);
  }

  restorePage(
    input: {
      pageId: string;
    },
    manager?: EntityManager,
  ): Promise<void> {
    return this.deletePageRepository.restorePage(input, manager);
  }
}
