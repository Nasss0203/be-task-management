import { HttpException, HttpStatus, Inject } from '@nestjs/common';
import { type UnitOfWork } from 'src/interface/index.interface';
import { WORKSPACE_TYPES } from 'src/modules/workspaces/interfaces/types';
import { PageBlockResponseDto } from '../dto/response/page_block.response.dto';
import { UpdatePageBlockDto } from '../dto/update-page_block.dto';
import { UpdatePageBlockApplication } from '../interfaces/applications/update.page_block.application.interface';
import { type UpdatePageBlockService } from '../interfaces/services/update.page_block.service.interface';
import { PAGE_BLOCK_TYPES } from '../interfaces/types';
import { PageBlockMapper } from '../mapper/page_block.mapper';

export class UpdatePageBlockApplicationImpl implements UpdatePageBlockApplication {
  constructor(
    @Inject(PAGE_BLOCK_TYPES.services.UpdatePageBlockService)
    private readonly updatePageBlockService: UpdatePageBlockService,

    @Inject(WORKSPACE_TYPES.uow.UnitOfWork)
    private readonly uow: UnitOfWork,
  ) {}
  async update(
    updatePageBlockDto: UpdatePageBlockDto,
  ): Promise<PageBlockResponseDto> {
    return this.uow.runInTransaction(async (manager) => {
      if (!updatePageBlockDto.id) {
        throw new HttpException(
          'Page block id is required',
          HttpStatus.BAD_REQUEST,
        );
      }

      const updated = await this.updatePageBlockService.update(
        updatePageBlockDto,
        manager,
      );

      return PageBlockMapper.toResponse(updated);
    });
  }
}
