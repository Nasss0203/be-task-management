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
import { DeletePageApplication } from '../interfaces/applications/delete-page.application.interface';
import { type DeletePageService } from '../interfaces/services/delete-page.service.interface';
import { type FindPageService } from '../interfaces/services/find-page.service.interface';
import { PAGE_TYPES } from '../interfaces/types';

@Injectable()
export class DeletePageApplicationImpl implements DeletePageApplication {
  constructor(
    @Inject(PAGE_TYPES.services.FindPageService)
    private readonly findPageService: FindPageService,

    @Inject(PAGE_TYPES.services.DeletePageService)
    private readonly deletePageService: DeletePageService,

    @Inject(ACTIVITY_TYPES.services.CreateActivityService)
    private readonly createActivityService: CreateActivityService,
  ) {}

  async delete(input: {
    workspaceId: string;
    pageId: string;
    userId: string;
  }): Promise<void> {
    const page = await this.findPageService.findOnePageForRestore(
      input.workspaceId,
      input.pageId,
    );

    if (!page) {
      throw new NotFoundException('Page not found');
    }

    if (page.deletedAt) {
      throw new BadRequestException('Page is already deleted');
    }

    if (page.workspaceDeletedAt) {
      throw new BadRequestException(
        'Cannot delete page because workspace is deleted',
      );
    }

    await this.deletePageService.softDeletePage({
      pageId: input.pageId,
      deletedBy: input.userId,
    });

    await this.createActivityService.create({
      workspaceId: input.workspaceId,
      entityType: ActivityEntityType.PAGE,
      entityId: input.pageId,
      actorId: input.userId,
      action: ActivityAction.PAGE_DELETED,
    });
  }

  async restore(input: {
    workspaceId: string;
    pageId: string;
    userId: string;
  }): Promise<void> {
    const page = await this.findPageService.findOnePageForRestore(
      input.workspaceId,
      input.pageId,
    );

    if (!page) {
      throw new NotFoundException('Page not found');
    }

    if (!page.deletedAt) {
      throw new BadRequestException('Page is not deleted');
    }

    if (page.workspaceDeletedAt) {
      throw new BadRequestException(
        'Cannot restore page because workspace is deleted',
      );
    }

    await this.deletePageService.restorePage({
      pageId: input.pageId,
    });

    await this.createActivityService.create({
      workspaceId: input.workspaceId,
      entityType: ActivityEntityType.PAGE,
      entityId: input.pageId,
      actorId: input.userId,
      action: ActivityAction.PAGE_RESTORED,
    });
  }
}
