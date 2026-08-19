import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { type UnitOfWork } from 'src/interface/index.interface';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import { PageBlockResponseDto } from '../dto/response/page_block.response.dto';
import { ReorderPageBlockDto } from '../dto/reorder-page_block.dto';
import { UpdatePageBlockDto } from '../dto/update-page_block.dto';
import { UpdatePageBlockApplication } from '../interfaces/applications/update.page_block.application.interface';
import { type UpdatePageBlockService } from '../interfaces/services/update.page_block.service.interface';
import { PAGE_BLOCK_TYPES } from '../interfaces/types';
import { PageBlockMapper } from '../mapper/page_block.mapper';

@Injectable()
export class UpdatePageBlockApplicationImpl implements UpdatePageBlockApplication {
  constructor(
    @Inject(PAGE_BLOCK_TYPES.services.UpdatePageBlockService)
    private readonly updatePageBlockService: UpdatePageBlockService,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
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

  async reorder(dto: ReorderPageBlockDto): Promise<PageBlockResponseDto[]> {
    return this.uow.runInTransaction(async (manager) => {
      if (!dto.page_id) {
        throw new HttpException('Page id is required', HttpStatus.BAD_REQUEST);
      }

      const blocks = await this.updatePageBlockService.reorder(dto, manager);

      return blocks.map((block) => PageBlockMapper.toResponse(block));
    });
  }
}
