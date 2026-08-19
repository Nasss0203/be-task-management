import { Inject, Injectable } from '@nestjs/common';
import { type UnitOfWork } from 'src/interface/index.interface';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import {
  AddDatabaseViewToBlockDto,
  CreatePageBlockDto,
} from '../dto/create-page_block.dto';
import { PageBlockResponseDto } from '../dto/response/page_block.response.dto';
import { CreatePageBlockApplication } from '../interfaces/applications/create-page_block.application.interface';
import { type CreatePageBlockService } from '../interfaces/services/create.page_block.service.interface';
import { PAGE_BLOCK_TYPES } from '../interfaces/types';
import { PageBlockMapper } from '../mapper/page_block.mapper';

@Injectable()
export class CreatePageBlockApplicationImpl implements CreatePageBlockApplication {
  constructor(
    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly uow: UnitOfWork,

    @Inject(PAGE_BLOCK_TYPES.services.CreatePageBlockService)
    private readonly createPageBlockService: CreatePageBlockService,
  ) {}

  async create(dto: CreatePageBlockDto): Promise<PageBlockResponseDto> {
    return this.uow.runInTransaction(async (manager) => {
      const pageBlock = await this.createPageBlockService.create(dto, manager);

      return PageBlockMapper.toResponse(pageBlock);
    });
  }

  async addDatabaseViewToBlock(
    blockId: string,
    newView: AddDatabaseViewToBlockDto,
  ): Promise<PageBlockResponseDto> {
    return this.uow.runInTransaction(async (manager) => {
      const pageBlock =
        await this.createPageBlockService.addDatabaseViewToBlock(
          blockId,
          newView,
          manager,
        );

      return PageBlockMapper.toResponse(pageBlock);
    });
  }
}
