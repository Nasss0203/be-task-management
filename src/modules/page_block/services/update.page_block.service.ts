import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { PageBlockModel } from '../domain/models/page_block.model';
import { ReorderPageBlockDto } from '../dto/reorder-page_block.dto';
import { UpdatePageBlockDto } from '../dto/update-page_block.dto';
import {
  type UpdatePageBlockInput,
  type UpdatePageBlockRepository,
} from '../interfaces/repositories/update.page_block.repository.interface';
import { UpdatePageBlockService } from '../interfaces/services/update.page_block.service.interface';
import { PAGE_BLOCK_TYPES } from '../interfaces/types';

@Injectable()
export class UpdatePageBlockServiceImpl implements UpdatePageBlockService {
  constructor(
    @Inject(PAGE_BLOCK_TYPES.repositories.UpdatePageBlockRepository)
    private readonly repo: UpdatePageBlockRepository,
  ) {}

  update(
    updatePageBlockDto: UpdatePageBlockDto,
    manager: EntityManager,
  ): Promise<PageBlockModel> {
    if (!updatePageBlockDto.id) {
      throw new BadRequestException('Page block id is required');
    }

    const payload: UpdatePageBlockInput = {
      id: updatePageBlockDto.id,
      ...(updatePageBlockDto.title !== undefined && {
        title: updatePageBlockDto.title,
      }),
      ...(updatePageBlockDto.type !== undefined && {
        type: updatePageBlockDto.type,
      }),
      ...(updatePageBlockDto.position_x !== undefined && {
        position_x: updatePageBlockDto.position_x,
      }),
      ...(updatePageBlockDto.position_y !== undefined && {
        position_y: updatePageBlockDto.position_y,
      }),
      ...(updatePageBlockDto.width !== undefined && {
        width: updatePageBlockDto.width,
      }),
      ...(updatePageBlockDto.height !== undefined && {
        height: updatePageBlockDto.height,
      }),
      ...(updatePageBlockDto.order_index !== undefined && {
        order_index: updatePageBlockDto.order_index,
      }),
      ...(updatePageBlockDto.content !== undefined && {
        content: updatePageBlockDto.content,
      }),
      ...(updatePageBlockDto.style_config !== undefined && {
        style_config: updatePageBlockDto.style_config,
      }),
      ...(updatePageBlockDto.data_config !== undefined && {
        data_config: updatePageBlockDto.data_config,
      }),
      ...(updatePageBlockDto.is_open !== undefined && {
        is_open: updatePageBlockDto.is_open,
      }),
    };

    return this.repo.save(payload, manager);
  }

  reorder(
    dto: ReorderPageBlockDto,
    manager: EntityManager,
  ): Promise<PageBlockModel[]> {
    return this.repo.reorder(dto.page_id, dto.items, manager);
  }
}
