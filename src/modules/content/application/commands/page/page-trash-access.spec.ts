import { ForbiddenException } from '@nestjs/common';

import { PermanentlyDeletePageDatabaseCommand } from '../page-database/permanently-delete-page-database/permanently-delete-page-database.command';
import { PermanentlyDeletePageDatabaseHandler } from '../page-database/permanently-delete-page-database/permanently-delete-page-database.handler';
import { DuplicatePageCommand } from './duplicate-page/duplicate-page.command';
import { DuplicatePageHandler } from './duplicate-page/duplicate-page.handler';
import { RestorePageCommand } from './restore-page/restore-page.command';
import { RestorePageHandler } from './restore-page/restore-page.handler';

describe('page trash and duplicate access', () => {
  let teamspaceId: string | null;
  let allowed: boolean;
  let authorize: jest.Mock;
  let pageRepo: {
    lockWorkspaceHierarchy: jest.Mock;
    findById: jest.Mock;
    findDeletedById: jest.Mock;
    restoreHierarchy: jest.Mock;
    save: jest.Mock;
  };
  const uow = {
    runInTransaction: (fn: (context: unknown) => unknown) => fn({}),
  };

  beforeEach(() => {
    teamspaceId = 'teamspace';
    allowed = false;
    authorize = jest.fn(() => Promise.resolve(allowed));
    const page = {
      getWorkspaceId: () => 'workspace',
      getTeamspaceId: () => teamspaceId,
    };
    pageRepo = {
      lockWorkspaceHierarchy: jest.fn(),
      findById: jest.fn().mockResolvedValue(page),
      findDeletedById: jest.fn().mockResolvedValue(page),
      restoreHierarchy: jest.fn(),
      save: jest.fn(),
    };
  });

  describe('restore', () => {
    const restore = () =>
      new RestorePageHandler(
        pageRepo as never,
        uow as never,
        { record: jest.fn() } as never,
        { authorize } as never,
      ).execute(new RestorePageCommand('workspace', 'page', 'member'));

    it('rejects a page in a teamspace the user cannot delete from', async () => {
      await expect(restore()).rejects.toBeInstanceOf(ForbiddenException);
      expect(pageRepo.restoreHierarchy).not.toHaveBeenCalled();
      expect(authorize).toHaveBeenCalledWith(
        expect.objectContaining({
          target: {
            type: 'teamspace',
            id: 'teamspace',
            workspaceId: 'workspace',
          },
        }),
      );
    });

    it('restores a shared page for a workspace member', async () => {
      teamspaceId = null;
      allowed = true;

      await restore();

      expect(pageRepo.restoreHierarchy).toHaveBeenCalledWith('page', {});
      expect(authorize).toHaveBeenCalledWith(
        expect.objectContaining({
          target: { type: 'workspace', id: 'workspace' },
        }),
      );
    });
  });

  it('rejects duplicating a page the user cannot read', async () => {
    authorize.mockImplementation(({ target }: { target: { type: string } }) =>
      Promise.resolve(target.type !== 'page'),
    );

    await expect(
      new DuplicatePageHandler(
        pageRepo as never,
        {} as never,
        uow as never,
        {} as never,
        {} as never,
        { record: jest.fn() } as never,
        { authorize } as never,
      ).execute(new DuplicatePageCommand('member', 'workspace', 'page')),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(pageRepo.save).not.toHaveBeenCalled();
  });

  it('lets only someone with permanent delete remove a database for good', async () => {
    const databaseRepo = { delete: jest.fn(), findById: jest.fn() };

    await expect(
      new PermanentlyDeletePageDatabaseHandler(
        {} as never,
        databaseRepo as never,
        uow as never,
        pageRepo as never,
        { authorize } as never,
      ).execute(
        new PermanentlyDeletePageDatabaseCommand('page', 'database', 'member'),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(databaseRepo.delete).not.toHaveBeenCalled();
    expect(authorize).toHaveBeenCalledWith(
      expect.objectContaining({
        target: { type: 'workspace', id: 'workspace' },
      }),
    );
  });
});
