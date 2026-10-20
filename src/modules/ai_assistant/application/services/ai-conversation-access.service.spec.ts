import { ForbiddenException, NotFoundException } from '@nestjs/common';
import type { PageRepository } from 'src/modules/content/domain/repositories/page.repository';
import type { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { AiConversation } from '../../domain/aggregates/ai-conversation/ai-conversation.aggregate';
import { AiConversationScope } from '../../domain/enums/ai-conversation-scope.enum';
import { AiConversationStatus } from '../../domain/enums/ai-conversation-status.enum';
import type { AiConversationRepository } from '../../domain/repositories/ai-conversation.repository';
import type { AiMessageRepository } from '../../domain/repositories/ai-message.repository';
import { ArchiveConversationCommand } from '../commands/archive-conversation/archive-conversation.command';
import { ArchiveConversationHandler } from '../commands/archive-conversation/archive-conversation.handler';
import { GetConversationHandler } from '../queries/get-conversation/get-conversation.handler';
import { GetConversationQuery } from '../queries/get-conversation/get-conversation.query';
import { ListConversationMessagesHandler } from '../queries/list-conversation-messages/list-conversation-messages.handler';
import { ListConversationMessagesQuery } from '../queries/list-conversation-messages/list-conversation-messages.query';
import { ListConversationsHandler } from '../queries/list-conversations/list-conversations.handler';
import { ListConversationsQuery } from '../queries/list-conversations/list-conversations.query';
import { AiConversationAccessService } from './ai-conversation-access.service';

const globalConversation = () =>
  AiConversation.create({
    id: 'global-1',
    userId: 'user-1',
    workspaceId: 'workspace-1',
  });
const pageConversation = () =>
  AiConversation.create({
    id: 'page-chat-1',
    userId: 'user-1',
    workspaceId: 'workspace-1',
    scope: AiConversationScope.PAGE,
    pageId: 'page-1',
  });

function fixture() {
  const findById = jest.fn().mockResolvedValue({
    getId: () => 'page-1',
    getWorkspaceId: () => 'workspace-1',
    getDeletedAt: () => null,
  });
  const authorize = jest.fn().mockResolvedValue(true);
  const access = new AiConversationAccessService(
    { findById } as unknown as PageRepository,
    { authorize } as unknown as AuthorizationService,
  );
  return { findById, authorize, access };
}

describe('AiConversationAccessService', () => {
  it('rejects a different owner before checking resource permissions', async () => {
    const f = fixture();
    await expect(
      f.access.assertCanRead(pageConversation(), 'user-2'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(f.findById).not.toHaveBeenCalled();
    expect(f.authorize).not.toHaveBeenCalled();
  });

  it('permits a page guest without workspace membership', async () => {
    const f = fixture();
    f.authorize.mockImplementation(
      async ({ target, shareToken }) =>
        target.type === 'page' && shareToken === 'token',
    );
    await expect(
      f.access.assertCanRead(pageConversation(), 'user-1', 'token'),
    ).resolves.toBeUndefined();
    expect(f.authorize).toHaveBeenCalledTimes(1);
  });

  it.each(['missing', 'deleted', 'moved', 'revoked'])(
    'hides an inaccessible PAGE (%s)',
    async (state) => {
      const f = fixture();
      if (state === 'missing') f.findById.mockResolvedValue(null);
      if (state === 'deleted')
        f.findById.mockResolvedValue({ getDeletedAt: () => new Date() });
      if (state === 'moved')
        f.findById.mockResolvedValue({
          getId: () => 'page-1',
          getWorkspaceId: () => 'workspace-2',
          getDeletedAt: () => null,
        });
      if (state === 'revoked') f.authorize.mockResolvedValue(false);
      expect(await f.access.canRead(pageConversation(), 'user-1')).toBe(false);
    },
  );

  it('reads nullable-workspace LEGACY data for its owner', async () => {
    const f = fixture();
    const conversation = AiConversation.restore({
      id: 'old',
      userId: 'user-1',
      workspaceId: null,
      title: null,
      status: AiConversationStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await expect(
      f.access.assertCanRead(conversation, 'user-1'),
    ).resolves.toBeUndefined();
    expect(f.authorize).not.toHaveBeenCalled();
  });

  it('does not treat a GLOBAL conversation with a deleted workspace as personal legacy data', async () => {
    const f = fixture();
    const conversation = AiConversation.restore({
      id: 'global',
      userId: 'user-1',
      workspaceId: null,
      scope: AiConversationScope.GLOBAL,
      title: null,
      status: AiConversationStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await expect(
      f.access.assertCanRead(conversation, 'user-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('filters revoked workspace conversations even when listing without workspace filter', async () => {
    const f = fixture();
    f.authorize.mockImplementation(
      async ({ target }) => target.type === 'page',
    );
    const findByUserId = jest
      .fn()
      .mockResolvedValue([globalConversation(), pageConversation()]);
    const handler = new ListConversationsHandler(
      { findByUserId } as unknown as AiConversationRepository,
      {
        findFirstUserContentsByConversationIds: jest.fn().mockResolvedValue(
          new Map([['page-chat-1', 'The permitted page request']]),
        ),
      } as unknown as AiMessageRepository,
      f.access,
    );
    const result = await handler.execute(
      new ListConversationsQuery('user-1', {}, 'token'),
    );
    expect(result.items.map((conversation) => conversation.id)).toEqual([
      'page-chat-1',
    ]);
    expect(result.nextCursor).toBeNull();
    expect(findByUserId).toHaveBeenCalledWith('user-1', {
      limit: 31,
      cursor: undefined,
    });
  });

  it('protects get, archive, and message reads after page permission is revoked', async () => {
    const f = fixture();
    f.authorize.mockResolvedValue(false);
    const save = jest.fn();
    const findByConversationId = jest.fn();
    const repository = {
      findByIdAndUserId: jest.fn().mockResolvedValue(pageConversation()),
      save,
    } as unknown as AiConversationRepository;
    await expect(
      new GetConversationHandler(repository, f.access).execute(
        new GetConversationQuery('user-1', 'page-chat-1'),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      new ArchiveConversationHandler(repository, f.access).execute(
        new ArchiveConversationCommand('user-1', 'page-chat-1'),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      new ListConversationMessagesHandler(
        repository,
        { findByConversationId } as unknown as AiMessageRepository,
        f.access,
      ).execute(new ListConversationMessagesQuery('user-1', 'page-chat-1')),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(save).not.toHaveBeenCalled();
    expect(findByConversationId).not.toHaveBeenCalled();
  });

  it('does not mask repository errors as denied access', async () => {
    const f = fixture();
    f.findById.mockRejectedValue(new Error('Database unavailable'));
    await expect(
      f.access.canRead(pageConversation(), 'user-1'),
    ).rejects.toThrow('Database unavailable');
  });
});
