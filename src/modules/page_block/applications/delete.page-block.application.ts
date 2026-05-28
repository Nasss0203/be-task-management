import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ActivityAction,
  ActivityEntityType,
} from 'src/modules/activity/domain/entities/activity.entity';
import { type CreateActivityService } from 'src/modules/activity/interfaces/services/create-activity.service.interface';
import { ACTIVITY_TYPES } from 'src/modules/activity/interfaces/types';
import { PAGE_BLOCK_TYPES } from '../interfaces/types';
import { DeletePageBlockApplication } from '../interfaces/applications/delete.page-block.application.interface';
import { type FindPageBlockService } from '../interfaces/services/find.page_block.service.interface';
import { type DeletePageBlockService } from '../interfaces/services/delete.page-block.service.interface';

@Injectable()
export class DeletePageBlockApplicationImpl implements DeletePageBlockApplication {
  constructor(
    @Inject(PAGE_BLOCK_TYPES.services.FindPageBlockService)
    private readonly findPageBlockService: FindPageBlockService,

    @Inject(PAGE_BLOCK_TYPES.services.DeletePageBlockService)
    private readonly deletePageBlockService: DeletePageBlockService,

    @Inject(ACTIVITY_TYPES.services.CreateActivityService)
    private readonly createActivityService: CreateActivityService,
  ) {}

  async delete(input: {
    workspaceId: string;
    blockId: string;
    userId: string;
  }): Promise<void> {
    const block = await this.findPageBlockService.findOnePageBlockForRestore(
      input.workspaceId,
      input.blockId,
    );

    if (!block) {
      throw new NotFoundException('Page block not found');
    }

    if (block.deletedAt) {
      throw new BadRequestException('Page block is already deleted');
    }

    if (block.workspaceDeletedAt) {
      throw new BadRequestException(
        'Cannot delete page block because workspace is deleted',
      );
    }

    if (block.pageDeletedAt) {
      throw new BadRequestException(
        'Cannot delete page block because page is deleted',
      );
    }

    await this.deletePageBlockService.softDeletePageBlock({
      blockId: input.blockId,
      deletedBy: input.userId,
    });

    await this.createActivityService.create({
      workspaceId: input.workspaceId,
      entityType: ActivityEntityType.PAGE_BLOCK,
      entityId: input.blockId,
      actorId: input.userId,
      action: ActivityAction.PAGE_BLOCK_DELETED,
      metadata: {
        pageId: block.pageId,
      },
    });
  }

  async restore(input: {
    workspaceId: string;
    blockId: string;
    userId: string;
  }): Promise<void> {
    const block = await this.findPageBlockService.findOnePageBlockForRestore(
      input.workspaceId,
      input.blockId,
    );

    if (!block) {
      throw new NotFoundException('Page block not found');
    }

    if (!block.deletedAt) {
      throw new BadRequestException('Page block is not deleted');
    }

    if (block.workspaceDeletedAt) {
      throw new BadRequestException(
        'Cannot restore page block because workspace is deleted',
      );
    }

    if (block.pageDeletedAt) {
      throw new BadRequestException(
        'Cannot restore page block because page is deleted',
      );
    }

    await this.deletePageBlockService.restorePageBlock({
      blockId: input.blockId,
    });
  }
}
