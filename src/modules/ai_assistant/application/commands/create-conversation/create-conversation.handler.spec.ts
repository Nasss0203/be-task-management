import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import type { Page } from 'src/modules/content/domain/aggregates/page/page.aggregate';
import type { PageRepository } from 'src/modules/content/domain/repositories/page.repository';
import type { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import type { AiConversation } from '../../../domain/aggregates/ai-conversation/ai-conversation.aggregate';
import { AiConversationScope } from '../../../domain/enums/ai-conversation-scope.enum';
import type { AiConversationRepository } from '../../../domain/repositories/ai-conversation.repository';
import { CreateAiConversationRequestDto } from '../../dto/request/create-ai-conversation.request.dto';
import { AiConversationAccessService } from '../../services/ai-conversation-access.service';
import { CreateConversationCommand } from './create-conversation.command';
import { CreateConversationHandler } from './create-conversation.handler';

function fixture() {
  const page = {
    getId: () => 'page-1',
    getWorkspaceId: () => 'workspace-1',
    getDeletedAt: () => null,
  } as unknown as Page;
  const findById = jest.fn().mockResolvedValue(page);
  const authorize = jest.fn().mockResolvedValue(true);
  const save = jest.fn(async (conversation: AiConversation) => conversation);
  const access = new AiConversationAccessService(
    { findById } as unknown as PageRepository,
    { authorize } as unknown as AuthorizationService,
  );
  const handler = new CreateConversationHandler(
    { save } as unknown as AiConversationRepository,
    access,
  );
  return { handler, authorize, findById, save };
}

describe('CreateConversationHandler', () => {
  it('keeps the existing request shape working as GLOBAL', async () => {
    const f = fixture();
    const context = {};
    const result = await f.handler.execute(
      new CreateConversationCommand('user-1', 'workspace-1', 'AI Assistant'),
      context,
    );
    expect(result).toMatchObject({
      scope: 'GLOBAL',
      workspace_id: 'workspace-1',
      page_id: null,
      title: 'AI Assistant',
      status: 'ACTIVE',
    });
    expect(f.authorize).toHaveBeenCalledWith({
      userId: 'user-1',
      permissions: [PERMISSIONS.WORKSPACE_READ],
      target: { type: 'workspace', id: 'workspace-1' },
    });
    expect(f.findById).not.toHaveBeenCalled();
    expect(f.save).toHaveBeenCalledWith(expect.anything(), context);
  });

  it('resolves PAGE workspace and permits a shared user using only PAGE_READ', async () => {
    const f = fixture();
    f.authorize.mockImplementation(
      async ({ target }) => target.type === 'page',
    );
    const context = {};
    const result = await f.handler.execute(
      new CreateConversationCommand(
        'guest-1',
        null,
        null,
        AiConversationScope.PAGE,
        'page-1',
        'share-token',
      ),
      context,
    );
    expect(result).toMatchObject({
      scope: 'PAGE',
      workspace_id: 'workspace-1',
      page_id: 'page-1',
    });
    expect(f.findById).toHaveBeenCalledWith('page-1', context);
    expect(f.authorize).toHaveBeenCalledTimes(1);
    expect(f.authorize).toHaveBeenCalledWith({
      userId: 'guest-1',
      permissions: [PERMISSIONS.PAGE_READ],
      target: { type: 'page', id: 'page-1' },
      shareToken: 'share-token',
    });
    expect(f.save.mock.calls[0][0].getUserId()).toBe('guest-1');
  });

  it('accepts an explicitly matching PAGE workspace', async () => {
    const f = fixture();
    await expect(
      f.handler.execute(
        new CreateConversationCommand(
          'user-1',
          'workspace-1',
          null,
          AiConversationScope.PAGE,
          'page-1',
        ),
      ),
    ).resolves.toMatchObject({ page_id: 'page-1' });
  });

  it.each([
    new CreateConversationCommand(
      'user-1',
      'workspace-1',
      null,
      AiConversationScope.PAGE,
    ),
    new CreateConversationCommand(
      'user-1',
      'workspace-2',
      null,
      AiConversationScope.PAGE,
      'page-1',
    ),
    new CreateConversationCommand('user-1', null, null),
    new CreateConversationCommand(
      'user-1',
      'workspace-1',
      null,
      AiConversationScope.GLOBAL,
      'page-1',
    ),
    new CreateConversationCommand(
      'user-1',
      'workspace-1',
      null,
      AiConversationScope.LEGACY,
    ),
  ])(
    'rejects invalid scope/workspace/page combinations without saving (%j)',
    async (command) => {
      const f = fixture();
      await expect(f.handler.execute(command)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(f.save).not.toHaveBeenCalled();
    },
  );

  it('rejects a nonexistent PAGE', async () => {
    const f = fixture();
    f.findById.mockResolvedValue(null);
    await expect(
      f.handler.execute(
        new CreateConversationCommand(
          'user-1',
          null,
          null,
          AiConversationScope.PAGE,
          'missing',
        ),
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(f.save).not.toHaveBeenCalled();
  });

  it.each([
    new CreateConversationCommand('user-1', 'workspace-1', null),
    new CreateConversationCommand(
      'user-1',
      null,
      null,
      AiConversationScope.PAGE,
      'page-1',
    ),
  ])(
    'rejects denied workspace/page access without saving (%j)',
    async (command) => {
      const f = fixture();
      f.authorize.mockResolvedValue(false);
      await expect(f.handler.execute(command)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(f.save).not.toHaveBeenCalled();
    },
  );

  it.each(['LEGACY', 'INVALID', null])(
    'rejects scope %s at the HTTP DTO boundary',
    async (scope) => {
      const errors = await validate(
        plainToInstance(CreateAiConversationRequestDto, {
          workspaceId: '550e8400-e29b-41d4-a716-446655440000',
          scope,
        }),
      );
      expect(errors.some((error) => error.property === 'scope')).toBe(true);
    },
  );

  it('accepts the old HTTP DTO and rejects malformed page ids', async () => {
    expect(
      await validate(
        plainToInstance(CreateAiConversationRequestDto, {
          workspaceId: '550e8400-e29b-41d4-a716-446655440000',
        }),
      ),
    ).toEqual([]);
    const errors = await validate(
      plainToInstance(CreateAiConversationRequestDto, {
        scope: 'PAGE',
        pageId: 'invalid',
      }),
    );
    expect(errors.some((error) => error.property === 'pageId')).toBe(true);
  });
});
