import { ForbiddenException, NotFoundException } from '@nestjs/common';
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
