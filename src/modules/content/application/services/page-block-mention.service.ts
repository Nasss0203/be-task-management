import { Inject, Injectable, Logger } from '@nestjs/common';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import type { PageBlock } from 'src/modules/content/domain/entities/page-block.entity';
import type { PageRepository } from 'src/modules/content/domain/repositories/page.repository';
import { SyncMentionsService } from 'src/modules/mentions/application/services/sync-mentions.service';
import { MentionEntityType } from 'src/modules/mentions/domain/enums/mention-entity-type.enum';
import { MentionSourceType } from 'src/modules/mentions/domain/enums/mention-source-type.enum';
import type { MentionRepository } from 'src/modules/mentions/domain/repositories/mention.repository';
import { MENTION_TYPES } from 'src/modules/mentions/mentions.types';
import type { UpdateNotificationService } from 'src/modules/notifications/application/ports/update-notification.service.port';
import {
  NotificationSourceType,
  NotificationType,
} from 'src/modules/notifications/domain/entities/notification.entity';
import { NOTIFICATION_TYPES } from 'src/modules/notifications/notifications.types';

export function blockText(block: PageBlock): string | null {
  const content = block.getContent();

  if (!content || typeof content !== 'object' || Array.isArray(content)) {
    return null;
  }

  const text = (content as Record<string, unknown>).text;

  return typeof text === 'string' ? text : null;
}

export function blockActionUrl(block: PageBlock): string {
  const pageUrl = `/page/${block.getPageId()}`;
  const rowId = block.getRowId();

  return rowId
    ? `${pageUrl}?row=${rowId}#block-${block.getId()}`
    : `${pageUrl}#block-${block.getId()}`;
}

@Injectable()
export class PageBlockMentionService {
  private readonly logger = new Logger(PageBlockMentionService.name);

  constructor(
    private readonly syncMentions: SyncMentionsService,
    @Inject(CONTENT_TYPES.repositories.PageRepository)
    private readonly pageRepo: PageRepository,
    @Inject(MENTION_TYPES.repositories.MentionRepository)
    private readonly mentionRepo: MentionRepository,
    @Inject(NOTIFICATION_TYPES.services.UpdateNotificationService)
    private readonly notificationUpdates: UpdateNotificationService,
  ) {}

  async afterSave(block: PageBlock, actorId: string): Promise<void> {
    const text = blockText(block);

    if (text === null) return;

    try {
      const page = await this.pageRepo.findById(block.getPageId());

      if (!page) return;

      await this.syncMentions.sync({
        workspaceId: page.getWorkspaceId(),
        pageId: page.getId(),
        actorId,
        sourceType: MentionSourceType.PAGE_BLOCK,
        sourceId: block.getId(),
        entityType: MentionEntityType.PAGE_BLOCK,
        entityId: block.getId(),
        body: text,
        actionUrl: blockActionUrl(block),
        notifyAs: {
          type: NotificationType.PAGE_MENTIONED,
          sourceType: NotificationSourceType.PAGE_BLOCK,
          place: page.getTitle().trim() || 'a page',
        },
      });
    } catch (error) {
      this.logger.error(
        `Page block ${block.getId()} saved but mentions failed`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  async afterDelete(blockIds: string[]): Promise<void> {
    if (blockIds.length === 0) return;

    try {
      await this.mentionRepo.deleteBySources(
        MentionSourceType.PAGE_BLOCK,
        blockIds,
      );
      await this.notificationUpdates.archiveBySources(
        NotificationSourceType.PAGE_BLOCK,
        blockIds,
      );
    } catch (error) {
      this.logger.error(
        `Page blocks ${blockIds.join(', ')} deleted but mention cleanup failed`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
