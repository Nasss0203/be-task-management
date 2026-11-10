import type { FindUserService } from 'src/modules/identity/application/ports/find-user.service.interface';
import type { CreateNotificationService } from 'src/modules/notifications/application/ports/create-notification.service.port';
import {
  NotificationSourceType,
  NotificationType,
} from 'src/modules/notifications/domain/entities/notification.entity';
import { Mention } from '../../domain/entities/mention.entity';
import { MentionEntityType } from '../../domain/enums/mention-entity-type.enum';
import { MentionSourceType } from '../../domain/enums/mention-source-type.enum';
import type { MentionRepository } from '../../domain/repositories/mention.repository';
import { MentionCandidateService } from './mention-candidate.service';
import { SyncMentionsService } from './sync-mentions.service';

const ACTOR = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const LAN = '11111111-1111-4111-8111-111111111111';
const MINH = '22222222-2222-4222-8222-222222222222';
const OUTSIDER = '33333333-3333-4333-8333-333333333333';

const token = (name: string, id: string) => `@[${name}](user:${id})`;

function existingMention(userId: string): Mention {
  return Mention.restore({
    id: `m-${userId}`,
    workspaceId: 'ws-1',
    mentionerId: ACTOR,
    mentionedUserId: userId,
    sourceType: MentionSourceType.COMMENT,
    sourceId: 'comment-1',
    entityType: MentionEntityType.PAGE,
    entityId: 'page-1',
    notificationId: null,
    createdAt: new Date(),
  });
}

function setup(existing: Mention[] = []) {
  const mentionRepo = {
    findBySource: jest.fn(() => Promise.resolve(existing)),
    deleteByIds: jest.fn(() => Promise.resolve()),
    saveMany: jest.fn(() => Promise.resolve()),
  };
  const notifications = {
    createNotification: jest.fn((input: { receiverId: string }) =>
      Promise.resolve({ id: `n-${input.receiverId}` }),
    ),
  };
  // OUTSIDER không thuộc workspace/teamspace hoặc không xem được page
  const candidates = {
    findAllowed: jest.fn((_pageId: string, filter: { userIds: string[] }) =>
      Promise.resolve(
        filter.userIds
          .filter((id) => id !== OUTSIDER)
          .map((id) => ({ id, username: id, email: '', avatarUrl: null })),
      ),
    ),
  };
  const findUser = {
    findUserById: jest.fn(() => Promise.resolve({ username: 'Nam' })),
  };

  const service = new SyncMentionsService(
    mentionRepo as unknown as MentionRepository,
    notifications as unknown as CreateNotificationService,
    findUser as unknown as FindUserService,
    candidates as unknown as MentionCandidateService,
  );

  return { service, mentionRepo, notifications, candidates };
}

const input = (body: string) => ({
  workspaceId: 'ws-1',
  pageId: 'page-1',
  actorId: ACTOR,
  sourceType: MentionSourceType.COMMENT,
  sourceId: 'comment-1',
  entityType: MentionEntityType.PAGE,
  entityId: 'page-1',
  body,
  actionUrl: '/page/page-1',
  notifyAs: {
    type: NotificationType.COMMENT_MENTIONED,
    sourceType: NotificationSourceType.COMMENT,
    place: 'a comment',
  },
});

describe('SyncMentionsService', () => {
  it('notifies allowed users only, never the author or an outsider', async () => {
    const { service, notifications, mentionRepo } = setup();

    const notified = await service.sync(
      input(
        `${token('Lan', LAN)} ${token('Me', ACTOR)} ${token('X', OUTSIDER)}`,
      ),
    );

    expect(notified).toEqual([LAN]);
    expect(notifications.createNotification).toHaveBeenCalledTimes(1);
    expect(notifications.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        receiverId: LAN,
        type: NotificationType.COMMENT_MENTIONED,
        title: 'Nam mentioned you in a comment',
        message: '@Lan @Me @X',
        actionUrl: '/page/page-1',
      }),
    );

    const [saved] = mentionRepo.saveMany.mock.calls[0] as unknown as [
      Mention[],
    ];
    expect(saved.map((mention) => mention.getMentionedUserId())).toEqual([LAN]);
    expect(saved[0].getNotificationId()).toBe(`n-${LAN}`);
  });

  it('on edit only notifies newly added people and forgets removed ones', async () => {
    const { service, notifications, mentionRepo } = setup([
      existingMention(LAN),
    ]);

    const notified = await service.sync(input(token('Minh', MINH)));

    expect(notified).toEqual([MINH]);
    expect(notifications.createNotification).toHaveBeenCalledTimes(1);
    expect(mentionRepo.deleteByIds).toHaveBeenCalledWith([`m-${LAN}`]);
  });

  it('does nothing when the body mentions nobody new', async () => {
    const { service, notifications, candidates } = setup([
      existingMention(LAN),
    ]);

    await expect(service.sync(input(token('Lan', LAN)))).resolves.toEqual([]);
    expect(notifications.createNotification).not.toHaveBeenCalled();

    await service.sync(input('plain text'));
    expect(candidates.findAllowed).toHaveBeenCalledTimes(1);
  });
});
