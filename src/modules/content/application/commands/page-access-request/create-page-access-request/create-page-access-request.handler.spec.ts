import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { CreatePageAccessRequestCommand } from './create-page-access-request.command';
import { CreatePageAccessRequestHandler } from './create-page-access-request.handler';

const site = { subdomain: 'acme', path: '/roadmap' };

describe('CreatePageAccessRequestHandler from a published site', () => {
  let publishedSite: { getId: () => string; getAllowUpdates: () => boolean };
  let resolvedPageId: string;
  let accessRequests: {
    findPendingByPageAndUser: jest.Mock;
    save: jest.Mock;
  };
  let authorization: { authorize: jest.Mock };
  let handler: CreatePageAccessRequestHandler;

  beforeEach(() => {
    publishedSite = { getId: () => 'site', getAllowUpdates: () => true };
    resolvedPageId = 'page';
    accessRequests = {
      findPendingByPageAndUser: jest.fn().mockResolvedValue(null),
      save: jest.fn((request: unknown) => Promise.resolve(request)),
    };
    authorization = { authorize: jest.fn().mockResolvedValue(false) };

    handler = new CreatePageAccessRequestHandler(
      accessRequests as never,
      { findById: jest.fn() } as never,
      {
        findById: jest.fn().mockResolvedValue({
          getWorkspaceId: () => 'workspace',
        }),
      } as never,
      { findByPageId: jest.fn() } as never,
      { findReviewerIds: jest.fn().mockResolvedValue([]) } as never,
      { createNotification: jest.fn() } as never,
      {
        runInTransaction: (work: (manager: unknown) => unknown) => work({}),
      } as never,
      authorization as never,
      { verify: jest.fn().mockReturnValue(null) } as never,
      {
        findActiveBySubdomain: jest.fn(() => Promise.resolve(publishedSite)),
      } as never,
      {
        findActiveBySiteAndPath: jest.fn().mockResolvedValue({}),
      } as never,
      {
        resolve: jest.fn(() =>
          Promise.resolve({ page: { getId: () => resolvedPageId } }),
        ),
      } as never,
    );
  });

  it('creates a request when the user cannot edit the page yet', async () => {
    const result = await handler.execute(
      new CreatePageAccessRequestCommand('user', 'page', undefined, site),
    );

    expect(authorization.authorize).toHaveBeenCalledWith(
      expect.objectContaining({ permissions: [PERMISSIONS.PAGE_UPDATE] }),
    );
    expect(result).toMatchObject({ pageId: 'page', userId: 'user' });
  });

  it('rejects sites that do not allow updates', async () => {
    publishedSite = { getId: () => 'site', getAllowUpdates: () => false };

    await expect(
      handler.execute(
        new CreatePageAccessRequestCommand('user', 'page', undefined, site),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(accessRequests.save).not.toHaveBeenCalled();
  });

  it('rejects a page id that is not the page published at that path', async () => {
    resolvedPageId = 'other-page';

    await expect(
      handler.execute(
        new CreatePageAccessRequestCommand('user', 'page', undefined, site),
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('still requires a valid share link without a site', async () => {
    await expect(
      handler.execute(new CreatePageAccessRequestCommand('user', 'page')),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});

describe('CreatePageAccessRequestHandler from a share link', () => {
  let linkAccessLevel: string | null;
  let authorization: { authorize: jest.Mock };
  let notifications: { createNotification: jest.Mock };
  let handler: CreatePageAccessRequestHandler;

  beforeEach(() => {
    linkAccessLevel = 'VIEWER';
    authorization = { authorize: jest.fn().mockResolvedValue(false) };
    notifications = { createNotification: jest.fn().mockResolvedValue({}) };

    handler = new CreatePageAccessRequestHandler(
      {
        findPendingByPageAndUser: jest.fn().mockResolvedValue(null),
        save: jest.fn((request: unknown) => Promise.resolve(request)),
      } as never,
      {
        findById: jest.fn().mockResolvedValue({
          getRevokedAt: () => null,
          getExpiresAt: () => null,
          getPageId: () => 'page',
        }),
      } as never,
      {
        findById: jest.fn().mockResolvedValue({
          getWorkspaceId: () => 'workspace',
        }),
      } as never,
      {
        findByPageId: jest.fn(() => Promise.resolve({ linkAccessLevel })),
      } as never,
      { findReviewerIds: jest.fn().mockResolvedValue(['owner']) } as never,
      notifications as never,
      {
        runInTransaction: (work: (manager: unknown) => unknown) => work({}),
      } as never,
      authorization as never,
      { verify: jest.fn().mockReturnValue({ linkId: 'link' }) } as never,
      {} as never,
      {} as never,
      {} as never,
    );
  });

  it('lets a view-only link visitor ask to edit and tells the owner it is an edit request', async () => {
    await handler.execute(
      new CreatePageAccessRequestCommand(
        'user',
        'page',
        'tok',
        undefined,
        'edit',
      ),
    );

    expect(authorization.authorize).toHaveBeenCalledWith(
      expect.objectContaining({ permissions: [PERMISSIONS.PAGE_UPDATE] }),
    );
    expect(notifications.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        receiverId: 'owner',
        title: 'Page edit access request',
        metadata: expect.objectContaining({
          requestedAccessLevel: 'EDITOR',
        }) as unknown,
      }),
    );
  });

  it('still refuses a view request while the link already gives view access', async () => {
    await expect(
      handler.execute(
        new CreatePageAccessRequestCommand('user', 'page', 'tok'),
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('refuses an edit request when the link already allows editing', async () => {
    linkAccessLevel = 'EDITOR';

    await expect(
      handler.execute(
        new CreatePageAccessRequestCommand(
          'user',
          'page',
          'tok',
          undefined,
          'edit',
        ),
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('refuses an edit request from someone who can already edit', async () => {
    authorization.authorize.mockResolvedValue(true);

    await expect(
      handler.execute(
        new CreatePageAccessRequestCommand(
          'user',
          'page',
          'tok',
          undefined,
          'edit',
        ),
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
