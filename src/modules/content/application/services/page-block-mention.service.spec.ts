import { PageBlock } from 'src/modules/content/domain/entities/page-block.entity';
import type { PageRepository } from 'src/modules/content/domain/repositories/page.repository';
import type { SyncMentionsService } from 'src/modules/mentions/application/services/sync-mentions.service';
import { MentionEntityType } from 'src/modules/mentions/domain/enums/mention-entity-type.enum';
import { MentionSourceType } from 'src/modules/mentions/domain/enums/mention-source-type.enum';
import type { MentionRepository } from 'src/modules/mentions/domain/repositories/mention.repository';
import type { UpdateNotificationService } from 'src/modules/notifications/application/ports/update-notification.service.port';
import {
  NotificationSourceType,
  NotificationType,
} from 'src/modules/notifications/domain/entities/notification.entity';
import { PageBlockType } from 'src/shared/domain/page-block-type.enum';
import type { PageBlockJson } from 'src/shared/domain/page-block.types';
import {
  blockActionUrl,
  PageBlockMentionService,
} from './page-block-mention.service';

const LAN = '11111111-1111-4111-8111-111111111111';

const textBlock = (content: PageBlockJson, rowId: string | null = null) =>
  PageBlock.create({
    pageId: 'page-1',
    rowId,
    type: PageBlockType.TEXT,
    createdBy: 'owner',
    content,
  });

function setup(title = 'Roadmap') {
  const syncMentions = { sync: jest.fn().mockResolvedValue([]) };
  const pageRepo = {
    findById: jest.fn().mockResolvedValue({
      getId: () => 'page-1',
      getWorkspaceId: () => 'ws-1',
      getTitle: () => title,
    }),
  };
  const mentionRepo = { deleteBySources: jest.fn() };
  const notificationUpdates = { archiveBySources: jest.fn() };

  const service = new PageBlockMentionService(
    syncMentions as unknown as SyncMentionsService,
    pageRepo as unknown as PageRepository,
    mentionRepo as unknown as MentionRepository,
    notificationUpdates as unknown as UpdateNotificationService,
  );

  return { service, syncMentions, pageRepo, mentionRepo, notificationUpdates };
}

describe('blockActionUrl', () => {
  it('opens the block on its page, or inside its task', () => {
    const onPage = textBlock({ text: 'x' });
    const inTask = textBlock({ text: 'x' }, 'row-1');

    expect(blockActionUrl(onPage)).toBe(`/page/page-1#block-${onPage.getId()}`);
    expect(blockActionUrl(inTask)).toBe(
      `/page/page-1?row=row-1#block-${inTask.getId()}`,
    );
  });
});

describe('PageBlockMentionService', () => {
  it('syncs the block text as a page mention', async () => {
    const { service, syncMentions } = setup();
    const block = textBlock({ text: `Hỏi @[Lan](user:${LAN})` });

    await service.afterSave(block, 'owner');

    expect(syncMentions.sync).toHaveBeenCalledWith({
      workspaceId: 'ws-1',
      pageId: 'page-1',
      actorId: 'owner',
      sourceType: MentionSourceType.PAGE_BLOCK,
      sourceId: block.getId(),
      entityType: MentionEntityType.PAGE_BLOCK,
      entityId: block.getId(),
      body: `Hỏi @[Lan](user:${LAN})`,
      actionUrl: `/page/page-1#block-${block.getId()}`,
      notifyAs: {
        type: NotificationType.PAGE_MENTIONED,
        sourceType: NotificationSourceType.PAGE_BLOCK,
        place: 'Roadmap',
      },
    });
  });

  it('names an untitled page "a page"', async () => {
    const { service, syncMentions } = setup('  ');

    await service.afterSave(textBlock({ text: 'x' }), 'owner');

    expect(syncMentions.sync).toHaveBeenCalledWith(
      expect.objectContaining({
        notifyAs: expect.objectContaining({ place: 'a page' }) as unknown,
      }),
    );
  });

  it('skips blocks without text', async () => {
    const { service, syncMentions, pageRepo } = setup();

    await service.afterSave(textBlock(null), 'owner');
    await service.afterSave(textBlock({ url: 'https://x.dev' }), 'owner');
    await service.afterSave(textBlock([{ text: 'x' }]), 'owner');

    expect(pageRepo.findById).not.toHaveBeenCalled();
    expect(syncMentions.sync).not.toHaveBeenCalled();
  });

  it('never fails the save when notifying fails', async () => {
    const { service, syncMentions } = setup();
    syncMentions.sync.mockRejectedValue(new Error('db down'));
    jest.spyOn(service['logger'], 'error').mockImplementation(() => undefined);

    await expect(
      service.afterSave(textBlock({ text: 'x' }), 'owner'),
    ).resolves.toBeUndefined();
  });

  it('drops mentions and hides notifications of deleted blocks', async () => {
    const { service, mentionRepo, notificationUpdates } = setup();

    await service.afterDelete(['b-1', 'b-2']);
    await service.afterDelete([]);

    expect(mentionRepo.deleteBySources).toHaveBeenCalledTimes(1);
    expect(mentionRepo.deleteBySources).toHaveBeenCalledWith(
      MentionSourceType.PAGE_BLOCK,
      ['b-1', 'b-2'],
    );
    expect(notificationUpdates.archiveBySources).toHaveBeenCalledWith(
      NotificationSourceType.PAGE_BLOCK,
      ['b-1', 'b-2'],
    );
  });
});
