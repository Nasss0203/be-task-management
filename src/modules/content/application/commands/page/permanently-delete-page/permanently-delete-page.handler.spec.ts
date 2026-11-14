import { ForbiddenException } from '@nestjs/common';
import { PERMISSIONS } from 'src/modules/permission/domain/permissions/permission-code';
import { PermanentlyDeletePageCommand } from './permanently-delete-page.command';
import { PermanentlyDeletePageHandler } from './permanently-delete-page.handler';

describe('PermanentlyDeletePageHandler teamspace access', () => {
  const manager = {};
  let teamspaceId: string | null;
  let pageRepo: {
    lockWorkspaceHierarchy: jest.Mock;
    findDeletedById: jest.Mock;
    deletePermanently: jest.Mock;
  };
  let authorization: { authorize: jest.Mock };
  let handler: PermanentlyDeletePageHandler;

  const command = new PermanentlyDeletePageCommand('workspace', 'page', 'user');

  beforeEach(() => {
    teamspaceId = 'teamspace';
    pageRepo = {
      lockWorkspaceHierarchy: jest.fn().mockResolvedValue(undefined),
      findDeletedById: jest.fn(() =>
        Promise.resolve({
          getWorkspaceId: () => 'workspace',
          getTeamspaceId: () => teamspaceId,
        }),
      ),
      deletePermanently: jest.fn().mockResolvedValue(undefined),
    };
    authorization = { authorize: jest.fn().mockResolvedValue(true) };
    handler = new PermanentlyDeletePageHandler(
      pageRepo as never,
      {
        runInTransaction: jest.fn((fn: (m: unknown) => unknown) => fn(manager)),
      } as never,
      authorization as never,
    );
  });

  it('rejects a page in a teamspace the user cannot see', async () => {
    authorization.authorize.mockResolvedValue(false);

    await expect(handler.execute(command)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(authorization.authorize).toHaveBeenCalledWith({
      userId: 'user',
      permissions: [PERMISSIONS.TEAMSPACE_READ],
      target: { type: 'teamspace', id: 'teamspace', workspaceId: 'workspace' },
    });
    expect(pageRepo.deletePermanently).not.toHaveBeenCalled();
  });

  it('deletes a page in a teamspace the user can see', async () => {
    await handler.execute(command);

    expect(pageRepo.deletePermanently).toHaveBeenCalledWith('page', manager);
  });

  it('skips the teamspace check for a page outside any teamspace', async () => {
    teamspaceId = null;

    await handler.execute(command);

    expect(authorization.authorize).not.toHaveBeenCalled();
    expect(pageRepo.deletePermanently).toHaveBeenCalledWith('page', manager);
  });
});
