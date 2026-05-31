import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { PageBlockType } from '../domain/entities/page_block.entity';
import { PageBlockModel } from '../domain/models/page_block.model';
import {
  AddDatabaseViewToBlockDto,
  CreatePageBlockDto,
} from '../dto/create-page_block.dto';
import { type CreatePageBlockRepository } from '../interfaces/repositories/create.page_block.repository.interface';

import { type FindPageBlockRepository } from '../interfaces/repositories/find.page_block.repository.interface';
import { type UpdatePageBlockRepository } from '../interfaces/repositories/update.page_block.repository.interface';
import { CreatePageBlockService } from '../interfaces/services/create.page_block.service.interface';
import { PAGE_BLOCK_TYPES } from '../interfaces/types';

@Injectable()
export class CreatePageBlockServiceImpl implements CreatePageBlockService {
  constructor(
    @Inject(PAGE_BLOCK_TYPES.repositories.CreatePageBlockRepository)
    private readonly repo: CreatePageBlockRepository,

    @Inject(PAGE_BLOCK_TYPES.repositories.FindPageBlockRepository)
    private readonly findPageBlockRepository: FindPageBlockRepository,

    @Inject(PAGE_BLOCK_TYPES.repositories.UpdatePageBlockRepository)
    private readonly updatePageBlockRepository: UpdatePageBlockRepository,
  ) {}

  async create(
    createPageBlockDto: CreatePageBlockDto,
    manager: EntityManager,
  ): Promise<PageBlockModel> {
    let orderIndex: number;

    if (createPageBlockDto.insert_after_block_id) {
      const insertAfterBlock =
        await this.findPageBlockRepository.findAllById(
          createPageBlockDto.insert_after_block_id,
          manager,
        );

      if (!insertAfterBlock) {
        throw new NotFoundException('Insert after page block not found');
      }

      if (insertAfterBlock.page_id !== createPageBlockDto.page_id) {
        throw new BadRequestException(
          'Insert after page block must belong to the same page',
        );
      }

      orderIndex = insertAfterBlock.order_index + 1;

      await this.repo.shiftOrderIndexesForInsert(
        createPageBlockDto.page_id,
        orderIndex,
        manager,
      );
    } else {
      orderIndex =
        createPageBlockDto.order_index ??
        (await this.findPageBlockRepository.getNextOrderIndex(
          createPageBlockDto.page_id,
          manager,
        ));

      if (createPageBlockDto.order_index !== undefined) {
        await this.repo.shiftOrderIndexesForInsert(
          createPageBlockDto.page_id,
          orderIndex,
          manager,
        );
      }
    }

    const create = this.repo.save(
      {
        ...createPageBlockDto,
        order_index: orderIndex,
      },
      manager,
    );
    return create;
  }

  async addDatabaseViewToBlock(
    blockId: string,
    // pageId: string,
    newView: AddDatabaseViewToBlockDto,
    manager: EntityManager,
  ): Promise<PageBlockModel> {
    const findPageBlock = await this.findPageBlockRepository.findAllById(
      blockId,
      manager,
    );

    if (!findPageBlock) {
      throw new NotFoundException('Page block not found');
    }

    if (findPageBlock.type !== PageBlockType.DATABASE_VIEW) {
      throw new BadRequestException('Block is not DATABASE_VIEW');
    }

    const currentConfig = Array.isArray(findPageBlock.data_config)
      ? findPageBlock.data_config[0]
      : findPageBlock.data_config;

    if (
      currentConfig &&
      !Array.isArray(currentConfig) &&
      typeof currentConfig === 'object'
    ) {
      const projectId =
        'project_id' in currentConfig ? currentConfig.project_id : null;
      const workspaceId =
        'workspace_id' in currentConfig ? currentConfig.workspace_id : null;

      if (projectId && projectId !== newView.project_id) {
        throw new BadRequestException(
          'Block is already attached to another project',
        );
      }

      if (workspaceId && workspaceId !== newView.workspace_id) {
        throw new BadRequestException(
          'Block is already attached to another workspace',
        );
      }
    }

    const block = await this.updatePageBlockRepository.save(
      {
        id: blockId,
        data_config: {
          project_id: newView.project_id,
          workspace_id: newView.workspace_id,
          default_board_id: newView.board_id,
          default_view_type: newView.view_type,
        },
      },
      manager,
    );

    return block;
  }
}
