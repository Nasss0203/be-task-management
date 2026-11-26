import { ForbiddenException, NotFoundException } from '@nestjs/common';

import { RecordPageVisitCommand } from './record-page-visit.command';
import { RecordPageVisitHandler } from './record-page-visit.handler';

describe('RecordPageVisitHandler', () => {
  const page = {
    getId: () => 'page-1',
    getWorkspaceId: () => 'workspace-1',
  };
  let pageRepo: { findById: jest.Mock };
  let pageVisitRepo: { record: jest.Mock };
  let authorizationService: { authorize: jest.Mock };
  let handler: RecordPageVisitHandler;

  beforeEach(() => {
    pageRepo = { findById: jest.fn().mockResolvedValue(page) };
    pageVisitRepo = { record: jest.fn().mockResolvedValue(undefined) };
    authorizationService = { authorize: jest.fn().mockResolvedValue(true) };
    handler = new RecordPageVisitHandler(
      pageRepo as never,
      pageVisitRepo as never,
      authorizationService as never,
    );
  });

  it('records the visit with the page workspace when the user can read the page', async () => {
    await handler.execute(new RecordPageVisitCommand('user-1', 'page-1'));

    expect(authorizationService.authorize).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        target: { type: 'page', id: 'page-1' },
      }),
    );
    expect(pageVisitRepo.record).toHaveBeenCalledWith({
      userId: 'user-1',
      pageId: 'page-1',
      workspaceId: 'workspace-1',
      visitedAt: expect.any(Date) as Date,
    });
  });

  it('rejects a user who cannot read the page and records nothing', async () => {
    authorizationService.authorize.mockResolvedValue(false);

    await expect(
      handler.execute(new RecordPageVisitCommand('user-1', 'page-1')),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(pageVisitRepo.record).not.toHaveBeenCalled();
  });

  it('rejects a missing or deleted page and records nothing', async () => {
    pageRepo.findById.mockResolvedValue(null);

    await expect(
      handler.execute(new RecordPageVisitCommand('user-1', 'page-1')),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(pageVisitRepo.record).not.toHaveBeenCalled();
  });
});
